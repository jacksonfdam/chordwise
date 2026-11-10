import { describe, expect, it } from "vitest";
import { layoutChordLine, parseChordSheet, type SheetLine } from "../domain/chordSheet";
import {
  familyOf,
  parseChordSymbol,
  resolveChord,
  suggestFingering,
  transposeSymbol,
} from "../domain/chordSymbols";
import { STRING_INDEXES } from "../domain/fretboard";
import type { Chord } from "../domain/types";

describe("chord symbols", () => {
  it("parses roots, suffixes and slash basses", () => {
    expect(parseChordSymbol("Am")).toMatchObject({ root: "A", suffix: "m", rootSemitone: 9 });
    expect(parseChordSymbol("F#m7")).toMatchObject({ root: "F#", suffix: "m7", rootSemitone: 6 });
    expect(parseChordSymbol("Bb")).toMatchObject({ root: "Bb", suffix: "", rootSemitone: 10 });
    expect(parseChordSymbol("D/F#")).toMatchObject({ root: "D", bass: "F#", bassSemitone: 6 });
    expect(parseChordSymbol("Cadd9")).toMatchObject({ suffix: "add9" });
    expect(parseChordSymbol("Dsus4")).toMatchObject({ suffix: "sus4" });
  });

  it("rejects words and tab fragments", () => {
    for (const text of ["Baby", "I", "And", "Capo", "E-A-D-G-B-e", "%", "H", "Am!", ""]) {
      expect(parseChordSymbol(text)).toBeNull();
    }
  });

  it("transposes roots and basses, keeping the chord type", () => {
    expect(transposeSymbol("G", 1)).toBe("G#");
    expect(transposeSymbol("G", 1, true)).toBe("Ab");
    expect(transposeSymbol("Em", 1)).toBe("Fm");
    expect(transposeSymbol("D/F#", 1, true)).toBe("Eb/G");
    expect(transposeSymbol("Bm7", -2)).toBe("Am7");
    expect(transposeSymbol("C", 12)).toBe("C");
    expect(transposeSymbol("A#", 0, true)).toBe("Bb");
    expect(transposeSymbol("lyrics", 3)).toBe("lyrics");
  });

  it("maps suffixes to a chord family", () => {
    expect(familyOf("")).toEqual({ family: "major", exact: true });
    expect(familyOf("m7")).toEqual({ family: "m7", exact: true });
    expect(familyOf("add9")).toEqual({ family: "major", exact: false });
    expect(familyOf("m9")).toEqual({ family: "minor", exact: false });
    expect(familyOf("maj9")).toEqual({ family: "major", exact: false });
  });
});

/** The same structural rules the library validator applies to fingering. */
function expectPlayable(chord: Chord) {
  expect(chord.frets).toHaveLength(6);
  expect(chord.baseFret).toBeGreaterThanOrEqual(1);
  for (const string of STRING_INDEXES) {
    const fret = chord.frets[string];
    const finger = chord.fingers[string];
    if (fret === "x" || fret === 0) expect(finger).toBe(0);
    else {
      expect([1, 2, 3, 4]).toContain(finger);
      expect(fret).toBeGreaterThanOrEqual(chord.baseFret);
      expect(fret).toBeLessThanOrEqual(chord.baseFret + 4);
    }
  }
  expect(chord.frets.some((fret) => fret !== "x")).toBe(true);
}

