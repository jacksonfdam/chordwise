import {
  describeChord,
  isFretted,
  noteNameAt,
  STRING_INDEXES,
  STRING_NAMES,
} from "../../domain/fretboard";
import type { Chord, Finger, StringIndex } from "../../domain/types";
import { DIAGRAM_FRET_ROWS } from "../../domain/validate";
import { useProgress } from "../../hooks/useProgress";
import styles from "./ChordDiagram.module.css";

export type ChordDiagramSize = "sm" | "md" | "lg";

export interface ChordDiagramProps {
  chord: Chord;
  size?: ChordDiagramSize;
  /** Fingers to emphasize; the rest are dimmed but stay visible. */
  highlightFingers?: readonly Finger[];
  highlightStrings?: readonly StringIndex[];
  /** Defaults to the user's setting. */
  showFingerNumbers?: boolean;
  showNoteNames?: boolean;
  /** Fingers appear one by one. Ignored when motion is reduced. */
  animateIn?: boolean;
  /** Mirrors the diagram. Defaults to the user's setting. */
  leftHanded?: boolean;
}

/* Fixed geometry: the viewBox never changes, so the diagram cannot shift the layout. */
const VIEW_WIDTH = 140;
const VIEW_HEIGHT = 176;
const STRING_X0 = 30;
const STRING_GAP = 16;
const NUT_Y = 34;
const ROW_HEIGHT = 24;
const MARKER_Y = 20;
const DOT_RADIUS = 7.5;
const BOARD_BOTTOM = NUT_Y + ROW_HEIGHT * DIAGRAM_FRET_ROWS;
const NOTE_Y = BOARD_BOTTOM + 16;
const STAGGER_MS = 140;

interface Dot {
  string: StringIndex;
  fret: number;
  finger: Finger;
}

