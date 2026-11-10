import { describe, expect, it } from "vitest";
import { buildBarreShape, CHORDS, getChord, isBarreChord, matchesFilter } from "../data/chords";
import { validateChord, validateChords } from "../domain/validate";
import type { Chord, Finger, FretValue } from "../domain/types";

type Fingering = [FretValue[], Finger[]];

/** The exact fingerings the curriculum is built on, low E to high E. */
const EXPECTED: Record<string, Fingering> = {
  Em: [
    [0, 2, 2, 0, 0, 0],
    [0, 2, 3, 0, 0, 0],
  ],
  Am: [
    ["x", 0, 2, 2, 1, 0],
    [0, 0, 2, 3, 1, 0],
  ],
  E: [
    [0, 2, 2, 1, 0, 0],
    [0, 2, 3, 1, 0, 0],
  ],
  A: [
    ["x", 0, 2, 2, 2, 0],
    [0, 0, 1, 2, 3, 0],
  ],
  D: [
    ["x", "x", 0, 2, 3, 2],
    [0, 0, 0, 1, 3, 2],
  ],
  C: [
    ["x", 3, 2, 0, 1, 0],
    [0, 3, 2, 0, 1, 0],
  ],
  G: [
    [3, 2, 0, 0, 0, 3],
    [2, 1, 0, 0, 0, 3],
  ],
  "G-alt": [
    [3, 2, 0, 0, 3, 3],
    [2, 1, 0, 0, 3, 4],
  ],
  Dm: [
    ["x", "x", 0, 2, 3, 1],
    [0, 0, 0, 2, 3, 1],
  ],
  "F-simple": [
    ["x", "x", 3, 2, 1, 1],
    [0, 0, 3, 2, 1, 1],
  ],
  A7: [
    ["x", 0, 2, 0, 2, 0],
    [0, 0, 2, 0, 3, 0],
  ],
  D7: [
    ["x", "x", 0, 2, 1, 2],
    [0, 0, 0, 2, 1, 3],
  ],
  E7: [
    [0, 2, 0, 1, 0, 0],
    [0, 2, 0, 1, 0, 0],
  ],
  Am7: [
    ["x", 0, 2, 0, 1, 0],
    [0, 0, 2, 0, 1, 0],
  ],
  Dm7: [
    ["x", "x", 0, 2, 1, 1],
    [0, 0, 0, 2, 1, 1],
  ],
  Cmaj7: [
    ["x", 3, 2, 0, 0, 0],
    [0, 3, 2, 0, 0, 0],
  ],
  Dsus2: [
    ["x", "x", 0, 2, 3, 0],
    [0, 0, 0, 1, 2, 0],
  ],
  Dsus4: [
    ["x", "x", 0, 2, 3, 3],
    [0, 0, 0, 1, 2, 3],
  ],
  Asus2: [
    ["x", 0, 2, 2, 0, 0],
    [0, 0, 1, 2, 0, 0],
  ],
  "F-barre": [
    [1, 3, 3, 2, 1, 1],
    [1, 3, 4, 2, 1, 1],
  ],
  Bm: [
    ["x", 2, 4, 4, 3, 2],
    [0, 1, 3, 4, 2, 1],
  ],
  E5: [
    [0, 2, 2, "x", "x", "x"],
    [0, 1, 2, 0, 0, 0],
  ],
  A5: [
    ["x", 0, 2, 2, "x", "x"],
    [0, 0, 1, 2, 0, 0],
  ],
  D5: [
    ["x", 5, 7, 7, "x", "x"],
    [0, 1, 3, 4, 0, 0],
  ],
  G5: [
    [3, 5, 5, "x", "x", "x"],
    [1, 3, 4, 0, 0, 0],
  ],
  F5: [
    [1, 3, 3, "x", "x", "x"],
    [1, 3, 4, 0, 0, 0],
  ],
};

