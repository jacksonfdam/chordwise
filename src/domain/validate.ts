import { STRING_INDEXES } from "./fretboard";
import type { Chord, Lesson, StrumPattern } from "./types";

/** Number of fret rows a chord diagram shows. */
export const DIAGRAM_FRET_ROWS = 5;

const MAX_BODY_WORDS = 75;

function isStringIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 5;
}

/** Returns a list of problems with one chord; an empty list means the chord is valid. */
export function validateChord(chord: Chord): string[] {
  const errors: string[] = [];
  const fail = (message: string) => errors.push(`${chord.id}: ${message}`);

  if (!chord.id) fail("id is empty");
  if (!chord.name || !chord.fullName) fail("name and fullName are required");
  if (chord.frets.length !== 6) fail("must have exactly 6 fret values");
  if (chord.fingers.length !== 6) fail("must have exactly 6 finger values");
  if (!Number.isInteger(chord.baseFret) || chord.baseFret < 1) fail("baseFret must be >= 1");

  for (const string of STRING_INDEXES) {
    const fret = chord.frets[string];
    const finger = chord.fingers[string];
    if (fret === "x" || fret === 0) {
      if (finger !== 0) fail(`string ${string} is open or muted but has finger ${finger}`);
      continue;
    }
    if (typeof fret !== "number" || !Number.isInteger(fret) || fret < 0) {
      fail(`string ${string} has an invalid fret value`);
      continue;
    }
    if (finger !== 1 && finger !== 2 && finger !== 3 && finger !== 4) {
      fail(`string ${string} is fretted but its finger is not between 1 and 4`);
    }
    if (fret < chord.baseFret || fret > chord.baseFret + DIAGRAM_FRET_ROWS - 1) {
      fail(
        `string ${string} fret ${fret} does not fit a diagram starting at fret ${chord.baseFret}`,
      );
    }
  }

  if (!chord.frets.some((fret) => fret !== "x")) fail("no string sounds");

  for (const barre of chord.barres ?? []) {
    if (!isStringIndex(barre.fromString) || !isStringIndex(barre.toString)) {
      fail("barre references an invalid string");
      continue;
    }
    if (barre.fromString >= barre.toString) fail("barre must span at least two strings");
    if (!Number.isInteger(barre.fret) || barre.fret < 1) fail("barre fret must be >= 1");
    if (![1, 2, 3, 4].includes(barre.finger)) fail("barre finger must be between 1 and 4");
    for (const string of STRING_INDEXES) {
      if (string < barre.fromString || string > barre.toString) continue;
      const fret = chord.frets[string];
      if (fret === "x" || fret < barre.fret) {
        fail(`string ${string} is under the barre but is muted or below the barre fret`);
      } else if (fret === barre.fret && chord.fingers[string] !== barre.finger) {
        fail(`string ${string} sits on the barre fret but is not played by the barre finger`);
      }
    }
  }

  if (chord.rootString !== undefined) {
    if (!isStringIndex(chord.rootString)) fail("rootString is invalid");
    else if (chord.frets[chord.rootString] === "x") fail("rootString is muted");
  }

  if (!chord.sound.trim()) fail("sound description is empty");
  if (chord.tips.length < 2 || chord.tips.length > 3) fail("needs 2-3 tips");
  if (chord.commonMistakes.length < 2 || chord.commonMistakes.length > 3) {
    fail("needs 2-3 common mistakes");
  }
  if (chord.relatedChordIds.includes(chord.id)) fail("lists itself as a related chord");

  return errors;
}

/** Validates every chord plus the rules that span the whole library. */
export function validateChords(chords: readonly Chord[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const chord of chords) {
    if (ids.has(chord.id)) errors.push(`${chord.id}: duplicate chord id`);
    ids.add(chord.id);
  }
  for (const chord of chords) {
    errors.push(...validateChord(chord));
    for (const related of chord.relatedChordIds) {
      if (!ids.has(related)) errors.push(`${chord.id}: related chord "${related}" does not exist`);
    }
  }
  return errors;
}

export function validateStrumPatterns(patterns: readonly StrumPattern[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const pattern of patterns) {
    const fail = (message: string) => errors.push(`${pattern.id}: ${message}`);
    if (ids.has(pattern.id)) fail("duplicate pattern id");
    ids.add(pattern.id);
    const expectedSlots = pattern.timeSignature === "4/4" ? 8 : 6;
    if (pattern.grid.length !== expectedSlots) {
      fail(`grid must have ${expectedSlots} slots in ${pattern.timeSignature}`);
    }
    for (const accent of pattern.accents) {
      if (!Number.isInteger(accent) || accent < 0 || accent >= pattern.grid.length) {
        fail(`accent ${accent} is outside the grid`);
      } else if (pattern.grid[accent] === "-") {
        fail(`accent ${accent} falls on a rest`);
      }
    }
    if (!pattern.description.trim()) fail("description is empty");
  }
  return errors;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Finds a prerequisite cycle, if any, and returns the ids along it. */
function findCycle(lessons: readonly Lesson[]): string[] | null {
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const state = new Map<string, "visiting" | "done">();
  const path: string[] = [];

  const visit = (id: string): string[] | null => {
    const current = state.get(id);
    if (current === "done") return null;
    if (current === "visiting") return [...path.slice(path.indexOf(id)), id];
    state.set(id, "visiting");
    path.push(id);
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) {
      const cycle = visit(prerequisite);
      if (cycle) return cycle;
    }
    path.pop();
    state.set(id, "done");
    return null;
  };

  for (const lesson of lessons) {
    const cycle = visit(lesson.id);
    if (cycle) return cycle;
  }
  return null;
}

