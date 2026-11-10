import type { Chord, FretValue, StringIndex } from "./types";

export const STRING_INDEXES: readonly StringIndex[] = [0, 1, 2, 3, 4, 5];

/** Standard tuning, low E to high E, in hertz. */
export const OPEN_STRING_FREQUENCIES: Readonly<Record<StringIndex, number>> = {
  0: 82.41,
  1: 110.0,
  2: 146.83,
  3: 196.0,
  4: 246.94,
  5: 329.63,
};

export const STRING_NAMES: Readonly<Record<StringIndex, string>> = {
  0: "Low E",
  1: "A",
  2: "D",
  3: "G",
  4: "B",
  5: "High E",
};

export const STRING_LETTERS: Readonly<Record<StringIndex, string>> = {
  0: "E",
  1: "A",
  2: "D",
  3: "G",
  4: "B",
  5: "E",
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

/** Semitones above C for each open string. */
const OPEN_STRING_SEMITONES: Readonly<Record<StringIndex, number>> = {
  0: 4,
  1: 9,
  2: 2,
  3: 7,
  4: 11,
  5: 4,
};

/** Frequency of a fretted note: each fret raises the pitch by one semitone. */
export function fretFrequency(string: StringIndex, fret: number): number {
  return OPEN_STRING_FREQUENCIES[string] * 2 ** (fret / 12);
}

/** Note name (sharps only) at a string and fret, e.g. string 0 fret 1 -> "F". */
export function noteNameAt(string: StringIndex, fret: number): string {
  const index = (OPEN_STRING_SEMITONES[string] + fret) % 12;
  // The modulo keeps the index inside the 12-entry table.
  return NOTE_NAMES[index] ?? "C";
}

export interface SoundingString {
  string: StringIndex;
  fret: number;
  frequency: number;
  note: string;
}

export function isFretted(fret: FretValue): fret is number {
  return typeof fret === "number" && fret > 0;
}

/** The strings that ring in a chord, low to high, skipping muted strings. */
export function soundingStrings(chord: Pick<Chord, "frets">): SoundingString[] {
  const result: SoundingString[] = [];
  for (const string of STRING_INDEXES) {
    const fret = chord.frets[string];
    if (fret === "x") continue;
    result.push({
      string,
      fret,
      frequency: fretFrequency(string, fret),
      note: noteNameAt(string, fret),
    });
  }
  return result;
}

export interface RootNoteRow {
  fret: number;
  /** Note on the low E (6th) string. */
  sixthString: string;
  /** Note on the A (5th) string. */
  fifthString: string;
}

/** Root notes on strings 6 and 5 from the open string through `maxFret`. */
export function rootNoteTable(maxFret = 12): RootNoteRow[] {
  const rows: RootNoteRow[] = [];
  for (let fret = 0; fret <= maxFret; fret += 1) {
    rows.push({ fret, sixthString: noteNameAt(0, fret), fifthString: noteNameAt(1, fret) });
  }
  return rows;
}

/** Plain-English description of a chord, used as the diagram's text alternative. */
export function describeChord(chord: Chord): string {
  const parts = STRING_INDEXES.map((string) => {
    const fret = chord.frets[string];
    const name = `${STRING_NAMES[string]} string`;
    if (fret === "x") return `${name} muted.`;
    if (fret === 0) return `${name} open.`;
    return `${name}, fret ${fret}, finger ${chord.fingers[string]}.`;
  });
  const barres = (chord.barres ?? []).map(
    (barre) =>
      `Finger ${barre.finger} lies flat across fret ${barre.fret} from the ${STRING_NAMES[barre.fromString]} string to the ${STRING_NAMES[barre.toString]} string.`,
  );
  return [`${chord.fullName} chord.`, ...parts, ...barres].join(" ");
}
