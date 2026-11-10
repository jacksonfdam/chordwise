import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StepPlayer } from "../components/StepPlayer/StepPlayer";
import { findLesson } from "../data/lessons";
import { useProgress } from "../hooks/useProgress";
import ui from "../styles/ui.module.css";
import page from "./Page.module.css";

export default function LessonPlayer() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const lesson = lessonId ? findLesson(lessonId) : undefined;
  const { lessons, setStepReached, completeLesson } = useProgress();

  useEffect(() => {
    document.title = lesson ? `${lesson.title} · Chordwise` : "Lesson not found · Chordwise";
  }, [lesson]);

  if (!lesson) {
    return (
      <main id="main" className={page.page} style={{ padding: "var(--s6) var(--s4)" }}>
        <div className={page.header}>
          <p className={ui.eyebrow}>Error 404</p>
          <h1>We could not find that lesson</h1>
          <p>The link may be old. All lessons are listed on the lessons page.</p>
        </div>
        <div className={ui.row}>
          <Link className={ui.primary} to="/lessons">
            See the lessons
          </Link>
        </div>
      </main>
    );
  }

  const saved = lessons[lesson.id];
  // A finished lesson starts over; an unfinished one resumes where it stopped.
  const initialStepIndex = saved && !saved.completed ? saved.lastStepIndex : 0;

  return (
    <StepPlayer
      key={lesson.id}
      lesson={lesson}
      initialStepIndex={initialStepIndex}
      onStepChange={(index) => setStepReached(lesson.id, index)}
      onComplete={() => completeLesson(lesson.id)}
      onExit={() => navigate("/lessons")}
    />
  );
}
