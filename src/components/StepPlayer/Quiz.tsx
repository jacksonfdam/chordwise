import { useId, useState } from "react";
import type { QuizQuestion } from "../../domain/types";
import ui from "../../styles/ui.module.css";
import { Icon } from "../Icon/Icon";
import styles from "./StepPlayer.module.css";

/** One multiple-choice question. Feedback uses words and an icon, never color alone. */
export function Quiz({ quiz }: { quiz: QuizQuestion }) {
  const [picked, setPicked] = useState<number | null>(null);
  const id = useId();
  const correct = picked === quiz.answerIndex;

  return (
    <div className={styles.quiz} role="group" aria-labelledby={`${id}-question`}>
      <p id={`${id}-question`} className={styles.question}>
        {quiz.question}
      </p>
      <ul className={styles.options}>
        {quiz.options.map((option, index) => {
          const isPicked = picked === index;
          const isAnswer = picked !== null && index === quiz.answerIndex;
          return (
            <li key={option}>
              <button
                type="button"
                className={`${ui.button} ${styles.option}`}
                aria-pressed={isPicked}
                onClick={() => setPicked(index)}
              >
                <span className={styles.optionMark} aria-hidden="true">
                  {isAnswer ? (
                    <Icon name="check" size={16} />
                  ) : isPicked ? (
                    <Icon name="close" size={16} />
                  ) : null}
                </span>
                {option}
              </button>
            </li>
          );
        })}
      </ul>
      <p className={styles.feedback} role="status">
        {picked === null ? (
          "Pick an answer."
        ) : (
          <>
            <strong className={correct ? ui.live : styles.wrong}>
              {correct ? "Correct." : "Not quite."}
            </strong>{" "}
            {quiz.explanation}
          </>
        )}
      </p>
    </div>
  );
}
