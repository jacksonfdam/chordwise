import { describe, expect, it } from "vitest";
import {
  describeChord,
  fretFrequency,
  noteNameAt,
  OPEN_STRING_FREQUENCIES,
  rootNoteTable,
  soundingStrings,
} from "../domain/fretboard";
import { getChord } from "../data/chords";

describe("fretboard math", () => {
  it("returns the standard-tuning frequency for each open string", () => {
    expect(fretFrequency(0, 0)).toBeCloseTo(82.41, 2);
    expect(fretFrequency(1, 0)).toBeCloseTo(110.0, 2);
    expect(fretFrequency(2, 0)).toBeCloseTo(146.83, 2);
    expect(fretFrequency(3, 0)).toBeCloseTo(196.0, 2);
    expect(fretFrequency(4, 0)).toBeCloseTo(246.94, 2);
    expect(fretFrequency(5, 0)).toBeCloseTo(329.63, 2);
  });

  it("doubles the frequency at the 12th fret", () => {
    expect(Math.abs(fretFrequency(0, 12) - 164.82)).toBeLessThan(0.01);
    expect(Math.abs(fretFrequency(1, 12) - 220)).toBeLessThan(0.01);
  });

  it("matches known fretted notes", () => {
    // A string, fret 3 = C3 (130.81 Hz); low E string, fret 5 = A2 (110 Hz).
    expect(fretFrequency(1, 3)).toBeCloseTo(130.81, 1);
    expect(fretFrequency(0, 5)).toBeCloseTo(OPEN_STRING_FREQUENCIES[1], 1);
    // High E string, fret 5 = A4 (440 Hz).
    expect(fretFrequency(5, 5)).toBeCloseTo(440, 0);
  });

  it("names notes along a string", () => {
    expect(noteNameAt(0, 0)).toBe("E");
    expect(noteNameAt(0, 1)).toBe("F");
    expect(noteNameAt(0, 3)).toBe("G");
    expect(noteNameAt(1, 2)).toBe("B");
    expect(noteNameAt(5, 12)).toBe("E");
  });

  it("builds the root-note table for strings 6 and 5", () => {
    const table = rootNoteTable(12);
    expect(table).toHaveLength(13);
    expect(table[1]).toEqual({ fret: 1, sixthString: "F", fifthString: "A#" });
    expect(table[2]).toEqual({ fret: 2, sixthString: "F#", fifthString: "B" });
    expect(table[12]).toEqual({ fret: 12, sixthString: "E", fifthString: "A" });
  });

  it("skips muted strings when listing sounding strings", () => {
    const strings = soundingStrings(getChord("D"));
    expect(strings.map((s) => s.string)).toEqual([2, 3, 4, 5]);
    expect(strings.map((s) => s.note)).toEqual(["D", "A", "D", "F#"]);
  });

  it("describes a chord in plain English", () => {
    expect(describeChord(getChord("Em"))).toBe(
      "E minor chord. Low E string open. A string, fret 2, finger 2. D string, fret 2, finger 3. G string open. B string open. High E string open.",
    );
  });
});
