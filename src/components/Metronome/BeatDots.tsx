import type { TickPosition } from "../../audio/scheduler";
import styles from "./BeatDots.module.css";

export interface BeatDotsProps {
  beatsPerBar: number;
  /** Current position, or null when the metronome is stopped. */
  position: TickPosition | null;
}

/**
 * One dot per beat; the sounding beat is lit. The lit dot moves in step with
 * the audio clock. With reduced motion it is a plain highlight with no pulse.
 */
export function BeatDots({ beatsPerBar, position }: BeatDotsProps) {
  return (
    <ol className={styles.dots} aria-hidden="true">
      {Array.from({ length: beatsPerBar }, (_, beat) => {
        const active = position !== null && position.beat === beat;
        const classes = [
          styles.dot,
          beat === 0 ? styles.downbeat : "",
          active ? styles.active : "",
        ].join(" ");
        return (
          <li key={beat} className={classes} data-active={active}>
            {beat + 1}
          </li>
        );
      })}
    </ol>
  );
}
