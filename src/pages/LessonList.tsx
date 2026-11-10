import { useEffect } from "react";
import { LessonCard } from "../components/LessonCard/LessonCard";
import { ProgressBar } from "../components/ProgressBar/ProgressBar";
import { LESSONS, lessonsByLevel, LEVELS } from "../data/lessons";
import { useProgress } from "../hooks/useProgress";
import ui from "../styles/ui.module.css";
import page from "./Page.module.css";

export default function LessonList() {
  const { lessons } = useProgress();
  const isDone = (id: string) => lessons[id]?.completed === true;
  const totalDone = LESSONS.filter((lesson) => isDone(lesson.id)).length;
  const beginnerDone = lessonsByLevel("beginner").every((lesson) => isDone(lesson.id));

  useEffect(() => {
    document.title = "Lessons · Chordwise";
  }, []);

  return (
    <div className={page.page}>
      <header className={page.header}>
        <p className={ui.eyebrow}>Curriculum</p>
        <h1>Lessons</h1>
        <p className={page.lead}>
          Twenty-one short lessons, from holding the guitar to barre chords. Each one takes about
          ten minutes.
        </p>
        <ProgressBar value={totalDone} max={LESSONS.length} label="All lessons completed" />
      </header>

      {LEVELS.map((level) => {
        const levelLessons = lessonsByLevel(level.id);
        const done = levelLessons.filter((lesson) => isDone(lesson.id)).length;
        return (
          <section key={level.id} className={page.section} aria-labelledby={`level-${level.id}`}>
            <div className={page.sectionHeader}>
              <h2 id={`level-${level.id}`}>{level.title}</h2>
              <p>{level.description}</p>
              <ProgressBar
                value={done}
                max={levelLessons.length}
                label={`${level.title} lessons completed`}
              />
              {level.id === "intermediate" && !beginnerDone && (
                <p className={page.hint}>
                  Recommended: finish the Beginner lessons first. Nothing is locked, so feel free to
                  look ahead.
                </p>
              )}
            </div>
            <ul className={page.grid}>
              {levelLessons.map((lesson) => (
                <li key={lesson.id}>
                  <LessonCard lesson={lesson} progress={lessons[lesson.id]} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
