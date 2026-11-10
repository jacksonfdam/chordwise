import { useId, useState } from "react";
import { audioEngine } from "../../audio/audioEngine";
import { clampBpm } from "../../audio/scheduler";
import { findChord } from "../../data/chords";
import { drillTipFor } from "../../data/progressions";
import type { Chord } from "../../domain/types";
import { useMetronome } from "../../hooks/useMetronome";
import { useProgress } from "../../hooks/useProgress";
import ui from "../../styles/ui.module.css";
import { ChordDiagram } from "../ChordDiagram/ChordDiagram";
import { Icon } from "../Icon/Icon";
import { BeatDots } from "../Metronome/BeatDots";
import styles from "./ChordChangeDrill.module.css";
import { drillMoment, nextBpm, roundBars } from "./drillMath";

export interface ChordChangeDrillProps {
  /** Two or more chord ids, played in order and repeated. */
  chordIds: readonly string[];
  startBpm?: number;
  targetBpm?: number;
  /** Tempo added after each clean round. */
  increment?: number;
  barsPerChord?: number;
  /** Key for saved stats; defaults to the chord ids. */
  drillId?: string;
  title?: string;
}

type Phase = "idle" | "playing" | "ask";

export function ChordChangeDrill({
  chordIds,
  startBpm = 60,
  targetBpm = 100,
  increment = 4,
  barsPerChord = 2,
  drillId,
  title,
}: ChordChangeDrillProps) {
  const chords = chordIds
    .map((chordId) => findChord(chordId))
    .filter((chord): chord is Chord => chord !== undefined);
  const statsId = drillId ?? chordIds.join("-");
  const bars = roundBars(chords.length, barsPerChord);
  const target = Math.max(clampBpm(targetBpm), clampBpm(startBpm));

  const { recordDrillRound } = useProgress();
  const [phase, setPhase] = useState<Phase>("idle");
  const [bpm, setBpm] = useState(() => clampBpm(startBpm));
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [cleanBars, setCleanBars] = useState(0);
  const [hearChord, setHearChord] = useState(true);
  const id = useId();

  const metronome = useMetronome({
    bpm,
    timeSignature: "4/4",
    onSchedule: (position, time) => {
      // A strum on the first beat of each new chord, so the target sound is clear.
      if (!hearChord || !position.isDownbeat || position.bar < 1 || position.bar > bars) return;
      if ((position.bar - 1) % barsPerChord !== 0) return;
      const chord = chords[drillMoment(position, chords.length, barsPerChord).currentIndex];
      if (chord) audioEngine.strumChord(chord, { when: time, velocity: 0.7 });
    },
    onTick: (position) => {
      // The downbeat after the last bar ends the round.
      if (position.isDownbeat && position.bar > bars) {
        metronome.stop();
        setPhase("ask");
      }
    },
  });

  if (chords.length < 2) {
    return <p className={ui.muted}>Pick at least two chords to drill.</p>;
  }

  const startRound = () => {
    setPhase("playing");
    metronome.start();
  };

  const stop = () => {
    metronome.stop();
    setPhase("idle");
  };

  const answer = (clean: boolean) => {
    const newStreak = clean ? streak + 1 : 0;
    recordDrillRound(statsId, { clean, streak: newStreak, bpm });
    setStreak(newStreak);
    setLongestStreak((previous) => Math.max(previous, newStreak));
    if (clean) setCleanBars((previous) => previous + bars);
    setBpm(nextBpm(bpm, clean, increment, target));
    // The answer is a tap, so the next round may start right away.
    startRound();
  };

  const position = metronome.position;
  const moment = position ? drillMoment(position, chords.length, barsPerChord) : null;
  const current = chords[moment?.currentIndex ?? 0];
  const next = chords[moment?.nextIndex ?? 1];
  const tip = drillTipFor(chordIds);
  if (!current || !next) return null;

  let cue = "Press start when your hands are ready.";
  if (phase === "ask") cue = "Round finished.";
  else if (moment?.countIn) cue = `Count-in: ${(position?.beat ?? 0) + 1}`;
  else if (moment?.changeNow) cue = `Change now to ${next.name}`;
  else if (moment) cue = `Bar ${moment.barInRound} of ${bars}`;

  const cueIsLive = moment?.changeNow === true || moment?.countIn === true;

  return (
    <section className={styles.drill} aria-labelledby={`${id}-title`}>
      <header className={styles.header}>
        <h3 id={`${id}-title`} className={ui.eyebrow}>
          {title ?? `Change drill: ${chords.map((chord) => chord.name).join(" → ")}`}
        </h3>
        <p className={styles.tempo}>
          <span className={phase === "playing" ? `${styles.bpm} ${ui.live}` : styles.bpm}>
            {bpm}
          </span>
          <abbr className={ui.eyebrow} title="beats per minute">
            BPM
          </abbr>
        </p>
      </header>

      <div className={styles.stage}>
        <div className={styles.current}>
          <p className={ui.eyebrow}>{moment?.countIn || !moment ? "First chord" : "Play now"}</p>
          <p className={styles.currentName}>{current.name}</p>
          <ChordDiagram chord={current} size="md" />
        </div>
        <div className={styles.next}>
          <p className={ui.eyebrow}>Next</p>
          <p className={styles.nextName}>{next.name}</p>
          <ChordDiagram chord={next} size="sm" />
        </div>
      </div>

      <p
        className={cueIsLive ? `${styles.cue} ${styles.cueLive}` : styles.cue}
        data-testid="drill-cue"
      >
        {cue}
      </p>
      <p className="sr-only" aria-live="polite">
        {phase === "playing" && moment && !moment.countIn
          ? `Now ${current.fullName}. Next ${next.fullName}.`
          : ""}
      </p>

      <BeatDots beatsPerBar={4} position={position} />

      {phase === "ask" ? (
        <div className={styles.ask} role="group" aria-labelledby={`${id}-ask`}>
          <p id={`${id}-ask`} className={styles.question}>
            Did you land it cleanly?
          </p>
          <div className={styles.buttons}>
            <button type="button" className={ui.primary} onClick={() => answer(true)}>
              <Icon name="check" />
              Yes
            </button>
            <button type="button" className={ui.button} onClick={() => answer(false)}>
              Not yet
            </button>
          </div>
          <button type="button" className={ui.ghost} onClick={stop}>
            Done for now
          </button>
          <p className={ui.muted}>
            Only you can judge this. A clean round raises the tempo by {increment} BPM, up to{" "}
            {target}.
          </p>
        </div>
      ) : (
        <div className={styles.buttons}>
          {phase === "playing" ? (
            <button type="button" className={ui.button} onClick={stop}>
              <Icon name="stop" />
              Stop
            </button>
          ) : (
            <button type="button" className={ui.primary} onClick={startRound}>
              <Icon name="play" />
              Start drill
            </button>
          )}
          <button
            type="button"
            className={ui.button}
            aria-pressed={hearChord}
            onClick={() => setHearChord((value) => !value)}
          >
            <Icon name="sound" />
            Hear chord
          </button>
        </div>
      )}

      <dl className={styles.metrics}>
        <div>
          <dt className={ui.eyebrow}>Clean bars</dt>
          <dd>{cleanBars}</dd>
        </div>
        <div>
          <dt className={ui.eyebrow}>Streak</dt>
          <dd>{streak}</dd>
        </div>
        <div>
          <dt className={ui.eyebrow}>Longest</dt>
          <dd>{longestStreak}</dd>
        </div>
      </dl>

      {tip && (
        <p className={styles.tip}>
          <span className={ui.eyebrow}>Tip</span> {tip}
        </p>
      )}
    </section>
  );
}
