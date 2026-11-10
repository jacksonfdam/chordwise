import { fretFrequency, noteNameAt, STRING_INDEXES, STRING_NAMES } from "../../domain/fretboard";
import type { StringIndex } from "../../domain/types";
import { useAudio } from "../../hooks/useAudio";
import { useProgress } from "../../hooks/useProgress";
import styles from "./Fretboard.module.css";

export interface FretboardProps {
  /** Strings whose notes are labeled. Defaults to the two root-note strings (6 and 5). */
  labeledStrings?: readonly StringIndex[];
  /** Highest fret shown. */
  frets?: number;
}

const WIDTH = 520;
const HEIGHT = 150;
const LEFT = 34;
const RIGHT = WIDTH - 10;
const TOP = 22;
const STRING_GAP = 20;
const INLAYS = [3, 5, 7, 9, 12];

/**
 * A horizontal fretboard, nut on the left, thickest string at the top (the
 * way it looks when you glance down at your own guitar). Notes on the labeled
 * strings can be tapped to hear them.
 */
export function Fretboard({ labeledStrings = [0, 1], frets = 12 }: FretboardProps) {
  const { pluck } = useAudio();
  const { settings } = useProgress();
  const fretWidth = (RIGHT - LEFT) / frets;
  const flip = settings.leftHanded;
  const mirror = (x: number) => (flip ? WIDTH - x : x);
  const fretX = (fret: number) => mirror(LEFT + fret * fretWidth);
  const noteX = (fret: number) => mirror(fret === 0 ? LEFT - 16 : LEFT + (fret - 0.5) * fretWidth);
  const stringY = (string: StringIndex) => TOP + string * STRING_GAP;
  const bottom = stringY(5);

  return (
    <div className={styles.scroll}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="group"
        aria-label={`Fretboard with note names on ${labeledStrings
          .map((string) => `the ${STRING_NAMES[string]} string`)
          .join(" and ")}`}
      >
        <rect
          className={styles.slab}
          x={Math.min(fretX(0), fretX(frets))}
          y={TOP - 4}
          width={RIGHT - LEFT}
          height={bottom - TOP + 16}
          rx={4}
        />
        <rect
          className={styles.board}
          x={Math.min(fretX(0), fretX(frets))}
          y={TOP - 8}
          width={RIGHT - LEFT}
          height={bottom - TOP + 16}
          rx={4}
        />
        {Array.from({ length: frets }, (_, index) => index + 1).map((fret) => (
          <g key={fret}>
            <line
              className={styles.fret}
              x1={fretX(fret)}
              x2={fretX(fret)}
              y1={TOP - 8}
              y2={bottom + 8}
            />
            <text className={styles.fretNumber} x={noteX(fret)} y={HEIGHT - 6} textAnchor="middle">
              {fret}
            </text>
            {INLAYS.includes(fret) && (
              <circle className={styles.inlay} cx={noteX(fret)} cy={(TOP + bottom) / 2} r={3} />
            )}
          </g>
        ))}
        <line className={styles.nut} x1={fretX(0)} x2={fretX(0)} y1={TOP - 8} y2={bottom + 8} />
        {STRING_INDEXES.map((string) => (
          <line
            key={string}
            className={styles.string}
            x1={fretX(0)}
            x2={fretX(frets)}
            y1={stringY(string)}
            y2={stringY(string)}
            strokeWidth={1 + (5 - string) * 0.25}
          />
        ))}
        {labeledStrings.map((string) =>
          Array.from({ length: frets + 1 }, (_, fret) => {
            const note = noteNameAt(string, fret);
            const natural = !note.includes("#");
            return (
              <g
                key={`${string}-${fret}`}
                className={natural ? styles.note : `${styles.note} ${styles.sharp}`}
                role="button"
                tabIndex={0}
                aria-label={`${note}: ${STRING_NAMES[string]} string, ${fret === 0 ? "open" : `fret ${fret}`}`}
                onClick={() => pluck(fretFrequency(string, fret))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    pluck(fretFrequency(string, fret));
                  }
                }}
              >
                <circle cx={noteX(fret)} cy={stringY(string)} r={9} />
                <text
                  x={noteX(fret)}
                  y={stringY(string)}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {note}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
