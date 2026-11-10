import { useEffect, useMemo, useRef, useState } from "react";
import { ChordDiagram } from "../components/ChordDiagram/ChordDiagram";
import { Icon } from "../components/Icon/Icon";
import { EXAMPLE_SHEET } from "../data/exampleSheet";
import { layoutChordLine, parseChordSheet, type SheetLine } from "../domain/chordSheet";
import { resolveChord, transposeSymbol, type ResolvedChord } from "../domain/chordSymbols";
import { useAudio } from "../hooks/useAudio";
import ui from "../styles/ui.module.css";
import page from "./Page.module.css";
import styles from "./SongSheet.module.css";

const STORAGE_KEY = "chordwise:sheet:v1";
const SPEEDS = [0.5, 0.75, 1, 1.5, 2] as const;
/** Pixels per second at speed 1. */
const SCROLL_RATE = 22;
const MIN_FONT_STEP = -2;
const MAX_FONT_STEP = 4;

function readSavedSheet(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveSheet(text: string): void {
  try {
    if (text) window.localStorage.setItem(STORAGE_KEY, text);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be full or blocked; the sheet then lasts for this visit only.
  }
}

function formatTranspose(semitones: number): string {
  if (semitones === 0) return "0";
  return semitones > 0 ? `+${semitones}` : String(semitones);
}

/** Scrolls the page down at a steady rate while `active`, and reports when it reaches the end. */
function useAutoscroll(active: boolean, speed: number, onEnd: () => void): void {
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last = performance.now();
    let carry = 0;
    const step = (now: number) => {
      // Clock deltas keep the pace even when frames are dropped.
      carry += ((now - last) / 1000) * SCROLL_RATE * speed;
      last = now;
      const whole = Math.floor(carry);
      if (whole > 0) {
        carry -= whole;
        window.scrollBy(0, whole);
      }
      const atEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atEnd) {
        onEndRef.current();
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, speed]);
}

interface SheetViewProps {
  lines: readonly SheetLine[];
  transpose: number;
  useFlats: boolean;
  selected: string | null;
  known: ReadonlySet<string>;
  onPick: (symbol: string) => void;
}

function SheetView({ lines, transpose, useFlats, selected, known, onPick }: SheetViewProps) {
  return (
    <div className={styles.sheet}>
      {lines.map((line, index) => {
        switch (line.kind) {
          case "empty":
            return (
              <div key={index} className={styles.line} aria-hidden="true">
                {" "}
              </div>
            );
          case "section":
            return (
              <h3 key={index} className={`${styles.line} ${styles.section}`}>
                {line.text}
              </h3>
            );
          case "chords": {
            const { segments, tail } = layoutChordLine(line, transpose, useFlats);
            return (
              <div key={index} className={`${styles.line} ${styles.chordLine}`}>
                {segments.map((segment, position) =>
                  known.has(segment.symbol) ? (
                    <span key={position}>
                      {segment.before}
                      <button
                        type="button"
                        className={styles.chord}
                        aria-pressed={selected === segment.symbol}
                        onClick={() => onPick(segment.symbol)}
                      >
                        {segment.symbol}
                      </button>
                    </span>
                  ) : (
                    <span key={position}>
                      {segment.before}
                      {segment.symbol}
                    </span>
                  ),
                )}
                {tail}
              </div>
            );
          }
          case "shape":
            return (
              <div key={index} className={`${styles.line} ${styles.note}`}>
                {line.text}
              </div>
            );
          case "text":
            return (
              <div key={index} className={styles.line}>
                {line.text}
              </div>
            );
        }
      })}
    </div>
  );
}

