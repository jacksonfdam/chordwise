import { slotLabels } from "../../data/strumPatterns";
import type { StrumPattern as StrumPatternData, StrumStroke } from "../../domain/types";
import styles from "./StrumPattern.module.css";

export interface StrumPatternProps {
  pattern: StrumPatternData;
  /** Slot the playhead is on, or null when stopped. */
  activeSlot?: number | null;
}

const STROKE_WORDS: Record<StrumStroke, string> = {
  D: "down",
  U: "up",
  x: "muted",
  "-": "rest",
};

function StrokeGlyph({ stroke }: { stroke: StrumStroke }) {
  switch (stroke) {
    case "D":
      return <path d="M12 3v17M5 13l7 7 7-7" />;
    case "U":
      return <path d="M12 21V4M5 11l7-7 7 7" />;
    case "x":
      return <path d="M6 6l12 12M18 6L6 18" />;
    case "-":
      return <path d="M9 12h6" />;
  }
}

/** Spoken version of a pattern: "down, rest, down, up, ...". */
export function describePattern(pattern: StrumPatternData): string {
  const strokes = pattern.grid.map((stroke) => STROKE_WORDS[stroke]).join(", ");
  return `${pattern.name} strumming pattern in ${pattern.timeSignature}: ${strokes}.`;
}

export function StrumPattern({ pattern, activeSlot = null }: StrumPatternProps) {
  const labels = slotLabels(pattern);
  return (
    <div className={styles.wrap}>
      <ol
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${pattern.grid.length}, minmax(0, 1fr))` }}
        aria-label={describePattern(pattern)}
      >
        {pattern.grid.map((stroke, index) => {
          const accent = pattern.accents.includes(index);
          const active = activeSlot === index;
          const classes = [
            styles.slot,
            stroke === "-" ? styles.rest : "",
            accent ? styles.accent : "",
            active ? styles.active : "",
            index % 2 === 0 ? styles.onBeat : "",
          ].join(" ");
          return (
            <li
              key={index}
              className={classes}
              data-stroke={stroke}
              aria-current={active ? "step" : undefined}
            >
              <svg
                className={styles.glyph}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <StrokeGlyph stroke={stroke} />
              </svg>
              <span className="sr-only">
                {STROKE_WORDS[stroke]}
                {accent ? ", accented" : ""}
              </span>
              <span className={styles.count} aria-hidden="true">
                {labels[index]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
