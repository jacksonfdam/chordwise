import { useRef, useState } from "react";
import {
  OPEN_STRING_FREQUENCIES,
  STRING_INDEXES,
  STRING_LETTERS,
  STRING_NAMES,
} from "../../domain/fretboard";
import type { StringIndex } from "../../domain/types";
import { useAudio } from "../../hooks/useAudio";
import styles from "./OpenStrings.module.css";

export interface OpenStringsProps {
  /** "names" teaches the string names; "tuner" presents them as reference tones. */
  mode?: "names" | "tuner";
}

const RING_MS = 1200;

/** The six open strings as large buttons; tapping one plays its pitch. */
export function OpenStrings({ mode = "names" }: OpenStringsProps) {
  const { pluck } = useAudio();
  const [ringing, setRinging] = useState<StringIndex | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const play = (string: StringIndex) => {
    pluck(OPEN_STRING_FREQUENCIES[string]);
    setRinging(string);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setRinging(null), RING_MS);
  };

  return (
    <div className={styles.wrap}>
      <ol
        className={styles.list}
        aria-label={mode === "tuner" ? "Reference tones" : "Open strings"}
      >
        {STRING_INDEXES.map((string) => {
          const number = 6 - string;
          const live = ringing === string;
          return (
            <li key={string}>
              <button
                type="button"
                className={live ? `${styles.string} ${styles.live}` : styles.string}
                onClick={() => play(string)}
                aria-label={`Play string ${number}, ${STRING_NAMES[string]}, ${OPEN_STRING_FREQUENCIES[string]} hertz`}
              >
                <span className={styles.number}>{number}</span>
                <span className={styles.letter}>{STRING_LETTERS[string]}</span>
                <span
                  className={styles.wire}
                  style={{ height: `${1 + (5 - string) * 0.7}px` }}
                  aria-hidden="true"
                />
                <span className={styles.meta}>
                  {mode === "tuner"
                    ? `${OPEN_STRING_FREQUENCIES[string].toFixed(1)} Hz`
                    : string === 0
                      ? "thickest"
                      : string === 5
                        ? "thinnest"
                        : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className={styles.hint}>
        {mode === "tuner"
          ? "Tap a string to hear the note it should make, then match your guitar to it."
          : "Tap a string to hear it. String 6 is the thickest, string 1 the thinnest."}
      </p>
    </div>
  );
}