export function ChordDiagram({
  chord,
  size = "md",
  highlightFingers,
  highlightStrings,
  showFingerNumbers,
  showNoteNames = false,
  animateIn = false,
  leftHanded,
}: ChordDiagramProps) {
  const { settings } = useProgress();
  const mirrored = leftHanded ?? settings.leftHanded;
  const numbers = showFingerNumbers ?? settings.showFingerNumbers;

  const xOf = (string: number) => STRING_X0 + (mirrored ? 5 - string : string) * STRING_GAP;
  const yOf = (fret: number) => NUT_Y + (fret - chord.baseFret + 0.5) * ROW_HEIGHT;

  const barres = chord.barres ?? [];
  const underBarre = (string: StringIndex, fret: number) =>
    barres.some(
      (barre) => barre.fret === fret && string >= barre.fromString && string <= barre.toString,
    );

  const dots: Dot[] = [];
  for (const string of STRING_INDEXES) {
    const fret = chord.frets[string];
    if (isFretted(fret) && !underBarre(string, fret)) {
      dots.push({ string, fret, finger: chord.fingers[string] });
    }
  }

  const hasHighlight = highlightFingers !== undefined && highlightFingers.length > 0;
  const fingerState = (finger: Finger) => {
    if (!hasHighlight) return styles.plain;
    return highlightFingers.includes(finger) ? styles.hot : styles.dim;
  };
  const stringIsHot = (string: StringIndex) => highlightStrings?.includes(string) ?? false;

  const boardLeft = STRING_X0;
  const boardRight = STRING_X0 + STRING_GAP * 5;
  const label = describeChord(chord);
  let appearIndex = 0;
  const appearStyle = () =>
    animateIn ? { animationDelay: `${appearIndex++ * STAGGER_MS}ms` } : undefined;

  return (
    <figure className={`${styles.figure} ${styles[size]}`}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={label}
        data-chord={chord.id}
      >
        {/* Fretboard drawn as a thin plate: a lower edge hints at depth. */}
        <rect
          className={styles.slab}
          x={boardLeft - 9}
          y={NUT_Y + 5}
          width={boardRight - boardLeft + 18}
          height={BOARD_BOTTOM - NUT_Y + 4}
          rx={6}
        />
        <rect
          className={styles.board}
          x={boardLeft - 9}
          y={NUT_Y - 2}
          width={boardRight - boardLeft + 18}
          height={BOARD_BOTTOM - NUT_Y + 6}
          rx={6}
        />

        {Array.from({ length: DIAGRAM_FRET_ROWS }, (_, row) => (
          <line
            key={row}
            className={styles.fretLine}
            x1={boardLeft}
            x2={boardRight}
            y1={NUT_Y + ROW_HEIGHT * (row + 1)}
            y2={NUT_Y + ROW_HEIGHT * (row + 1)}
          />
        ))}

        {chord.baseFret === 1 ? (
          <line
            className={styles.nut}
            x1={boardLeft - 1}
            x2={boardRight + 1}
            y1={NUT_Y}
            y2={NUT_Y}
          />
        ) : (
          <>
            <line
              className={styles.fretLine}
              x1={boardLeft}
              x2={boardRight}
              y1={NUT_Y}
              y2={NUT_Y}
            />
            <text
              className={styles.fretLabel}
              x={mirrored ? VIEW_WIDTH - 2 : 2}
              y={NUT_Y + ROW_HEIGHT / 2}
              textAnchor={mirrored ? "end" : "start"}
              dominantBaseline="central"
            >
              {chord.baseFret}fr
            </text>
          </>
        )}

        {STRING_INDEXES.map((string) => (
          <line
            key={string}
            className={stringIsHot(string) ? `${styles.string} ${styles.stringHot}` : styles.string}
            x1={xOf(string)}
            x2={xOf(string)}
            y1={NUT_Y}
            y2={BOARD_BOTTOM}
            /* Thicker strings are drawn slightly heavier. */
            strokeWidth={1 + (5 - string) * 0.18}
          />
        ))}

        {STRING_INDEXES.map((string) => {
          const fret = chord.frets[string];
          const x = xOf(string);
          const hot = stringIsHot(string) ? styles.markerHot : "";
          if (fret === "x") {
            return (
              <path
                key={string}
                className={`${styles.muted} ${hot}`}
                data-marker="muted"
                d={`M${x - 4} ${MARKER_Y - 4}l8 8M${x + 4} ${MARKER_Y - 4}l-8 8`}
              />
            );
          }
          if (fret === 0) {
            return (
              <circle
                key={string}
                className={`${styles.open} ${hot}`}
                data-marker="open"
                cx={x}
                cy={MARKER_Y}
                r={4.5}
              />
            );
          }
          return null;
        })}

        {barres.map((barre) => {
          const x1 = Math.min(xOf(barre.fromString), xOf(barre.toString));
          const x2 = Math.max(xOf(barre.fromString), xOf(barre.toString));
          return (
            <g
              key={`${barre.fret}-${barre.fromString}`}
              className={`${styles.mark} ${fingerState(barre.finger)} ${animateIn ? styles.enter : ""}`}
              style={appearStyle()}
              data-barre={barre.finger}
            >
              <rect
                className={styles.dot}
                x={x1 - DOT_RADIUS}
                y={yOf(barre.fret) - DOT_RADIUS}
                width={x2 - x1 + DOT_RADIUS * 2}
                height={DOT_RADIUS * 2}
                rx={DOT_RADIUS}
              />
              {numbers && (
                <text
                  className={styles.fingerNumber}
                  x={(x1 + x2) / 2}
                  y={yOf(barre.fret)}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {barre.finger}
                </text>
              )}
            </g>
          );
        })}

        {dots.map((dot) => (
          <g
            key={dot.string}
            className={`${styles.mark} ${fingerState(dot.finger)} ${animateIn ? styles.enter : ""}`}
            style={appearStyle()}
            data-dot={dot.finger}
          >
            <circle
              className={styles.ring}
              cx={xOf(dot.string)}
              cy={yOf(dot.fret)}
              r={DOT_RADIUS + 3}
            />
            <circle className={styles.dot} cx={xOf(dot.string)} cy={yOf(dot.fret)} r={DOT_RADIUS} />
            {numbers && (
              <text
                className={styles.fingerNumber}
                x={xOf(dot.string)}
                y={yOf(dot.fret)}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {dot.finger}
              </text>
            )}
          </g>
        ))}

        {showNoteNames &&
          STRING_INDEXES.map((string) => {
            const fret = chord.frets[string];
            if (fret === "x") return null;
            return (
              <text
                key={string}
                className={styles.noteName}
                x={xOf(string)}
                y={NOTE_Y}
                textAnchor="middle"
              >
                {noteNameAt(string, fret)}
              </text>
            );
          })}
      </svg>

      {/* The wrapper does the hiding: overflow rules do not apply to a table element itself. */}
      <div className="sr-only">
        <table>
          <caption>{chord.fullName} fingering, from the thickest string to the thinnest</caption>
          <thead>
            <tr>
              <th scope="col">String</th>
              <th scope="col">Fret</th>
              <th scope="col">Finger</th>
            </tr>
          </thead>
          <tbody>
            {STRING_INDEXES.map((string) => {
              const fret = chord.frets[string];
              return (
                <tr key={string}>
                  <th scope="row">{STRING_NAMES[string]}</th>
                  <td>{fret === "x" ? "Muted" : fret === 0 ? "Open" : fret}</td>
                  <td>{isFretted(fret) ? chord.fingers[string] : "None"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
