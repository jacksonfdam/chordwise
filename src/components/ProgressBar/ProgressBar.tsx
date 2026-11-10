import styles from "./ProgressBar.module.css";

export interface ProgressBarProps {
  value: number;
  max: number;
  /** Accessible name, e.g. "Beginner lessons completed". */
  label: string;
  /** Show "3 / 11" beside the bar. */
  showCount?: boolean;
}

export function ProgressBar({ value, max, label, showCount = true }: ProgressBarProps) {
  const safeMax = Math.max(1, max);
  const clamped = Math.min(safeMax, Math.max(0, value));
  const percent = (clamped / safeMax) * 100;
  return (
    <div className={styles.wrap}>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
        aria-valuetext={`${clamped} of ${safeMax}`}
      >
        <div
          className={clamped > 0 ? `${styles.fill} ${styles.fillLive}` : styles.fill}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showCount && (
        <span className={styles.count} aria-hidden="true">
          {clamped} / {safeMax}
        </span>
      )}
    </div>
  );
}
