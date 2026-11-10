import { Link } from "react-router-dom";
import { findChord } from "../../data/chords";
import type { Lesson } from "../../domain/types";
import type { LessonProgress } from "../../hooks/useProgress";
import ui from "../../styles/ui.module.css";
import { Icon } from "../Icon/Icon";
import styles from "./LessonCard.module.css";

export interface LessonCardProps {
  lesson: Lesson;
  progress?: LessonProgress;
}

const MAX_CHIPS = 6;

export function LessonCard({ lesson, progress }: LessonCardProps) {
  const completed = progress?.completed === true;
  const started = !completed && progress !== undefined && progress.lastStepIndex > 0;
  const chords = lesson.chordIds.map((chordId) => findChord(chordId)?.name ?? chordId);
  const shown = chords.slice(0, MAX_CHIPS);
  const hidden = chords.length - shown.length;

  return (
    <Link
      to={`/lessons/${lesson.id}`}
      className={completed ? `${styles.card} ${styles.done}` : styles.card}
      aria-label={`Lesson ${lesson.order}: ${lesson.title}. ${lesson.estimatedMinutes} minutes.${
        completed ? " Completed." : started ? " In progress." : ""
      }`}
    >
      <div className={styles.top}>
        <span className={styles.number}>{String(lesson.order).padStart(2, "0")}</span>
        <span className={ui.eyebrow}>{lesson.estimatedMinutes} min</span>
        {completed && (
          <span className={styles.status}>
            <Icon name="check" size={16} />
            Done
          </span>
        )}
        {started && (
          <span className={styles.status}>
            Step {progress.lastStepIndex + 1} of {lesson.steps.length}
          </span>
        )}
      </div>
      <h3 className={styles.title}>{lesson.title}</h3>
      <p className={styles.summary}>{lesson.summary}</p>
      {shown.length > 0 && (
        <ul className={styles.chips} aria-label="Chords in this lesson">
          {shown.map((name) => (
            <li key={name} className={ui.chip}>
              {name}
            </li>
          ))}
          {hidden > 0 && <li className={ui.chip}>+{hidden}</li>}
        </ul>
      )}
    </Link>
  );
}
