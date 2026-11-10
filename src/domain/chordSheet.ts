import { parseChordSymbol, transposeSymbol } from "./chordSymbols";
import type { FretValue, SixStrings } from "./types";

export interface SheetChord {
  /** The chord symbol, without brackets or bar lines. */
  symbol: string;
  /** Character column where the token starts in the original line. */
  column: number;
  /** The token as written, e.g. "(G)". */
  raw: string;
}

export type SheetLine =
  | { kind: "empty" }
  | { kind: "section"; text: string }
  | { kind: "chords"; text: string; chords: SheetChord[] }
  | { kind: "shape"; text: string; symbol: string }
  | { kind: "text"; text: string };

export interface ChordSheet {
  lines: SheetLine[];
  /** Chord symbols in order of first appearance. */
  symbols: string[];
  /** Fingerings written in the sheet itself, e.g. "G 3-x-0-0-3-3". */
  shapes: Map<string, SixStrings<FretValue>>;
  /** Capo fret, when the sheet states one. */
  capo: number | null;
}

/** Tokens that may sit on a chord line without being chords: bar lines, repeats, "no chord". */
const FILLER = /^(\||\|\||%|-|x\d+|\d+x|N\.?C\.?|\.+)$/i;
const SECTION = /^\s*\[[^\]]+\]\s*$/;
const SHAPE_LINE = /^\s*([A-G][^\s]*)\s+((?:x|\d{1,2})(?:-(?:x|\d{1,2})){5})/i;
const CAPO = /capo\s*:?\s*(\d{1,2})/i;

/** Removes brackets and bar lines glued to a chord: "(G)" -> "G", "|D" -> "D". */
function stripDecoration(token: string): string {
  return token.replace(/^[(|[]+/, "").replace(/[)|\],]+$/, "");
}

function findChords(line: string): SheetChord[] | null {
  const chords: SheetChord[] = [];
  for (const match of line.matchAll(/\S+/g)) {
    const raw = match[0];
    if (FILLER.test(raw)) continue;
    const symbol = stripDecoration(raw);
    if (symbol === "" || FILLER.test(symbol)) continue;
    if (!parseChordSymbol(symbol)) return null;
    chords.push({ symbol, column: match.index + raw.indexOf(symbol), raw });
  }
  return chords.length > 0 ? chords : null;
}

function parseShape(text: string): SixStrings<FretValue> | null {
  const parts = text.split("-").map((part) => (part.toLowerCase() === "x" ? "x" : Number(part)));
  if (parts.length !== 6 || parts.some((part) => part !== "x" && !Number.isInteger(part))) {
    return null;
  }
  return parts as SixStrings<FretValue>;
}

/**
 * Reads a pasted chord sheet: section headers in [brackets], lines of chord
 * symbols above lyric lines, and optional fingering definitions.
 * Anything it does not recognize is kept as plain text.
 */
export function parseChordSheet(source: string): ChordSheet {
  const lines: SheetLine[] = [];
  const symbols: string[] = [];
  const seen = new Set<string>();
  const shapes = new Map<string, SixStrings<FretValue>>();
  let capo: number | null = null;

  for (const rawLine of source.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n")) {
    const text = rawLine.trimEnd();
    if (text.trim() === "") {
      lines.push({ kind: "empty" });
      continue;
    }
    if (capo === null) {
      const capoMatch = CAPO.exec(text);
      if (capoMatch?.[1]) capo = Number(capoMatch[1]);
    }
    if (SECTION.test(text)) {
      lines.push({ kind: "section", text: text.trim() });
      continue;
    }
    // Some sheets write the last string in brackets: "3-x-0-0-3(3)".
    const shapeMatch = SHAPE_LINE.exec(text.replace(/\((\d{1,2})\)/, "-$1"));
    if (shapeMatch?.[1] && shapeMatch[2] && parseChordSymbol(shapeMatch[1])) {
      const shape = parseShape(shapeMatch[2]);
      if (shape) {
        if (!shapes.has(shapeMatch[1])) shapes.set(shapeMatch[1], shape);
        lines.push({ kind: "shape", text, symbol: shapeMatch[1] });
        continue;
      }
    }
    const chords = findChords(text);
    if (chords) {
      for (const chord of chords) {
        if (!seen.has(chord.symbol)) {
          seen.add(chord.symbol);
          symbols.push(chord.symbol);
        }
      }
      lines.push({ kind: "chords", text, chords });
      continue;
    }
    lines.push({ kind: "text", text });
  }

  // Trailing blank lines add nothing.
  while (lines[lines.length - 1]?.kind === "empty") lines.pop();
  return { lines, symbols, shapes, capo };
}

export interface ChordSegment {
  /** Spaces, bar lines and brackets before the chord. */
  before: string;
  /** The chord symbol to show (already transposed). */
  symbol: string;
}

/**
 * Splits a chord line into text and chord pieces, transposing each chord.
 * Chords keep their original columns where possible so they stay above the right syllable.
 */
export function layoutChordLine(
  line: Extract<SheetLine, { kind: "chords" }>,
  semitones: number,
  useFlats: boolean,
): { segments: ChordSegment[]; tail: string } {
  const segments: ChordSegment[] = [];
  let sourceCursor = 0;
  // How many characters the output is ahead of (+) or behind (-) the source.
  let drift = 0;
  for (const chord of line.chords) {
    let before = line.text.slice(sourceCursor, chord.column);
    // A longer transposed chord pushed the line right: absorb it from the following gap.
    while (drift > 0 && /^ {2,}/.test(before)) {
      before = before.slice(1);
      drift -= 1;
    }
    while (drift < 0) {
      before = ` ${before}`;
      drift += 1;
    }
    const symbol = transposeSymbol(chord.symbol, semitones, useFlats);
    segments.push({ before, symbol });
    drift += symbol.length - chord.symbol.length;
    sourceCursor = chord.column + chord.symbol.length;
  }
  return { segments, tail: line.text.slice(sourceCursor) };
}
