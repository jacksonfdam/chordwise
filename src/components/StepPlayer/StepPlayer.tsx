import { useCallback, useEffect, useRef, useState } from "react";
import { findChord } from "../../data/chords";
import { findStrumPattern } from "../../data/strumPatterns";
import type { Chord, Lesson, Step } from "../../domain/types";
import { useAudio } from "../../hooks/useAudio";
import { useMetronome } from "../../hooks/useMetronome";
import { useTimer } from "../../hooks/useTimer";
import ui from "../../styles/ui.module.css";
import { Icon } from "../Icon/Icon";
import { scheduleStroke } from "../Metronome/Metronome";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { Timer } from "../Timer/Timer";
import styles from "./StepPlayer.module.css";
import { StepStage } from "./StepStage";

export interface StepPlayerProps {
  lesson: Lesson;
  initialStepIndex?: number;
  /** Called whenever a different step is shown. */
  onStepChange?: (index: number) => void;
  /** Called once when the last step is finished. */
  onComplete?: () => void;
  onExit: () => void;
  initialAutoAdvance?: boolean;
  /** Length of the "get ready" countdown before hands-on steps. */
  getReadySec?: number;
}

const HANDS_ON: ReadonlySet<Step["action"]> = new Set([
  "place",
  "strum",
  "hold",
  "drill",
  "metronome",
]);

const ACTION_LABEL: Record<Step["action"], string> = {
  read: "Read",
  place: "Place your fingers",
  strum: "Strum",
  hold: "Hold and release",
  drill: "Drill",
  metronome: "Play with the click",
  quiz: "Quiz",
};

/** True when a key press belongs to a form control rather than to the player. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

/** Space on a focused button or link must keep its normal meaning. */
function isActivatable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest("button, a, summary, [role='button']") !== null;
}