export default function SongSheet() {
  const [draft, setDraft] = useState(readSavedSheet);
  const [source, setSource] = useState(readSavedSheet);
  const [transpose, setTranspose] = useState(0);
  const [useFlats, setUseFlats] = useState(false);
  const [fontStep, setFontStep] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [scrolling, setScrolling] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [editing, setEditing] = useState(() => readSavedSheet() === "");
  const stripRef = useRef<HTMLUListElement>(null);
  const { strum } = useAudio();

  useEffect(() => {
    document.title = "Play a song · Chordwise";
  }, []);

  const sheet = useMemo(() => parseChordSheet(source), [source]);

  /** The chords to show, transposed, each with a shape to play. */
  const chords = useMemo(() => {
    const result: ResolvedChord[] = [];
    const seen = new Set<string>();
    for (const original of sheet.symbols) {
      const symbol = transposeSymbol(original, transpose, useFlats);
      if (seen.has(symbol)) continue;
      seen.add(symbol);
      // Shapes written in the sheet only apply in the sheet's own key.
      const resolved = resolveChord(
        symbol,
        transpose === 0 && !useFlats ? sheet.shapes : undefined,
      );
      if (resolved) result.push(resolved);
    }
    return result;
  }, [sheet, transpose, useFlats]);

  const known = useMemo(() => new Set(chords.map((chord) => chord.symbol)), [chords]);
  const selected = chords.find((chord) => chord.symbol === picked) ?? chords[0];

  useAutoscroll(scrolling, speed, () => setScrolling(false));

  const pick = (symbol: string) => {
    setPicked(symbol);
    const chord = chords.find((candidate) => candidate.symbol === symbol);
    if (chord) strum(chord.chord);
    const item = Array.from(stripRef.current?.children ?? []).find(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.dataset.symbol === symbol,
    );
    item?.scrollIntoView?.({ block: "nearest", inline: "center" });
  };

  const show = (text: string) => {
    setDraft(text);
    setSource(text);
    saveSheet(text);
    setTranspose(0);
    setPicked(null);
    setScrolling(false);
    setEditing(text.trim() === "");
  };

  const hasSheet = sheet.lines.length > 0;
  const fontSize = `${(15 + fontStep * 1.5) / 16}rem`;

  return (
    <div className={page.page}>
      <header className={page.header}>
        <p className={ui.eyebrow}>Play a song</p>
        <h1>Song sheet</h1>
        <p className={page.lead}>
          Paste a chord sheet, the kind with chord names written above the lyrics. You get a diagram
          for every chord, and you can tap any chord in the song to see and hear it.
        </p>
      </header>

      <section className={page.panel} aria-labelledby="sheet-editor-title">
        <div className={styles.editorHead}>
          <h2 id="sheet-editor-title">{hasSheet ? "Your sheet" : "Paste your chord sheet"}</h2>
          {hasSheet && (
            <button
              type="button"
              className={ui.ghost}
              aria-expanded={editing}
              aria-controls="sheet-editor"
              onClick={() => setEditing((value) => !value)}
            >
              {editing ? "Hide" : "Edit"}
            </button>
          )}
        </div>
        <div id="sheet-editor" className={styles.editor} hidden={!editing}>
          <label htmlFor="sheet-text" className={ui.eyebrow}>
            Chord sheet text
          </label>
          <textarea
            id="sheet-text"
            className={styles.textarea}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              "[Verse]\nG          Em\nWords go under the chords\nC          D\nOne line of chords, one of words"
            }
            spellCheck={false}
            rows={10}
          />
          <div className={ui.row}>
            <button
              type="button"
              className={ui.primary}
              onClick={() => show(draft)}
              disabled={draft.trim() === ""}
            >
              Show how to play
            </button>
            <button type="button" className={ui.button} onClick={() => show(EXAMPLE_SHEET)}>
              Load an example
            </button>
            {(draft !== "" || hasSheet) && (
              <button type="button" className={ui.ghost} onClick={() => show("")}>
                Clear
              </button>
            )}
          </div>
          <p className={ui.muted}>
            The text stays on this device. Section names go in [brackets]; a line made only of chord
            names is read as chords.
          </p>
        </div>
      </section>

      {hasSheet && chords.length === 0 && (
        <p className={page.hint} role="status">
          No chord names were found. Make sure the chords sit on their own lines, like “G Em C D”.
        </p>
      )}

      {hasSheet && chords.length > 0 && selected && (
        <div className={styles.workspace}>
          <aside className={styles.chordPanel} aria-label="Chords in this song">
            <div className={styles.now}>
              <ChordDiagram chord={selected.chord} size="md" showNoteNames />
              <div className={styles.nowText}>
                <p className={ui.eyebrow}>Selected chord</p>
                <p className={styles.nowName}>{selected.symbol}</p>
                <p className={ui.muted}>{selected.chord.fullName}</p>
                <button type="button" className={ui.button} onClick={() => strum(selected.chord)}>
                  <Icon name="sound" />
                  Play
                </button>
                {selected.note && <p className={styles.shapeNote}>{selected.note}</p>}
              </div>
            </div>
            <ul ref={stripRef} className={styles.strip}>
              {chords.map((entry) => (
                <li key={entry.symbol} data-symbol={entry.symbol}>
                  <button
                    type="button"
                    className={styles.chip}
                    aria-pressed={selected.symbol === entry.symbol}
                    aria-label={`Show ${entry.symbol}, ${entry.chord.fullName}`}
                    onClick={() => pick(entry.symbol)}
                  >
                    <span className={styles.chipName}>{entry.symbol}</span>
                    <ChordDiagram chord={entry.chord} size="sm" />
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className={styles.song} aria-labelledby="sheet-song-title">
            <h2 id="sheet-song-title" className="sr-only">
              Song
            </h2>
            <div className={styles.toolbar} role="group" aria-label="Sheet controls">
              <button
                type="button"
                className={scrolling ? ui.primary : ui.button}
                aria-pressed={scrolling}
                onClick={() => setScrolling((value) => !value)}
              >
                <Icon name={scrolling ? "pause" : "play"} />
                Autoscroll
              </button>
              <div className={styles.control}>
                <label htmlFor="sheet-speed" className={ui.eyebrow}>
                  Speed
                </label>
                <select
                  id="sheet-speed"
                  className={page.select}
                  value={speed}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                >
                  {SPEEDS.map((value) => (
                    <option key={value} value={value}>
                      {value}×
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.control}>
                <span className={ui.eyebrow} id="sheet-transpose-label">
                  Transpose
                </span>
                <div
                  className={styles.stepper}
                  role="group"
                  aria-labelledby="sheet-transpose-label"
                >
                  <button
                    type="button"
                    className={ui.ghost}
                    onClick={() => setTranspose((value) => Math.max(-11, value - 1))}
                    aria-label="Transpose down one semitone"
                  >
                    −
                  </button>
                  <output className={styles.value} aria-live="polite">
                    {formatTranspose(transpose)}
                  </output>
                  <button
                    type="button"
                    className={ui.ghost}
                    onClick={() => setTranspose((value) => Math.min(11, value + 1))}
                    aria-label="Transpose up one semitone"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className={styles.control}>
                <span className={ui.eyebrow} id="sheet-size-label">
                  Text size
                </span>
                <div className={styles.stepper} role="group" aria-labelledby="sheet-size-label">
                  <button
                    type="button"
                    className={ui.ghost}
                    onClick={() => setFontStep((value) => Math.max(MIN_FONT_STEP, value - 1))}
                    disabled={fontStep === MIN_FONT_STEP}
                    aria-label="Smaller text"
                  >
                    −
                  </button>
                  <output className={styles.value}>{fontStep}</output>
                  <button
                    type="button"
                    className={ui.ghost}
                    onClick={() => setFontStep((value) => Math.min(MAX_FONT_STEP, value + 1))}
                    disabled={fontStep === MAX_FONT_STEP}
                    aria-label="Larger text"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                type="button"
                className={ui.chipButton}
                aria-pressed={useFlats}
                onClick={() => setUseFlats((value) => !value)}
                title="Write accidentals as flats (Bb) instead of sharps (A#)"
              >
                Use flats ♭
              </button>
            </div>

            {(sheet.capo !== null || transpose !== 0) && (
              <p className={page.hint}>
                {sheet.capo !== null &&
                  `This sheet uses a capo on fret ${sheet.capo}: clamp it there and play the shapes as shown. `}
                {transpose !== 0 &&
                  `Chords are transposed ${formatTranspose(transpose)} semitone${Math.abs(transpose) === 1 ? "" : "s"} from the sheet.`}
              </p>
            )}

            <div className={styles.sheetScroll} style={{ fontSize }}>
              <SheetView
                lines={sheet.lines}
                transpose={transpose}
                useFlats={useFlats}
                selected={selected.symbol}
                known={known}
                onPick={pick}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
