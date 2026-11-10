import { useId } from "react";
import { Link } from "react-router-dom";
import type { TickPosition } from "../../audio/scheduler";
import { meterOf } from "../../audio/scheduler";
import { findChord } from "../../data/chords";
import { nextLesson } from "../../data/lessons";
import type { Chord, Lesson, Step, StrumPattern as StrumPatternData } from "../../domain/types";
import ui from "../../styles/ui.module.css";
import { ChordChangeDrill } from "../ChordChangeDrill/ChordChangeDrill";
import { ChordDiagram } from "../ChordDiagram/ChordDiagram";
import { Fretboard } from "../Fretboard/Fretboard";
import { OpenStrings } from "../Fretboard/OpenStrings";
import { RootNoteTable } from "../Fretboard/RootNoteTable";
import { GuitarParts } from "../GuitarParts/GuitarParts";
import { HandDiagram } from "../HandDiagram/HandDiagram";
import { HandPicture } from "../HandDiagram/HandPicture";
import { Icon } from "../Icon/Icon";
import { BeatDots } from "../Metronome/BeatDots";
import { PluckStrings } from "../StrumHand/PluckStrings";
import { StrumHand } from "../StrumHand/StrumHand";
import { StrumPattern } from "../StrumPattern/StrumPattern";
import { HoldCycle } from "./HoldCycle";
import { Quiz } from "./Quiz";
import styles from "./StepPlayer.module.css";

export interface StepStageProps {
  lesson: Lesson;
  step: Step;
  chord: Chord | undefined;
  pattern: StrumPatternData | undefined;
  elapsedMs: number;
  metronomeRunning: boolean;
  metronomePosition: TickPosition | null;
  onToggleMetronome: () => void;
  onPlayChord: (chord: Chord) => void;
}

const ANATOMY: readonly { term: string; meaning: string }[] = [
  { term: "Vertical lines", meaning: "The six strings. The thickest string is on the low-E side." },
  { term: "Horizontal lines", meaning: "The frets. Each row is one fret space." },
  { term: "Thick top line", meaning: "The nut, where the neck begins." },
  { term: "Dots", meaning: "Where your fingertips press." },
  { term: "Numbers", meaning: "Which finger: 1 index, 2 middle, 3 ring, 4 pinky." },
  { term: "Circle above a string", meaning: "Open string: play it without pressing." },
  { term: "X above a string", meaning: "Muted string: do not play it." },
  { term: "A label like 5fr", meaning: "The diagram starts at that fret instead of at the nut." },
];

