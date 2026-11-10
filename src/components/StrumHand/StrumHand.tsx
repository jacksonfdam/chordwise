import type { StrumStroke } from "../../domain/types";
import styles from "./StrumHand.module.css";

export interface StrumHandProps {
  /** The stroke sounding right now, or null when nothing is playing. */
  stroke: StrumStroke | null;
}

type HandState = "idle" | "down" | "up" | "rest";

const PICTURES: readonly { state: HandState; src: string }[] = [
  { state: "idle", src: "/hands/strum-idle.webp" },
  { state: "down", src: "/hands/strum-down.webp" },
  { state: "up", src: "/hands/strum-up.webp" },
  { state: "rest", src: "/hands/strum-rest.webp" },
];

const STATE_OF: Record<StrumStroke, HandState> = { D: "down", U: "up", x: "down", "-": "rest" };

const CAPTION: Record<StrumStroke, string> = {
  D: "Down-strum",
  U: "Up-strum",
  x: "Muted hit",
  "-": "Rest: the hand keeps moving but misses the strings",
};

/**
 * The strumming hand. One picture per kind of stroke; the one that matches
 * the stroke being played is shown, in step with the metronome.
 */
export function StrumHand({ stroke }: StrumHandProps) {
  const state: HandState = stroke === null ? "idle" : STATE_OF[stroke];
  return (
    <figure className={styles.figure} data-state={state}>
      <div
        className={styles.stage}
        role="img"
        aria-label="Strumming hand over the sound hole. It moves down on a down-strum, up on an up-strum, and passes the strings without touching them on a rest."
      >
        {/* All pictures stay loaded, so switching is instant and in time. */}
        {PICTURES.map((picture) => (
          <img
            key={picture.state}
            className={picture.state === state ? `${styles.frame} ${styles.frameOn}` : styles.frame}
            src={picture.src}
            width={560}
            height={560}
            decoding="async"
            alt=""
            data-frame={picture.state}
          />
        ))}
      </div>
      <figcaption className={styles.caption} data-testid="strum-caption">
        {stroke === null ? "Press start to see the strumming hand move." : CAPTION[stroke]}
      </figcaption>
    </figure>
  );
}
