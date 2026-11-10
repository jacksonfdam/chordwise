import { useProgress } from "../../hooks/useProgress";
import styles from "./TabFretboard.module.css";

export interface FretNote {
  /** 1 is the thickest string, as tab files number them. */
  string: number;
  fret: number;
}

export interface TabFretboardProps {
  /** MIDI note of each open string, thickest first. Defaults to standard tuning. */
  tuning?: readonly number[];
  /** Notes sounding right now. */
  notes: readonly FretNote[];
  /** Highest fret to draw. */
  frets?: number;
}

const STANDARD_TUNING = [40, 45, 50, 55, 59, 64];
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const INLAYS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

const WIDTH = 720;
const LEFT = 38;
const RIGHT = WIDTH - 10;
const TOP = 18;
const STRING_GAP = 19;

function noteName(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12] ?? "C";
}

/**
 * A neck that lights up with the notes being played. Like a tab, the thinnest
 * string is at the top and the nut is on the left.
 */
export function TabFretboard({ tuning = STANDARD_TUNING, notes, frets = 12 }: TabFretboardProps) {
  const { settings } = useProgress();
  const flip = settings.leftHanded;
  const strings = tuning.length;
  const bottom = TOP + (strings - 1) * STRING_GAP;
  const height = bottom + 34;
  const fretWidth = (RIGHT - LEFT) / frets;
  const mirror = (x: number) => (flip ? WIDTH - x : x);
  const wireX = (fret: number) => mirror(LEFT + fret * fretWidth);
  const noteX = (fret: number) => mirror(fret === 0 ? LEFT - 15 : LEFT + (fret - 0.5) * fretWidth);
  // String 1 (thickest) is drawn at the bottom.
  const stringY = (string: number) => TOP + (strings - string) * STRING_GAP;
  const openMidi = (string: number) => tuning[string - 1] ?? 40;

  const visible = notes.filter(
    (note) => note.string >= 1 && note.string <= strings && note.fret >= 0 && note.fret <= frets,
  );
  const description =
    visible.length === 0
      ? "Fretboard. No note is sounding."
      : `Fretboard. Now playing: ${visible
          .map(
            (note) =>
              `${noteName(openMidi(note.string) + note.fret)} on the ${noteName(openMidi(note.string))} string, ${
                note.fret === 0 ? "open" : `fret ${note.fret}`
              }`,
          )
          .join("; ")}.`;

  return (
    <div className={styles.scroll}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={description}
        data-notes={visible.length}
      >
        <rect
          className={styles.board}
          x={Math.min(wireX(0), wireX(frets))}
          y={TOP - 9}
          width={RIGHT - LEFT}
          height={bottom - TOP + 18}
          rx={3}
        />
        {Array.from({ length: frets }, (_, index) => index + 1).map((fret) => (
          <g key={fret}>
            <line
              className={styles.fret}
              x1={wireX(fret)}
              x2={wireX(fret)}
              y1={TOP - 9}
              y2={bottom + 9}
            />
            {INLAYS.includes(fret) && (
              <>
                <circle className={styles.inlay} cx={noteX(fret)} cy={(TOP + bottom) / 2} r={3} />
                <text
                  className={styles.fretNumber}
                  x={noteX(fret)}
                  y={height - 8}
                  textAnchor="middle"
                >
                  {fret}
                </text>
              </>
            )}
          </g>
        ))}
        <line className={styles.nut} x1={wireX(0)} x2={wireX(0)} y1={TOP - 9} y2={bottom + 9} />
        {Array.from({ length: strings }, (_, index) => index + 1).map((string) => (
          <g key={string}>
            <line
              className={styles.string}
              x1={wireX(0)}
              x2={wireX(frets)}
              y1={stringY(string)}
              y2={stringY(string)}
              strokeWidth={0.8 + (strings - string) * 0.3}
            />
            <text
              className={styles.stringName}
              x={mirror(10)}
              y={stringY(string)}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {noteName(openMidi(string))}
            </text>
          </g>
        ))}
        {visible.map((note) => (
          <g
            key={`${note.string}-${note.fret}`}
            className={styles.note}
            data-note={`${note.string}:${note.fret}`}
          >
            <circle cx={noteX(note.fret)} cy={stringY(note.string)} r={9} />
            <text
              x={noteX(note.fret)}
              y={stringY(note.string)}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {note.fret}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
