import type { Lesson, Level } from "../domain/types";

/*
 * Every file in ./lessons exports one `lesson`. Adding a lesson is just adding
 * a file; it is picked up here and ordered by its `order` field.
 */
const modules = import.meta.glob<{ lesson: Lesson }>("./lessons/*.ts", { eager: true });

export const LESSONS: readonly Lesson[] = Object.values(modules)
  .map((module) => module.lesson)
  .sort((a, b) => a.order - b.order);

const LESSON_BY_ID: ReadonlyMap<string, Lesson> = new Map(
  LESSONS.map((lesson) => [lesson.id, lesson]),
);

export const LEVELS: readonly { id: Level; title: string; description: string }[] = [
  {
    id: "beginner",
    title: "Beginner",
    description:
      "Start from zero: meet the guitar, read chord diagrams, learn the open chords and strum your first progressions.",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description:
      "Add color and power: seventh and sus chords, smoother changes, power chords, barre chords and playing in keys.",
  },
];

export function findLesson(id: string): Lesson | undefined {
  return LESSON_BY_ID.get(id);
}

export function lessonsByLevel(level: Level): Lesson[] {
  return LESSONS.filter((lesson) => lesson.level === level);
}

/** The lesson that follows `id` in the curriculum, if there is one. */
export function nextLesson(id: string): Lesson | undefined {
  const index = LESSONS.findIndex((lesson) => lesson.id === id);
  return index === -1 ? undefined : LESSONS[index + 1];
}

/** The first lesson that teaches a chord, used to link the library back to the lessons. */
export function lessonTeachingChord(chordId: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.chordIds.includes(chordId));
}
