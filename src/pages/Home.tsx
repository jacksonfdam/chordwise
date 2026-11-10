import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChordDiagram } from "../components/ChordDiagram/ChordDiagram";
import { Icon } from "../components/Icon/Icon";
import { ProgressBar } from "../components/ProgressBar/ProgressBar";
import { getChord } from "../data/chords";
import { LESSONS, lessonsByLevel, LEVELS } from "../data/lessons";
import { useAudio } from "../hooks/useAudio";
import { useProgress } from "../hooks/useProgress";
import ui from "../styles/ui.module.css";
import styles from "./Home.module.css";
import page from "./Page.module.css";

const FEATURES: readonly { title: string; text: string; to: string; link: string }[] = [
  {
    title: "Guided lessons",
    text: "One small step at a time, each with a timer, a diagram and plain-English instructions.",
    to: "/lessons",
    link: "Browse lessons",
  },
  {
    title: "Chord library",
    text: "Every chord from the lessons with fingering, sound, tips and common mistakes.",
    to: "/chords",
    link: "Open the library",
  },
  {
    title: "Play a song",
    text: "Paste a chord sheet and get a diagram for every chord in it, with transpose and autoscroll.",
    to: "/songs",
    link: "Open a song sheet",
  },
  {
    title: "Practice tools",
    text: "A steady metronome, strumming patterns you can see and hear, and chord-change drills.",
    to: "/tools",
    link: "Open the tools",
  },
];

export default function Home() {
  const { lessons } = useProgress();
  const { strum } = useAudio();
  const hero = getChord("Em");
  const isDone = (id: string) => lessons[id]?.completed === true;

  // The lesson to continue: the first one that is not finished yet.
  const hasProgress = Object.keys(lessons).length > 0;
  const upNext = LESSONS.find((lesson) => !isDone(lesson.id));
  const first = LESSONS[0];
  const upNextProgress = upNext ? lessons[upNext.id] : undefined;

  useEffect(() => {
    document.title = "Chordwise · Learn guitar chords step by step";
  }, []);

  return (
    <div className={page.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroText}>
          <p className={ui.eyebrow}>Guitar chords, from zero</p>
          <h1 id="home-title" className={styles.title}>
            Learn to play chords, one small step at a time.
          </h1>
          <p className={page.lead}>
            Chordwise is a guided trainer for absolute beginners. Short lessons show you where each
            finger goes, give you time to try it, and help you fix what sounds wrong.
          </p>
          <div className={ui.row}>
            {hasProgress && upNext ? (
              <Link className={ui.primary} to={`/lessons/${upNext.id}`}>
                Continue where you left off
                <Icon name="arrow" />
              </Link>
            ) : first ? (
              <Link className={ui.primary} to={`/lessons/${first.id}`}>
                Start here
                <Icon name="arrow" />
              </Link>
            ) : null}
            <Link className={ui.button} to="/lessons">
              See all lessons
            </Link>
          </div>
          {hasProgress && upNext && (
            <p className={ui.muted}>
              Up next: lesson {upNext.order}, {upNext.title}
              {upNextProgress && upNextProgress.lastStepIndex > 0
                ? ` (step ${upNextProgress.lastStepIndex + 1} of ${upNext.steps.length})`
                : ""}
              .
            </p>
          )}
          {hasProgress && !upNext && (
            <p className={ui.live}>
              You finished every lesson. Keep your hands moving with the tools.
            </p>
          )}
          {!hasProgress && (
            <p className={ui.muted}>New to the guitar? Lesson 1 starts with how to hold it.</p>
          )}
        </div>
        <div className={styles.heroFigure}>
          <ChordDiagram chord={hero} size="lg" highlightFingers={[2, 3]} animateIn />
          <button type="button" className={ui.button} onClick={() => strum(hero)}>
            <Icon name="sound" />
            Hear E minor
          </button>
        </div>
      </section>

      <section className={page.section} aria-labelledby="home-levels">
        <h2 id="home-levels">Two levels</h2>
        <ul className={page.grid}>
          {LEVELS.map((level) => {
            const levelLessons = lessonsByLevel(level.id);
            const done = levelLessons.filter((lesson) => isDone(lesson.id)).length;
            return (
              <li key={level.id} className={page.panel}>
                <p className={ui.eyebrow}>{levelLessons.length} lessons</p>
                <h3>{level.title}</h3>
                <p>{level.description}</p>
                <ProgressBar
                  value={done}
                  max={levelLessons.length}
                  label={`${level.title} lessons completed`}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section className={page.section} aria-labelledby="home-features">
        <h2 id="home-features">What is inside</h2>
        <ul className={page.grid}>
          {FEATURES.map((feature) => (
            <li key={feature.title} className={page.panel}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <Link to={feature.to}>{feature.link}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
