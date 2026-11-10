import { describe, expect, it } from "vitest";
import { CHORDS } from "../data/chords";
import { LESSONS, lessonsByLevel, lessonTeachingChord, nextLesson } from "../data/lessons";
import { DRILL_PRESETS, PROGRESSIONS } from "../data/progressions";
import { STRUM_PATTERNS } from "../data/strumPatterns";
import { validateLessons, validateStrumPatterns } from "../domain/validate";
import type { Lesson } from "../domain/types";

const context = {
  chordIds: new Set(CHORDS.map((chord) => chord.id)),
  strumPatternIds: new Set(STRUM_PATTERNS.map((pattern) => pattern.id)),
};

describe("lesson data", () => {
  it("passes every validation rule", () => {
    expect(validateLessons(LESSONS, context)).toEqual([]);
  });

  it("covers the whole curriculum in order", () => {
    expect(LESSONS.map((lesson) => lesson.order)).toEqual(
      Array.from({ length: 21 }, (_, index) => index + 1),
    );
    expect(lessonsByLevel("beginner")).toHaveLength(11);
    expect(lessonsByLevel("intermediate")).toHaveLength(10);
  });

  it("has unique step ids across all lessons", () => {
    const ids = LESSONS.flatMap((lesson) => lesson.steps.map((step) => step.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every step a positive duration", () => {
    for (const lesson of LESSONS) {
      for (const step of lesson.steps) expect(step.durationSec).toBeGreaterThan(0);
    }
  });

  it("links lessons to each other and to the chord library", () => {
    expect(nextLesson("beginner-04-em-am")?.order).toBe(5);
    expect(nextLesson(LESSONS[LESSONS.length - 1]?.id ?? "")).toBeUndefined();
    expect(lessonTeachingChord("Em")?.id).toBe("beginner-04-em-am");
  });

  it("teaches every chord in the library somewhere", () => {
    const taught = new Set(LESSONS.flatMap((lesson) => lesson.chordIds));
    expect(CHORDS.filter((chord) => !taught.has(chord.id)).map((chord) => chord.id)).toEqual([]);
  });
});

describe("lesson validator", () => {
  const valid = LESSONS.find((lesson) => lesson.id === "beginner-04-em-am");
  if (!valid) throw new Error("fixture lesson is missing");
  const withPatch = (patch: Partial<Lesson>): Lesson => ({ ...valid, id: "patched", ...patch });
  const errorsFor = (lessons: Lesson[]) => validateLessons(lessons, context);

  it("accepts a valid lesson", () => {
    expect(errorsFor([{ ...valid, prerequisites: [] }])).toEqual([]);
  });

  it("rejects unknown chords and prerequisites", () => {
    expect(errorsFor([withPatch({ prerequisites: ["missing"] })])).not.toEqual([]);
    expect(errorsFor([withPatch({ prerequisites: [], chordIds: ["Em", "Am", "Zz"] })])).not.toEqual(
      [],
    );
  });

  it("rejects duplicate step ids and zero durations", () => {
    const [first] = valid.steps;
    if (!first) throw new Error("fixture lesson has no steps");
    const duplicated = withPatch({ prerequisites: [], steps: [first, ...valid.steps] });
    expect(errorsFor([duplicated]).some((error) => error.includes("duplicate"))).toBe(true);
    const zero = withPatch({
      prerequisites: [],
      steps: valid.steps.map((step, index) => (index === 0 ? { ...step, durationSec: 0 } : step)),
    });
    expect(errorsFor([zero]).some((error) => error.includes("duration"))).toBe(true);
  });

  it("detects prerequisite cycles", () => {
    const a = withPatch({ id: "a", order: 101, prerequisites: ["b"], steps: [] });
    const b = withPatch({ id: "b", order: 102, prerequisites: ["a"], steps: [] });
    expect(errorsFor([a, b]).some((error) => error.includes("cycle"))).toBe(true);
  });
});

describe("supporting data", () => {
  it("has valid strum patterns", () => {
    expect(validateStrumPatterns(STRUM_PATTERNS)).toEqual([]);
    expect(STRUM_PATTERNS).toHaveLength(8);
  });

  it("only references chords and patterns that exist", () => {
    for (const progression of PROGRESSIONS) {
      for (const chordId of progression.chordIds) expect(context.chordIds.has(chordId)).toBe(true);
      expect(context.strumPatternIds.has(progression.suggestedPatternId)).toBe(true);
    }
    for (const preset of DRILL_PRESETS) {
      for (const chordId of preset.chordIds) expect(context.chordIds.has(chordId)).toBe(true);
    }
  });
});
