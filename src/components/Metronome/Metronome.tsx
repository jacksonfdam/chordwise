import { useCallback, useId, useRef, useState } from "react";
import { audioEngine } from "../../audio/audioEngine";
import { clampBpm, MAX_BPM, meterOf, MIN_BPM, type TickPosition } from "../../audio/scheduler";
import type { Chord, StrumPattern as StrumPatternData, TimeSignature } from "../../domain/types";
import { useMetronome } from "../../hooks/useMetronome";
import ui from "../../styles/ui.module.css";
import { Icon } from "../Icon/Icon";
import { StrumHand } from "../StrumHand/StrumHand";
import { StrumPattern } from "../StrumPattern/StrumPattern";
import { BeatDots } from "./BeatDots";
import styles from "./Metronome.module.css";
import { addTap, bpmFromTaps } from "./tapTempo";

export interface MetronomeProps {
  initialBpm?: number;
  initialTimeSignature?: TimeSignature;
  /** Shows the pattern with a moving playhead; the pattern's time signature is used. */
  pattern?: StrumPatternData;
  /** With a pattern, this chord can be strummed along with the click. */
  chord?: Chord;
  /** Heading shown above the controls. */
  title?: string;
}

const TIME_SIGNATURES: readonly TimeSignature[] = ["4/4", "3/4", "6/8"];

/** Schedules the strum for one pattern slot at its exact audio-clock time. */
export function scheduleStroke(
  pattern: StrumPatternData,
  chord: Pick<Chord, "frets">,
  position: TickPosition,
  time: number,
): void {
  const stroke = pattern.grid[position.slot];
  if (stroke === undefined || stroke === "-") return;
  audioEngine.strumChord(chord, {
    direction: stroke === "U" ? "U" : "D",
    when: time,
    velocity: pattern.accents.includes(position.slot) ? 1 : 0.65,
    speedMs: 14,
    muted: stroke === "x",
  });
}

export function Metronome({
  initialBpm = 80,
  initialTimeSignature = "4/4",
  pattern,
  chord,
  title,
}: MetronomeProps) {
  const [bpm, setBpm] = useState(() => clampBpm(initialBpm));
  const [bpmText, setBpmText] = useState(() => String(clampBpm(initialBpm)));
  const [ownSignature, setOwnSignature] = useState<TimeSignature>(initialTimeSignature);
  const [strumAlong, setStrumAlong] = useState(false);
  const tapsRef = useRef<number[]>([]);
  const id = useId();

  const timeSignature = pattern?.timeSignature ?? ownSignature;
  const canStrum = pattern !== undefined && chord !== undefined;

  const metronome = useMetronome({
    bpm,
    timeSignature,
    onSchedule: (position, time) => {
      if (strumAlong && pattern && chord) scheduleStroke(pattern, chord, position, time);
    },
  });

  const applyBpm = useCallback((value: number) => {
    const next = clampBpm(value);
    setBpm(next);
    setBpmText(String(next));
  }, []);

  const handleTap = () => {
    tapsRef.current = addTap(tapsRef.current, performance.now());
    const tapped = bpmFromTaps(tapsRef.current);
    if (tapped !== null) applyBpm(tapped);
  };

  const meter = meterOf(timeSignature);

  return (
    <section className={styles.metronome} aria-labelledby={`${id}-title`}>
      <header className={styles.header}>
        <h3 id={`${id}-title`} className={ui.eyebrow}>
          {title ?? "Metronome"}
        </h3>
        <p className={styles.tempo}>
          <span className={metronome.isRunning ? `${styles.bpm} ${ui.live}` : styles.bpm}>
            {bpm}
          </span>
          <abbr className={ui.eyebrow} title="beats per minute">
            BPM
          </abbr>
        </p>
      </header>

      <BeatDots beatsPerBar={meter.beatsPerBar} position={metronome.position} />

      {pattern && (
        <>
          <StrumHand
            stroke={metronome.position ? (pattern.grid[metronome.position.slot] ?? null) : null}
          />
          <StrumPattern pattern={pattern} activeSlot={metronome.position?.slot ?? null} />
        </>
      )}

      <div className={styles.controls}>
        <button
          type="button"
          className={ui.primary}
          onClick={metronome.toggle}
          aria-pressed={metronome.isRunning}
        >
          <Icon name={metronome.isRunning ? "stop" : "play"} />
          {metronome.isRunning ? "Stop" : "Start"}
        </button>
        <button type="button" className={ui.button} onClick={handleTap}>
          Tap tempo
        </button>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${id}-slider`} className={ui.eyebrow}>
          Tempo
        </label>
        <div className={styles.tempoRow}>
          <button
            type="button"
            className={ui.ghost}
            onClick={() => applyBpm(bpm - 1)}
            aria-label="Slower by 1 BPM"
          >
            −
          </button>
          <input
            id={`${id}-slider`}
            className={ui.range}
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            step={1}
            value={bpm}
            onChange={(event) => applyBpm(Number(event.target.value))}
          />
          <button
            type="button"
            className={ui.ghost}
            onClick={() => applyBpm(bpm + 1)}
            aria-label="Faster by 1 BPM"
          >
            +
          </button>
          <input
            className={`${ui.input} ${styles.number}`}
            type="number"
            inputMode="numeric"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpmText}
            aria-label="Tempo in beats per minute"
            onChange={(event) => {
              setBpmText(event.target.value);
              const value = Number(event.target.value);
              if (value >= MIN_BPM && value <= MAX_BPM) setBpm(Math.round(value));
            }}
            onBlur={() => applyBpm(Number(bpmText))}
          />
        </div>
      </div>

      {!pattern && (
        <fieldset className={styles.field}>
          <legend className={ui.eyebrow}>Time signature</legend>
          <div className={ui.row}>
            {TIME_SIGNATURES.map((signature) => (
              <button
                key={signature}
                type="button"
                className={ui.chipButton}
                aria-pressed={ownSignature === signature}
                onClick={() => setOwnSignature(signature)}
              >
                {signature}
              </button>
            ))}
          </div>
          {ownSignature === "6/8" && (
            <p className={ui.muted}>In 6/8 the click counts the six eighth notes of each bar.</p>
          )}
        </fieldset>
      )}

      {canStrum && (
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={strumAlong}
            onChange={(event) => setStrumAlong(event.target.checked)}
          />
          Play the {chord.name} chord along with the pattern
        </label>
      )}
    </section>
  );
}
