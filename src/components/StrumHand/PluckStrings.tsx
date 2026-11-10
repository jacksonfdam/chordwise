import { useEffect, useRef, useState } from "react";
import { fretFrequency, noteNameAt, STRING_INDEXES, STRING_NAMES } from "../../domain/fretboard";
import type { Chord, StringIndex } from "../../domain/types";
import { useAudio } from "../../hooks/useAudio";
import ui from "../../styles/ui.module.css";
import { Icon } from "../Icon/Icon";
import styles from "./StrumHand.module.css";

export interface PluckStringsProps {
  chord: Chord;
}

const STEP_MS = 520;

/**
 * Picking practice: the strings of a chord, one at a time. Tap a string to
 * hear its note, or let it walk through every string that should ring.
 */
export function PluckStrings({ chord }: PluckStringsProps) {
  const { pluck } = useAudio();
  const [active, setActive] = useState<StringIndex | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const sounding = STRING_INDEXES.filter((string) => chord.frets[string] !== "x");

  const play = (string: StringIndex) => {
    const fret = chord.frets[string];
    if (fret === "x") return;
    pluck(fretFrequency(string, fret));
    setActive(string);
  };

  const playAll = () => {
    clearTimers();
    sounding.forEach((string, index) => {
      if (index === 0) play(string);
      else timers.current.push(window.setTimeout(() => play(string), index * STEP_MS));
    });
  };

  return (
    <div className={styles.pluck} data-on-string={active ?? "none"}>
      <img
        className={styles.pluckPicture}
        src="/hands/picking.webp"
        width={560}
        height={560}
        loading="lazy"
        decoding="async"
        alt="A hand holding a pick against one string over the sound hole."
      />
      <div className={styles.pluckSide}>
        <ol className={styles.strings} aria-label={`Strings of ${chord.fullName}, thickest first`}>
          {STRING_INDEXES.map((string) => {
            const fret = chord.frets[string];
            const muted = fret === "x";
            const note = muted ? "×" : noteNameAt(string, fret);
            const live = active === string;
            return (
              <li key={string}>
                <button
                  type="button"
                  className={
                    live ? `${styles.stringButton} ${styles.stringLive}` : styles.stringButton
                  }
                  disabled={muted}
                  aria-label={
                    muted
                      ? `${STRING_NAMES[string]} string: muted, do not play it`
                      : `Pluck the ${STRING_NAMES[string]} string: ${note}`
                  }
                  onClick={() => play(string)}
                >
                  <span className={styles.stringName}>{STRING_NAMES[string]}</span>
                  <span
                    className={styles.wire}
                    style={{ height: `${1 + (5 - string) * 0.6}px` }}
                    aria-hidden="true"
                  />
                  <span className={styles.stringNote}>{note}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <button type="button" className={ui.button} onClick={playAll}>
          <Icon name="play" />
          Pluck each string
        </button>
        <p className={styles.caption}>
          {active === null
            ? "Tap a string to hear the note it should make."
            : `${STRING_NAMES[active]} string. It should ring clearly, with no buzz.`}
        </p>
      </div>
    </div>
  );
}