export function StepPlayer({
  lesson,
  initialStepIndex = 0,
  onStepChange,
  onComplete,
  onExit,
  initialAutoAdvance = true,
  getReadySec = 3,
}: StepPlayerProps) {
  const lastIndex = lesson.steps.length - 1;
  const [index, setIndex] = useState(() => Math.min(Math.max(0, initialStepIndex), lastIndex));
  const [playing, setPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(initialAutoAdvance);
  const [gettingReady, setGettingReady] = useState(false);
  const [finished, setFinished] = useState(false);

  // The index is clamped to the step list, so a step always exists.
  const step = lesson.steps[index] as Step;
  const chord = step.chordId ? findChord(step.chordId) : undefined;
  const pattern = step.strumPatternId ? findStrumPattern(step.strumPatternId) : undefined;
  const isLast = index === lastIndex;
  const isDrill = step.action === "drill";

  const audio = useAudio();
  const stageRef = useRef<HTMLDivElement>(null);

  const metronome = useMetronome({
    bpm: step.bpm ?? 60,
    timeSignature: pattern?.timeSignature ?? "4/4",
    onSchedule: (position, time) => {
      if (pattern && chord) scheduleStroke(pattern, chord, position, time);
    },
  });

  const finishedRef = useRef(false);
  const complete = useCallback(() => {
    setPlaying(false);
    setFinished(true);
    if (finishedRef.current) return;
    finishedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  const timer = useTimer({
    durationSec: step.durationSec,
    onComplete: () => {
      if (isLast) complete();
      else if (autoAdvance) goTo(index + 1, true);
    },
  });

  const readyTimer = useTimer({
    durationSec: getReadySec,
    onComplete: () => {
      setGettingReady(false);
      timer.start();
    },
  });

  const playChord = useCallback(
    (target: Chord) => {
      audio.strum(target, { direction: "D", speedMs: 28 });
    },
    [audio],
  );

  function goTo(nextIndex: number, viaAutoAdvance = false) {
    if (nextIndex < 0 || nextIndex > lastIndex || nextIndex === index) return;
    const nextStep = lesson.steps[nextIndex];
    if (!nextStep) return;

    metronome.stop();
    readyTimer.reset();
    timer.reset(nextStep.durationSec);
    setIndex(nextIndex);
    onStepChange?.(nextIndex);

    if (playing) {
      if (viaAutoAdvance && HANDS_ON.has(nextStep.action) && getReadySec > 0) {
        setGettingReady(true);
        readyTimer.reset(getReadySec);
        readyTimer.start();
      } else {
        setGettingReady(false);
        timer.start();
      }
    } else {
      setGettingReady(false);
    }

    const nextChord = nextStep.chordId ? findChord(nextStep.chordId) : undefined;
    // Only sounds if audio was already unlocked by an earlier tap; otherwise the prompt shows.
    if (nextStep.autoplayChord && nextChord) playChord(nextChord);
  }

  const togglePlay = () => {
    if (gettingReady) {
      readyTimer.reset();
      setGettingReady(false);
      setPlaying(false);
      return;
    }
    if (timer.status === "running") {
      timer.pause();
      setPlaying(false);
      return;
    }
    if (timer.status === "paused") timer.resume();
    else {
      timer.start();
      if (step.autoplayChord && chord) playChord(chord);
    }
    setPlaying(true);
  };

  const next = () => {
    if (isLast) complete();
    else goTo(index + 1);
  };
  const previous = () => goTo(index - 1);
  const replay = () => {
    if (chord) playChord(chord);
  };
  const toggleMetronome = () => {
    if (!isDrill) metronome.toggle();
  };

  // Keyboard shortcuts read the latest handlers without re-binding on every render.
  const shortcuts = useRef({ togglePlay, next, previous, replay, toggleMetronome, onExit });
  useEffect(() => {
    shortcuts.current = { togglePlay, next, previous, replay, toggleMetronome, onExit };
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;
      const actions = shortcuts.current;
      switch (event.key) {
        case " ":
          if (isActivatable(event.target)) return;
          event.preventDefault();
          actions.togglePlay();
          break;
        case "ArrowRight":
          actions.next();
          break;
        case "ArrowLeft":
          actions.previous();
          break;
        case "r":
        case "R":
          actions.replay();
          break;
        case "m":
        case "M":
          actions.toggleMetronome();
          break;
        case "Escape":
          actions.onExit();
          break;
        default:
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // A new step starts at the top of the stage.
  useEffect(() => {
    stageRef.current?.scrollTo?.({ top: 0 });
  }, [index]);

  const running = timer.status === "running" || gettingReady;
  const stepLabel = `Step ${index + 1} of ${lesson.steps.length}`;
  let announcement = `${stepLabel}: ${step.title}`;
  if (gettingReady) announcement = `Get ready: ${step.title}`;
  if (finished) announcement = "Lesson complete.";

  const wantsSound =
    chord !== undefined || step.visual === "tuner" || step.visual === "string-names";
  const timeIsUp = timer.status === "done" && !isLast && !autoAdvance;

  return (
    <div className={styles.player}>
      <a className="skip-link" href="#step">
        Skip to the step
      </a>

      <header className={styles.topBar}>
        <div className={styles.titles}>
          <p className={ui.eyebrow}>
            Lesson {String(lesson.order).padStart(2, "0")} · {stepLabel}
          </p>
          <h1 className={styles.lessonTitle}>{lesson.title}</h1>
        </div>
        <button type="button" className={ui.ghost} onClick={onExit} aria-label="Close lesson">
          <Icon name="close" />
        </button>
        <div className={styles.progress}>
          <ProgressBar
            value={finished ? lesson.steps.length : index}
            max={lesson.steps.length}
            label="Steps finished in this lesson"
            showCount={false}
          />
        </div>
      </header>

      <p className="sr-only" aria-live="polite" role="status">
        {announcement}
      </p>

      <main id="step" className={styles.main} tabIndex={-1}>
        <article key={step.id} ref={stageRef} className={styles.stage} aria-labelledby="step-title">
          <p className={ui.eyebrow}>{ACTION_LABEL[step.action]}</p>
          <h2 id="step-title" className={styles.stepTitle}>
            {step.title}
          </h2>
          <p className={styles.body}>{step.body}</p>
          <StepStage
            lesson={lesson}
            step={step}
            chord={chord}
            pattern={pattern}
            elapsedMs={timer.elapsedMs}
            metronomeRunning={metronome.isRunning}
            metronomePosition={metronome.position}
            onToggleMetronome={toggleMetronome}
            onPlayChord={playChord}
          />
        </article>

        <aside className={styles.panel} aria-label="Timer">
          {gettingReady ? (
            <div className={styles.ready}>
              <p className={ui.eyebrow}>Get ready</p>
              <p className={styles.readyNumber}>{readyTimer.remainingSec}</p>
              <p className={ui.muted}>Hands on the guitar.</p>
            </div>
          ) : (
            <Timer
              remainingSec={timer.remainingSec}
              progress={timer.progress}
              status={timer.status}
            />
          )}
          <div className={styles.panelText}>
            {finished ? (
              <p className={ui.live}>Lesson complete. Nice work.</p>
            ) : timeIsUp ? (
              <p>Time is up. Take longer if you need it, then press Next.</p>
            ) : (
              <p className={ui.muted}>
                The timer is a suggestion. Pause or repeat a step whenever you like.
              </p>
            )}
            {audio.needsUnlock && wantsSound && (
              <button
                type="button"
                className={ui.button}
                onClick={() => {
                  void audio.unlock().then(() => {
                    if (chord) playChord(chord);
                  });
                }}
              >
                <Icon name="sound" />
                Tap to enable sound
              </button>
            )}
          </div>
        </aside>
      </main>

      <nav className={styles.controls} aria-label="Lesson controls">
        <div className={styles.primaryControls}>
          <button type="button" className={ui.button} onClick={previous} disabled={index === 0}>
            <Icon name="previous" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            className={ui.primary}
            onClick={togglePlay}
            aria-label={running ? "Pause timer" : "Play timer"}
          >
            <Icon name={running ? "pause" : "play"} />
            <span>{running ? "Pause" : "Play"}</span>
          </button>
          <button type="button" className={ui.button} onClick={next}>
            <span>{isLast ? "Finish" : "Next"}</span>
            <Icon name={isLast ? "check" : "next"} />
          </button>
        </div>
        <div className={styles.secondaryControls}>
          <button
            type="button"
            className={ui.ghost}
            onClick={replay}
            disabled={!chord}
            aria-label="Replay sound"
            title="Replay sound (R)"
          >
            <Icon name="sound" />
            <span>Sound</span>
          </button>
          <button
            type="button"
            className={ui.ghost}
            onClick={() => setAutoAdvance((value) => !value)}
            aria-pressed={autoAdvance}
            aria-label="Auto-advance"
            title="Move to the next step when the timer ends"
          >
            <Icon name="auto" />
            <span>Auto</span>
          </button>
          <button
            type="button"
            className={ui.ghost}
            onClick={toggleMetronome}
            aria-pressed={metronome.isRunning}
            disabled={isDrill}
            aria-label="Metronome"
            title={isDrill ? "The drill has its own click" : "Metronome (M)"}
          >
            <Icon name="metronome" />
            <span>Click</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