describe("chord library", () => {
  it("passes every validation rule", () => {
    expect(validateChords(CHORDS)).toEqual([]);
  });

  it.each(Object.entries(EXPECTED))("%s uses the exact fingering", (id, [frets, fingers]) => {
    const chord = getChord(id);
    expect(chord.frets).toEqual(frets);
    expect(chord.fingers).toEqual(fingers);
  });

  it("has unique ids", () => {
    expect(new Set(CHORDS.map((chord) => chord.id)).size).toBe(CHORDS.length);
  });

  it("only links to related chords that exist", () => {
    const ids = new Set(CHORDS.map((chord) => chord.id));
    for (const chord of CHORDS) {
      for (const related of chord.relatedChordIds) expect(ids.has(related)).toBe(true);
    }
  });

  it("marks the mini-barres and full barres", () => {
    expect(getChord("F-simple").barres).toEqual([
      { fret: 1, fromString: 4, toString: 5, finger: 1 },
    ]);
    expect(getChord("Dm7").barres).toEqual([{ fret: 1, fromString: 4, toString: 5, finger: 1 }]);
    expect(getChord("F-barre").barres).toEqual([
      { fret: 1, fromString: 0, toString: 5, finger: 1 },
    ]);
    expect(getChord("Bm").barres).toEqual([{ fret: 2, fromString: 1, toString: 5, finger: 1 }]);
    expect(isBarreChord(getChord("F-simple"))).toBe(false);
    expect(isBarreChord(getChord("F-barre"))).toBe(true);
  });

  it("moves barre shapes up the neck", () => {
    expect(buildBarreShape("e-major", 3).frets).toEqual([3, 5, 5, 4, 3, 3]);
    expect(buildBarreShape("e-minor", 2).frets).toEqual([2, 4, 4, 2, 2, 2]);
    expect(buildBarreShape("a-major", 1).frets).toEqual(["x", 1, 3, 3, 3, 1]);
    expect(buildBarreShape("a-minor", 3).frets).toEqual(["x", 3, 5, 5, 4, 3]);
    expect(getChord("G-barre").rootString).toBe(0);
    expect(getChord("Bb").rootString).toBe(1);
  });

  it("filters chords by family", () => {
    expect(matchesFilter(getChord("A7"), "seventh")).toBe(true);
    expect(matchesFilter(getChord("Cmaj7"), "seventh")).toBe(true);
    expect(matchesFilter(getChord("Dsus4"), "sus")).toBe(true);
    expect(matchesFilter(getChord("E5"), "power")).toBe(true);
    expect(matchesFilter(getChord("Em"), "major")).toBe(false);
  });
});

describe("chord validator", () => {
  const base = getChord("Em");
  const broken = (patch: Partial<Chord>): Chord => ({ ...base, id: "broken", ...patch });

  it("rejects a finger on an open or muted string", () => {
    expect(validateChord(broken({ fingers: [1, 2, 3, 0, 0, 0] }))).not.toEqual([]);
  });

  it("rejects a fretted string without a finger from 1 to 4", () => {
    expect(validateChord(broken({ fingers: [0, 0, 3, 0, 0, 0] }))).not.toEqual([]);
    expect(validateChord(broken({ fingers: [0, "T", 3, 0, 0, 0] }))).not.toEqual([]);
  });

  it("rejects a baseFret below 1", () => {
    expect(validateChord(broken({ baseFret: 0 }))).not.toEqual([]);
  });

  it("rejects barres that reference invalid strings", () => {
    const barre = { fret: 2, fromString: 4, toString: 7, finger: 1 } as unknown as NonNullable<
      Chord["barres"]
    >[number];
    expect(validateChord(broken({ barres: [barre] }))).not.toEqual([]);
  });

  it("reports duplicate ids and missing related chords", () => {
    const errors = validateChords([base, base, broken({ relatedChordIds: ["nope"] })]);
    expect(errors.some((error) => error.includes("duplicate"))).toBe(true);
    expect(errors.some((error) => error.includes("nope"))).toBe(true);
  });
});
