import { findChord } from "../data/chords";
import type {
  Barre,
  Chord,
  ChordQuality,
  Finger,
  FretValue,
  SixStrings,
  StringIndex,
} from "./types";

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;
const NATURAL_SEMITONES: Readonly<Record<string, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** The chord families this app can draw a shape for. */
export type ShapeFamily = "major" | "minor" | "7" | "m7" | "maj7" | "sus4" | "sus2" | "5";

export interface ChordSymbol {
  /** The symbol as written, e.g. "F#m7/C#". */
  text: string;
  /** Root note name, e.g. "F#". */
  root: string;
  /** Semitones above C, 0-11. */
  rootSemitone: number;
  /** Everything between the root and the slash, e.g. "m7". */
  suffix: string;
  /** Bass note of a slash chord, e.g. "C#". */
  bass?: string;
  bassSemitone?: number;
}

const SYMBOL_PATTERN =
  /^([A-G])([#b]?)((?:maj|min|dim|aug|sus|add|m|M)?\d*(?:(?:maj|min|dim|aug|sus|add|[#b+-])\d*)*)(?:\/([A-G])([#b]?))?$/;

function semitoneOf(letter: string, accidental: string): number {
  const natural = NATURAL_SEMITONES[letter] ?? 0;
  const shift = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
  return (natural + shift + 12) % 12;
}

/** Parses a chord symbol such as "Am", "F#m7", "Dsus4" or "G/B". Returns null for anything else. */
export function parseChordSymbol(text: string): ChordSymbol | null {
  const match = SYMBOL_PATTERN.exec(text);
  if (!match) return null;
  const [, letter = "", accidental = "", suffix = "", bassLetter, bassAccidental = ""] = match;
  const symbol: ChordSymbol = {
    text,
    root: `${letter}${accidental}`,
    rootSemitone: semitoneOf(letter, accidental),
    suffix,
  };
  if (bassLetter) {
    symbol.bass = `${bassLetter}${bassAccidental}`;
    symbol.bassSemitone = semitoneOf(bassLetter, bassAccidental);
  }
  return symbol;
}

function noteName(semitone: number, useFlats: boolean): string {
  const index = ((semitone % 12) + 12) % 12;
  return (useFlats ? FLAT_NAMES[index] : SHARP_NAMES[index]) ?? "C";
}

/** Moves a chord symbol up or down by a number of semitones, keeping its type. */
export function transposeSymbol(text: string, semitones: number, useFlats = false): string {
  const symbol = parseChordSymbol(text);
  if (!symbol) return text;
  if (semitones % 12 === 0 && !useFlats) return text;
  const root = noteName(symbol.rootSemitone + semitones, useFlats);
  const bass =
    symbol.bassSemitone === undefined
      ? ""
      : `/${noteName(symbol.bassSemitone + semitones, useFlats)}`;
  return `${root}${symbol.suffix}${bass}`;
}

/** Reduces any suffix to a family we have a shape for; `exact` is false when detail was dropped. */
export function familyOf(suffix: string): { family: ShapeFamily; exact: boolean } {
  switch (suffix) {
    case "":
    case "M":
    case "maj":
      return { family: "major", exact: true };
    case "m":
    case "min":
      return { family: "minor", exact: true };
    case "7":
      return { family: "7", exact: true };
    case "m7":
    case "min7":
      return { family: "m7", exact: true };
    case "maj7":
    case "M7":
      return { family: "maj7", exact: true };
    case "sus4":
    case "sus":
      return { family: "sus4", exact: true };
    case "sus2":
      return { family: "sus2", exact: true };
    case "5":
      return { family: "5", exact: true };
    default: {
      // Richer chords (add9, 6, 9, dim...) fall back to the plain major or minor underneath.
      const minor = /^(m|min)(?!aj)/.test(suffix) || suffix.startsWith("dim");
      return { family: minor ? "minor" : "major", exact: false };
    }
  }
}

const FAMILY_WORDS: Readonly<Record<ShapeFamily, string>> = {
  major: "major",
  minor: "minor",
  "7": "dominant seventh",
  m7: "minor seventh",
  maj7: "major seventh",
  sus4: "suspended fourth",
  sus2: "suspended second",
  "5": "power chord",
};

const FAMILY_QUALITY: Readonly<Record<ShapeFamily, ChordQuality>> = {
  major: "major",
  minor: "minor",
  "7": "dominant7",
  m7: "minor7",
  maj7: "major7",
  sus4: "sus4",
  sus2: "sus2",
  "5": "power",
};

const FAMILY_SUFFIX: Readonly<Record<ShapeFamily, string>> = {
  major: "",
  minor: "m",
  "7": "7",
  m7: "m7",
  maj7: "maj7",
  sus4: "sus4",
  sus2: "sus2",
  "5": "5",
};

interface Shape {
  frets: SixStrings<FretValue>;
  fingers: SixStrings<Finger>;
  barres?: Barre[];
}

/** Chords from the lesson library, by canonical name (sharps). */
const LIBRARY_IDS: Readonly<Record<string, string>> = {
  Em: "Em",
  Am: "Am",
  E: "E",
  A: "A",
  D: "D",
  C: "C",
  G: "G",
  Dm: "Dm",
  F: "F-simple",
  A7: "A7",
  D7: "D7",
  E7: "E7",
  Am7: "Am7",
  Dm7: "Dm7",
  Cmaj7: "Cmaj7",
  Dsus2: "Dsus2",
  Dsus4: "Dsus4",
  Asus2: "Asus2",
  Bm: "Bm",
  B: "B",
  "A#": "Bb",
  Cm: "Cm",
  "F#m": "F-sharp-m",
  E5: "E5",
  A5: "A5",
  D5: "D5",
  G5: "G5",
  F5: "F5",
};

/** Common open shapes that the lessons do not teach, by canonical name (sharps). */
const OPEN_SHAPES: Readonly<Record<string, Shape>> = {
  B7: { frets: ["x", 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  G7: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  C7: { frets: ["x", 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  Em7: { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
  Fmaj7: { frets: ["x", "x", 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  Gmaj7: { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] },
  Amaj7: { frets: ["x", 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  Dmaj7: {
    frets: ["x", "x", 0, 2, 2, 2],
    fingers: [0, 0, 0, 1, 1, 1],
    barres: [{ fret: 2, fromString: 3, toString: 5, finger: 1 }],
  },
  Asus4: { frets: ["x", 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 4, 0] },
  Esus4: { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
  Cadd9: { frets: ["x", 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0] },
  "G/B": { frets: ["x", 2, 0, 0, 0, 3], fingers: [0, 1, 0, 0, 0, 3] },
  "D/F#": { frets: [2, "x", 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3] },
  "C/G": { frets: [3, 3, 2, 0, 1, 0], fingers: [3, 4, 2, 0, 1, 0] },
  "C/E": { frets: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  "Am/G": { frets: [3, 0, 2, 2, 1, 0], fingers: [4, 0, 2, 3, 1, 0] },
  "G/F#": { frets: [2, "x", 0, 0, 0, 3], fingers: [1, 0, 0, 0, 0, 3] },
};

interface MovableShape {
  offsets: SixStrings<FretValue>;
  fingers: SixStrings<Finger>;
  /** False for shapes played without a barre (power chords). */
  barre: boolean;
}

/** Shapes with the root on the low E string. */
const E_SHAPES: Readonly<Partial<Record<ShapeFamily, MovableShape>>> = {
  major: { offsets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], barre: true },
  minor: { offsets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1], barre: true },
  "7": { offsets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1], barre: true },
  m7: { offsets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1], barre: true },
  maj7: { offsets: [0, 2, 1, 1, 0, 0], fingers: [1, 4, 2, 3, 1, 1], barre: true },
  sus4: { offsets: [0, 2, 2, 2, 0, 0], fingers: [1, 2, 3, 4, 1, 1], barre: true },
  "5": { offsets: [0, 2, 2, "x", "x", "x"], fingers: [1, 3, 4, 0, 0, 0], barre: false },
};

/** Shapes with the root on the A string. */
const A_SHAPES: Readonly<Partial<Record<ShapeFamily, MovableShape>>> = {
  major: { offsets: ["x", 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1], barre: true },
  minor: { offsets: ["x", 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1], barre: true },
  "7": { offsets: ["x", 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1], barre: true },
  m7: { offsets: ["x", 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1], barre: true },
  maj7: { offsets: ["x", 0, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 1], barre: true },
  sus4: { offsets: ["x", 0, 2, 2, 3, 0], fingers: [0, 1, 2, 3, 4, 1], barre: true },
  sus2: { offsets: ["x", 0, 2, 2, 0, 0], fingers: [0, 1, 3, 4, 1, 1], barre: true },
  "5": { offsets: ["x", 0, 2, 2, "x", "x"], fingers: [0, 1, 3, 4, 0, 0], barre: false },
};

function moveShape(shape: MovableShape, fret: number, rootString: StringIndex): Shape {
  const frets = shape.offsets.map((offset) =>
    offset === "x" ? "x" : offset + fret,
  ) as SixStrings<FretValue>;
  return {
    frets,
    fingers: shape.fingers,
    barres: shape.barre ? [{ fret, fromString: rootString, toString: 5, finger: 1 }] : undefined,
  };
}

/** Builds a movable shape for any root, choosing the position closest to the nut. */
function movableShapeFor(rootSemitone: number, family: ShapeFamily): Shape | null {
  const options: { fret: number; shape: MovableShape; rootString: StringIndex }[] = [];
  const eShape = E_SHAPES[family];
  const aShape = A_SHAPES[family];
  // The open E string is 4 semitones above C, the open A string 9.
  const eFret = (rootSemitone - 4 + 12) % 12 || 12;
  const aFret = (rootSemitone - 9 + 12) % 12 || 12;
  if (eShape) options.push({ fret: eFret, shape: eShape, rootString: 0 });
  if (aShape) options.push({ fret: aFret, shape: aShape, rootString: 1 });
  options.sort((a, b) => a.fret - b.fret);
  const best = options[0];
  return best ? moveShape(best.shape, best.fret, best.rootString) : null;
}

/**
 * Suggests fingers for a shape given only as fret numbers (as chord sheets
 * write them). It is a reasonable guess, not the only way to play the shape.
 */
export function suggestFingering(frets: SixStrings<FretValue>): Shape {
  const fretted: { string: StringIndex; fret: number }[] = [];
  frets.forEach((fret, index) => {
    if (typeof fret === "number" && fret > 0) fretted.push({ string: index as StringIndex, fret });
  });
  const fingers: SixStrings<Finger> = [0, 0, 0, 0, 0, 0];
  if (fretted.length === 0) return { frets, fingers };

  const lowestFret = Math.min(...fretted.map((note) => note.fret));
  const byFretThenString = [...fretted].sort((a, b) => a.fret - b.fret || a.string - b.string);

  if (fretted.length <= 4) {
    let previous = 0;
    for (const note of byFretThenString) {
      const finger = Math.min(4, Math.max(previous + 1, note.fret - lowestFret + 1));
      fingers[note.string] = finger as Finger;
      previous = finger;
    }
    return { frets, fingers };
  }

  // Five or six fretted strings: the lowest fret must be a barre with the index finger.
  const onBarre = fretted.filter((note) => note.fret === lowestFret);
  const from = Math.min(...onBarre.map((note) => note.string)) as StringIndex;
  for (const note of onBarre) fingers[note.string] = 1;
  let next = 2;
  for (const note of byFretThenString) {
    if (note.fret === lowestFret) continue;
    fingers[note.string] = Math.min(4, next) as Finger;
    next += 1;
  }
  return {
    frets,
    fingers,
    barres: [{ fret: lowestFret, fromString: from, toString: 5, finger: 1 }],
  };
}

function baseFretOf(frets: SixStrings<FretValue>): number {
  const fretted = frets.filter((fret): fret is number => typeof fret === "number" && fret > 0);
  if (fretted.length === 0) return 1;
  return Math.max(...fretted) <= 5 ? 1 : Math.min(...fretted);
}

function rootStringOf(frets: SixStrings<FretValue>): StringIndex | undefined {
  const index = frets.findIndex((fret) => fret !== "x");
  return index === -1 ? undefined : (index as StringIndex);
}

export interface ResolvedChord {
  /** The symbol as it appears in the sheet (after transposing). */
  symbol: string;
  chord: Chord;
  /** Where the shape came from. */
  source: "library" | "open" | "movable" | "sheet";
  /** Shown under the diagram when the shape is not exactly the written chord. */
  note?: string;
}

function toChord(symbolText: string, family: ShapeFamily, root: string, shape: Shape): Chord {
  return {
    id: `sheet-${symbolText}`,
    name: symbolText,
    fullName: `${root} ${FAMILY_WORDS[family]}`,
    quality: FAMILY_QUALITY[family],
    level: "intermediate",
    frets: shape.frets,
    fingers: shape.fingers,
    baseFret: baseFretOf(shape.frets),
    barres: shape.barres,
    rootString: rootStringOf(shape.frets),
    sound: "",
    tips: [],
    commonMistakes: [],
    relatedChordIds: [],
  };
}

/**
 * Finds a playable shape for a chord symbol.
 * Order: a shape written in the sheet itself, the lesson library, a common
 * open shape, then a movable barre shape. Returns null if the text is not a chord.
 */
export function resolveChord(
  symbolText: string,
  sheetShapes?: ReadonlyMap<string, SixStrings<FretValue>>,
): ResolvedChord | null {
  const symbol = parseChordSymbol(symbolText);
  if (!symbol) return null;
  const { family, exact } = familyOf(symbol.suffix);
  const sharpRoot = noteName(symbol.rootSemitone, false);
  const sharpBass =
    symbol.bassSemitone === undefined ? undefined : noteName(symbol.bassSemitone, false);
  const canonical = `${sharpRoot}${symbol.suffix}`;
  const canonicalWithBass = sharpBass ? `${canonical}/${sharpBass}` : canonical;
  const simplified = `${sharpRoot}${FAMILY_SUFFIX[family]}`;
  const simplifiedName = `${symbol.root}${FAMILY_SUFFIX[family]}`;

  const written = sheetShapes?.get(symbolText);
  if (written) {
    return {
      symbol: symbolText,
      chord: toChord(symbolText, family, symbol.root, suggestFingering(written)),
      source: "sheet",
      note: "Shape as written in the sheet; the fingering is a suggestion.",
    };
  }

  // A slash chord with its own shape wins; otherwise the chord is shown without the bass note.
  const slashShape = sharpBass ? OPEN_SHAPES[canonicalWithBass] : undefined;
  if (slashShape) {
    return {
      symbol: symbolText,
      chord: toChord(symbolText, family, symbol.root, slashShape),
      source: "open",
    };
  }
  const bassNote = symbol.bass
    ? `The bass note ${symbol.bass} is optional; the plain chord works too.`
    : undefined;
  const simplifiedNote = exact
    ? undefined
    : `Shown as ${simplifiedName}, the simpler chord underneath.`;
  const joinNotes = (...parts: (string | undefined)[]) =>
    parts.filter((part): part is string => part !== undefined).join(" ") || undefined;

  // Try the chord exactly as written first, then the simpler chord underneath it.
  const candidates = [
    { name: canonical, note: joinNotes(bassNote) },
    { name: simplified, note: joinNotes(simplifiedNote, bassNote) },
  ];
  for (const { name, note } of candidates) {
    const libraryId = LIBRARY_IDS[name];
    const libraryChord = libraryId ? findChord(libraryId) : undefined;
    if (libraryChord) {
      return {
        symbol: symbolText,
        chord: { ...libraryChord, name: symbolText },
        source: "library",
        note,
      };
    }
    const open = OPEN_SHAPES[name];
    if (open) {
      return {
        symbol: symbolText,
        chord: toChord(symbolText, family, symbol.root, open),
        source: "open",
        note,
      };
    }
  }

  const movable = movableShapeFor(symbol.rootSemitone, family);
  if (!movable) return null;
  return {
    symbol: symbolText,
    chord: toChord(symbolText, family, symbol.root, movable),
    source: "movable",
    note: joinNotes(simplifiedNote, bassNote),
  };
}