describe("chord finder", () => {
  it("uses the lesson library when it has the chord", () => {
    const em = resolveChord("Em");
    expect(em?.source).toBe("library");
    expect(em?.chord.frets).toEqual([0, 2, 2, 0, 0, 0]);
    expect(resolveChord("Bb")?.chord.frets).toEqual(["x", 1, 3, 3, 3, 1]);
    expect(resolveChord("A#")?.chord.frets).toEqual(["x", 1, 3, 3, 3, 1]);
  });

  it("knows common open shapes outside the lessons", () => {
    expect(resolveChord("G/B")).toMatchObject({ source: "open" });
    expect(resolveChord("G/B")?.chord.frets).toEqual(["x", 2, 0, 0, 0, 3]);
    expect(resolveChord("D/F#")?.chord.frets).toEqual([2, "x", 0, 2, 3, 2]);
    expect(resolveChord("B7")?.chord.frets).toEqual(["x", 2, 1, 2, 0, 2]);
    expect(resolveChord("Cadd9")?.note).toBeUndefined();
  });

  it("builds barre shapes for everything else", () => {
    expect(resolveChord("F#")?.chord.frets).toEqual([2, 4, 4, 3, 2, 2]);
    expect(resolveChord("G#m")?.chord.frets).toEqual([4, 6, 6, 4, 4, 4]);
    expect(resolveChord("C#m")?.chord.frets).toEqual(["x", 4, 6, 6, 5, 4]);
    expect(resolveChord("Eb")?.chord.frets).toEqual(["x", 6, 8, 8, 8, 6]);
    expect(resolveChord("Ab")?.chord).toMatchObject({ frets: [4, 6, 6, 5, 4, 4], baseFret: 4 });
    expect(resolveChord("Fm7")?.chord.frets).toEqual([1, 3, 1, 1, 1, 1]);
    expect(resolveChord("C#5")?.chord.frets).toEqual(["x", 4, 6, 6, "x", "x"]);
  });

  it("explains when it simplifies a chord", () => {
    expect(resolveChord("Em9")).toMatchObject({ source: "library" });
    expect(resolveChord("Em9")?.note).toContain("Shown as Em");
    expect(resolveChord("C/Bb")?.note).toContain("bass note Bb is optional");
  });

  it("returns null for text that is not a chord", () => {
    expect(resolveChord("Hello")).toBeNull();
  });

  it("produces a playable diagram for every root and family", () => {
    const roots = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
    const suffixes = ["", "m", "7", "m7", "maj7", "sus4", "sus2", "5", "add9", "m6", "dim"];
    for (const root of roots) {
      for (const suffix of suffixes) {
        const resolved = resolveChord(`${root}${suffix}`);
        expect(resolved, `${root}${suffix}`).not.toBeNull();
        if (resolved) expectPlayable(resolved.chord);
      }
    }
  });

  it("suggests fingers for a shape written as fret numbers", () => {
    expect(suggestFingering([3, "x", 0, 0, 3, 3]).fingers).toEqual([1, 0, 0, 0, 2, 3]);
    expect(suggestFingering(["x", 3, 2, 0, 1, 0]).fingers).toEqual([0, 3, 2, 0, 1, 0]);
    const barre = suggestFingering([1, 3, 3, 2, 1, 1]);
    expect(barre.fingers).toEqual([1, 3, 4, 2, 1, 1]);
    expect(barre.barres).toEqual([{ fret: 1, fromString: 0, toString: 5, finger: 1 }]);
    expect(suggestFingering([0, 0, 0, 0, 0, 0]).fingers).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("prefers a shape defined in the sheet", () => {
    const shapes = new Map([["G", [3, "x", 0, 0, 3, 3] as Chord["frets"]]]);
    const resolved = resolveChord("G", shapes);
    expect(resolved?.source).toBe("sheet");
    expect(resolved?.chord.frets).toEqual([3, "x", 0, 0, 3, 3]);
    if (resolved) expectPlayable(resolved.chord);
  });
});

const SHEET = `Capo: 1st fret
Play: G

      E-A-D-G-B-e
G     3-x-0-0-3(3)
Dsus4 x-x-0-2-3-3 or x-x-0-0-3-3 (= suspended)

[Verse 1]
        G          Em
A first line of words
              C            D
And a second line follows on

|(G) D/F# Em D | C  D  | % |

A plain sentence, not chords
`;

describe("chord sheet parser", () => {
  const sheet = parseChordSheet(SHEET);
  const kinds = sheet.lines.map((line) => line.kind);

  it("reads the capo", () => {
    expect(sheet.capo).toBe(1);
    expect(parseChordSheet("G  C  D").capo).toBeNull();
  });

  it("classifies each line", () => {
    expect(kinds).toEqual([
      "text",
      "text",
      "empty",
      "text",
      "shape",
      "shape",
      "empty",
      "section",
      "chords",
      "text",
      "chords",
      "text",
      "empty",
      "chords",
      "empty",
      "text",
    ]);
  });

  it("lists each chord once, in order of appearance", () => {
    expect(sheet.symbols).toEqual(["G", "Em", "C", "D", "D/F#"]);
  });

  it("collects fingerings written in the sheet", () => {
    expect(sheet.shapes.get("G")).toEqual([3, "x", 0, 0, 3, 3]);
    expect(sheet.shapes.get("Dsus4")).toEqual(["x", "x", 0, 2, 3, 3]);
  });

  it("finds chords inside bar lines and brackets", () => {
    const bars = sheet.lines[13] as Extract<SheetLine, { kind: "chords" }>;
    expect(bars.chords.map((chord) => chord.symbol)).toEqual(["G", "D/F#", "Em", "D", "C", "D"]);
    expect(bars.chords[0]).toMatchObject({ raw: "|(G)", column: 2 });
  });

  it("does not mistake lyrics for chords", () => {
    const lyric = parseChordSheet("A day in the sun\nAm I dreaming\nBaby be mine");
    expect(lyric.lines.every((line) => line.kind === "text")).toBe(true);
    expect(lyric.symbols).toEqual([]);
  });

  it("handles empty input and Windows line endings", () => {
    expect(parseChordSheet("").lines).toEqual([]);
    expect(parseChordSheet("G  C\r\nwords\r\n").lines.map((line) => line.kind)).toEqual([
      "chords",
      "text",
    ]);
  });
});

describe("chord line layout", () => {
  const lineOf = (text: string) =>
    parseChordSheet(text).lines[0] as Extract<SheetLine, { kind: "chords" }>;
  const render = (text: string, semitones: number, flats = false) => {
    const { segments, tail } = layoutChordLine(lineOf(text), semitones, flats);
    return segments.map((segment) => segment.before + segment.symbol).join("") + tail;
  };

  it("reproduces the line untouched without transposing", () => {
    const text = "|(G) D/F# Em D | C  D  |";
    expect(render(text, 0)).toBe(text);
  });

  it("keeps chords in their columns when names get longer", () => {
    expect(render("G        Em       C", 1)).toBe("G#       Fm       C#");
    expect(render("G  C  D", 1)).toBe("G# C# D#");
  });

  it("keeps chords in their columns when names get shorter", () => {
    expect(render("G#       Fm       C#", -1)).toBe("G        Em       C");
  });

  it("never glues two chords together", () => {
    expect(render("G C D", 1)).toBe("G# C# D#");
  });
});