export interface LessonValidationContext {
  chordIds: ReadonlySet<string>;
  strumPatternIds: ReadonlySet<string>;
}

export function validateLessons(
  lessons: readonly Lesson[],
  context: LessonValidationContext,
): string[] {
  const errors: string[] = [];
  const lessonIds = new Set<string>();
  const orders = new Set<number>();
  const stepIds = new Set<string>();

  for (const lesson of lessons) {
    if (lessonIds.has(lesson.id)) errors.push(`${lesson.id}: duplicate lesson id`);
    lessonIds.add(lesson.id);
    if (orders.has(lesson.order)) errors.push(`${lesson.id}: duplicate order ${lesson.order}`);
    orders.add(lesson.order);
  }

  for (const lesson of lessons) {
    const fail = (message: string) => errors.push(`${lesson.id}: ${message}`);

    if (!lesson.title.trim() || !lesson.summary.trim()) fail("title and summary are required");
    if (lesson.estimatedMinutes <= 0) fail("estimatedMinutes must be > 0");
    if (lesson.goals.length === 0) fail("needs at least one goal");
    if (lesson.steps.length < 5 || lesson.steps.length > 12) fail("needs 5-12 steps");

    for (const prerequisite of lesson.prerequisites) {
      if (!lessonIds.has(prerequisite)) fail(`prerequisite "${prerequisite}" does not exist`);
    }
    for (const chordId of lesson.chordIds) {
      if (!context.chordIds.has(chordId)) fail(`chord "${chordId}" is not in the library`);
    }

    const lessonChords = new Set(lesson.chordIds);
    for (const step of lesson.steps) {
      const failStep = (message: string) => fail(`step "${step.id}" ${message}`);
      if (stepIds.has(step.id)) failStep("has a duplicate id");
      stepIds.add(step.id);
      if (!step.title.trim() || !step.body.trim()) failStep("needs a title and a body");
      if (wordCount(step.body) > MAX_BODY_WORDS) failStep(`body is over ${MAX_BODY_WORDS} words`);
      if (!(step.durationSec > 0)) failStep("must have a duration above 0");

      const stepChords = [step.chordId, step.compareChordId, ...(step.drillChordIds ?? [])];
      for (const chordId of stepChords) {
        if (chordId === undefined) continue;
        if (!context.chordIds.has(chordId)) failStep(`uses unknown chord "${chordId}"`);
        else if (!lessonChords.has(chordId)) {
          failStep(`uses chord "${chordId}" that is missing from the lesson's chordIds`);
        }
      }
      if (step.strumPatternId !== undefined && !context.strumPatternIds.has(step.strumPatternId)) {
        failStep(`uses unknown strum pattern "${step.strumPatternId}"`);
      }
      if (step.bpm !== undefined && (step.bpm < 40 || step.bpm > 200)) {
        failStep("bpm must be between 40 and 200");
      }
      if (step.action === "drill" && (step.drillChordIds?.length ?? 0) < 2) {
        failStep("is a drill and needs at least two drillChordIds");
      }
      if (step.action === "quiz") {
        const quiz = step.quiz;
        if (!quiz) failStep("is a quiz without a question");
        else if (quiz.options.length < 2 || !quiz.options[quiz.answerIndex]) {
          failStep("has an invalid quiz answer");
        }
      }
      if (step.holdCycle) {
        const { holdSec, restSec, reps } = step.holdCycle;
        if (holdSec <= 0 || restSec <= 0 || reps <= 0) failStep("has an invalid hold cycle");
      }
      if (step.visual === "mistakes" && step.chordId === undefined) {
        failStep("shows mistakes but has no chord");
      }
    }

    const lastStep = lesson.steps[lesson.steps.length - 1];
    if (lastStep && lastStep.visual !== "summary") fail("last step must be the summary");
    if (lastStep && (lastStep.checklist?.length ?? 0) === 0)
      fail("summary needs a self-check list");
  }

  const cycle = findCycle(lessons);
  if (cycle) errors.push(`prerequisite cycle: ${cycle.join(" -> ")}`);

  return errors;
}
