import type { TimerStatus } from "../../hooks/useTimer";
import styles from "./Timer.module.css";

export interface TimerProps {
  remainingSec: number;
  /** 0 to 1. */
  progress: number;
  status: TimerStatus;
  /** Short caption under the number, e.g. "seconds". */
  caption?: string;
}

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : String(seconds);
}

const STATUS_TEXT: Record<TimerStatus, string> = {
  idle: "ready",
  running: "running",
  paused: "paused",
  done: "done",
};

/** Circular countdown. It is not a live region: step changes are announced elsewhere. */
export function Timer({ remainingSec, progress, status, caption }: TimerProps) {
  const live = status === "running";
  return (
    <div
      className={styles.timer}
      role="timer"
      aria-label={`${remainingSec} seconds left, ${STATUS_TEXT[status]}`}
      data-status={status}
    >
      <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
        <circle className={styles.track} cx="50" cy="50" r={RADIUS} />
        <circle
          className={live ? `${styles.bar} ${styles.barLive}` : styles.bar}
          cx="50"
          cy="50"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * progress}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className={styles.readout} aria-hidden="true">
        <span className={live ? `${styles.number} ${styles.numberLive}` : styles.number}>
          {formatSeconds(remainingSec)}
        </span>
        <span className={styles.caption}>{caption ?? STATUS_TEXT[status]}</span>
      </div>
    </div>
  );
}