function Checklist({ items }: { items: readonly string[] }) {
  const id = useId();
  return (
    <ul className={styles.checklist}>
      {items.map((item, index) => (
        <li key={item}>
          <label className={styles.check} htmlFor={`${id}-${index}`}>
            <input id={`${id}-${index}`} type="checkbox" />
            <span>{item}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function Summary({ lesson, step }: { lesson: Lesson; step: Step }) {
  const upcoming = nextLesson(lesson.id);
  const chords = lesson.chordIds
    .map((chordId) => findChord(chordId))
    .filter((chord): chord is Chord => chord !== undefined);
  return (
    <div className={styles.summary}>
      <section aria-labelledby="summary-learned">
        <h3 id="summary-learned" className={ui.eyebrow}>
          What you learned
        </h3>
        <ul className={styles.goals}>
          {lesson.goals.map((goal) => (
            <li key={goal}>
              <Icon name="check" size={16} />
              <span>{goal}</span>
            </li>
          ))}
        </ul>
      </section>
      {step.checklist && step.checklist.length > 0 && (
        <section aria-labelledby="summary-check">
          <h3 id="summary-check" className={ui.eyebrow}>
            Check yourself
          </h3>
          <Checklist items={step.checklist} />
        </section>
      )}
      {chords.length > 0 && (
        <section aria-labelledby="summary-chords">
          <h3 id="summary-chords" className={ui.eyebrow}>
            Chords in the library
          </h3>
          <ul className={ui.row}>
            {chords.map((chord) => (
              <li key={chord.id}>
                <Link className={ui.chipButton} to={`/chords/${chord.id}`}>
                  {chord.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className={ui.row}>
        {upcoming ? (
          <Link className={ui.primary} to={`/lessons/${upcoming.id}`}>
            Next: {upcoming.title}
            <Icon name="arrow" />
          </Link>
        ) : (
          <Link className={ui.primary} to="/tools">
            Keep practicing with the tools
            <Icon name="arrow" />
          </Link>
        )}
        <Link className={ui.button} to="/lessons">
          All lessons
        </Link>
      </div>
    </div>
  );
}

/** Everything shown on the stage for one step: diagram, illustration, exercise. */
export function StepStage({
  lesson,
  step,
  chord,
  pattern,
  elapsedMs,
  metronomeRunning,
  metronomePosition,
  onToggleMetronome,
  onPlayChord,
}: StepStageProps) {
  const compare = step.compareChordId ? findChord(step.compareChordId) : undefined;
  const showsRhythm = step.action === "metronome" || pattern !== undefined;
  const timeSignature = pattern?.timeSignature ?? "4/4";

  return (
    <div className={styles.stageBody}>
      {chord && (
        <div className={styles.diagram}>
          <p className={styles.chordName}>
            {chord.name} <span className={styles.chordFull}>{chord.fullName}</span>
          </p>
          <div className={styles.diagramRow}>
            <ChordDiagram
              chord={chord}
              size="lg"
              highlightFingers={step.highlightFingers}
              highlightStrings={step.highlightStrings}
              animateIn={step.action === "place" || step.autoplayChord === true}
              showNoteNames={step.visual === "diagram-anatomy"}
            />
            <HandDiagram chord={chord} size="lg" />
          </div>
        </div>
      )}

      {chord && compare && (
        <div className={styles.compare} role="group" aria-label="Compare the two chords">
          <button type="button" className={ui.button} onClick={() => onPlayChord(chord)}>
            <Icon name="sound" />
            Hear {chord.name}
          </button>
          <button type="button" className={ui.button} onClick={() => onPlayChord(compare)}>
            <Icon name="sound" />
            Hear {compare.name}
          </button>
        </div>
      )}

      {/* Checking a chord means picking its strings one at a time. */}
      {chord && step.action === "strum" && !pattern && (
        <PluckStrings key={chord.id} chord={chord} />
      )}

      {(step.visual === "thumb-behind-neck" ||
        step.visual === "picking-hand-position" ||
        step.visual === "thumb-strum") && <HandPicture name={step.visual} />}
      {step.visual === "guitar-parts" && <GuitarParts />}
      {step.visual === "string-names" && <OpenStrings mode="names" />}
      {step.visual === "tuner" && <OpenStrings mode="tuner" />}
      {step.visual === "root-notes" && (
        <>
          <Fretboard />
          <RootNoteTable />
        </>
      )}
      {step.visual === "diagram-anatomy" && (
        <dl className={styles.anatomy}>
          {ANATOMY.map((entry) => (
            <div key={entry.term}>
              <dt>{entry.term}</dt>
              <dd>{entry.meaning}</dd>
            </div>
          ))}
        </dl>
      )}
      {step.visual === "mistakes" && chord && (
        <ul className={styles.mistakes}>
          {chord.commonMistakes.map((mistake) => (
            <li key={mistake.problem} className={styles.mistake}>
              <p className={ui.eyebrow}>Problem</p>
              <p className={styles.problem}>{mistake.problem}</p>
              <p className={ui.eyebrow}>Fix</p>
              <p>{mistake.fix}</p>
            </li>
          ))}
        </ul>
      )}

      {step.action === "hold" && step.holdCycle && (
        <HoldCycle cycle={step.holdCycle} elapsedMs={elapsedMs} />
      )}

      {step.action === "drill" && step.drillChordIds && (
        <ChordChangeDrill
          key={step.id}
          chordIds={step.drillChordIds}
          startBpm={step.bpm ?? 60}
          targetBpm={(step.bpm ?? 60) + 24}
          barsPerChord={step.barsPerChord ?? 2}
          drillId={step.id}
        />
      )}

      {step.action !== "drill" && showsRhythm && (
        <div className={styles.rhythm}>
          <div className={styles.rhythmHeader}>
            <p className={ui.eyebrow}>
              {pattern ? pattern.name : "Metronome"} · {step.bpm ?? 60} BPM · {timeSignature}
            </p>
            <button
              type="button"
              className={ui.button}
              aria-pressed={metronomeRunning}
              onClick={onToggleMetronome}
            >
              <Icon name={metronomeRunning ? "stop" : "play"} />
              {metronomeRunning ? "Stop click" : "Start click"}
            </button>
          </div>
          <BeatDots beatsPerBar={meterOf(timeSignature).beatsPerBar} position={metronomePosition} />
          {pattern && (
            <>
              <StrumHand
                stroke={metronomePosition ? (pattern.grid[metronomePosition.slot] ?? null) : null}
              />
              <StrumPattern pattern={pattern} activeSlot={metronomePosition?.slot ?? null} />
              <p className={ui.muted}>{pattern.description}</p>
            </>
          )}
        </div>
      )}

      {step.action === "quiz" && step.quiz && <Quiz key={step.id} quiz={step.quiz} />}

      {step.visual === "summary" ? (
        <Summary lesson={lesson} step={step} />
      ) : (
        step.checklist &&
        step.checklist.length > 0 && (
          <section aria-label="Self-check">
            <p className={ui.eyebrow}>Check yourself</p>
            <Checklist items={step.checklist} />
          </section>
        )
      )}
    </div>
  );
}
