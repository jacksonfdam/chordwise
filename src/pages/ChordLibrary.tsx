import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChordDiagram } from "../components/ChordDiagram/ChordDiagram";
import { HandDiagram, hasHandPicture } from "../components/HandDiagram/HandDiagram";
import { Icon } from "../components/Icon/Icon";
import { CHORD_FILTERS, CHORDS, findChord, matchesFilter, type ChordFilter } from "../data/chords";
import { lessonTeachingChord } from "../data/lessons";
import { STRING_INDEXES, STRING_NAMES } from "../domain/fretboard";
import type { Chord } from "../domain/types";
import { useAudio } from "../hooks/useAudio";
import ui from "../styles/ui.module.css";
import styles from "./ChordLibrary.module.css";
import page from "./Page.module.css";

const QUALITY_WORDS: Record<Chord["quality"], string> = {
  major: "major",
  minor: "minor",
  dominant7: "dominant seventh 7th",
  minor7: "minor seventh 7th",
  major7: "major seventh 7th",
  sus2: "suspended sus sus2",
  sus4: "suspended sus sus4",
  power: "power",
};

function searchText(chord: Chord): string {
  return [chord.id, chord.name, chord.fullName, QUALITY_WORDS[chord.quality], chord.level]
    .join(" ")
    .toLowerCase();
}

/** Finger placement in words, thickest string first. */
function placementLines(chord: Chord): string[] {
  const lines = (chord.barres ?? []).map(
    (barre) =>
      `Finger ${barre.finger} lies flat across fret ${barre.fret}, from the ${STRING_NAMES[barre.fromString]} string to the ${STRING_NAMES[barre.toString]} string.`,
  );
  for (const string of STRING_INDEXES) {
    const fret = chord.frets[string];
    const name = `${STRING_NAMES[string]} string`;
    if (fret === "x") lines.push(`${name}: do not play it.`);
    else if (fret === 0) lines.push(`${name}: open.`);
    else {
      const onBarre = (chord.barres ?? []).some(
        (barre) => barre.fret === fret && string >= barre.fromString && string <= barre.toString,
      );
      if (!onBarre) lines.push(`${name}: finger ${chord.fingers[string]} on fret ${fret}.`);
    }
  }
  return lines;
}

function ChordDetails({ chord, onPlay }: { chord: Chord; onPlay: (chord: Chord) => void }) {
  const lesson = lessonTeachingChord(chord.id);
  const related = chord.relatedChordIds
    .map((chordId) => findChord(chordId))
    .filter((candidate): candidate is Chord => candidate !== undefined);
  return (
    <div className={styles.details}>
      <div className={styles.detailsTop}>
        <ChordDiagram chord={chord} size="lg" showNoteNames />
        <div className={styles.detailsIntro}>
          <p className={ui.eyebrow}>
            {chord.level} · {chord.fullName}
          </p>
          <h2 id="chord-details-title" className={styles.detailsName} tabIndex={-1}>
            {chord.name}
          </h2>
          <p>{chord.sound}</p>
          <button type="button" className={ui.primary} onClick={() => onPlay(chord)}>
            <Icon name="sound" />
            Play
          </button>
        </div>
      </div>

      {hasHandPicture(chord) && (
        <section aria-labelledby="chord-hand">
          <h3 id="chord-hand" className={ui.eyebrow}>
            Hand position
          </h3>
          <HandDiagram chord={chord} size="lg" />
        </section>
      )}

      <section aria-labelledby="chord-placement">
        <h3 id="chord-placement" className={ui.eyebrow}>
          Finger placement
        </h3>
        <ul className={styles.list}>
          {placementLines(chord).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="chord-tips">
        <h3 id="chord-tips" className={ui.eyebrow}>
          Tips
        </h3>
        <ul className={styles.list}>
          {chord.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="chord-mistakes">
        <h3 id="chord-mistakes" className={ui.eyebrow}>
          Common mistakes
        </h3>
        <ul className={styles.mistakes}>
          {chord.commonMistakes.map((mistake) => (
            <li key={mistake.problem}>
              <p className={styles.problem}>{mistake.problem}</p>
              <p>{mistake.fix}</p>
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="chord-related">
          <h3 id="chord-related" className={ui.eyebrow}>
            Related chords
          </h3>
          <ul className={ui.row}>
            {related.map((candidate) => (
              <li key={candidate.id}>
                <Link className={ui.chipButton} to={`/chords/${candidate.id}`} replace>
                  {candidate.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lesson && (
        <Link className={ui.button} to={`/lessons/${lesson.id}`}>
          Learn it in lesson {lesson.order}
          <Icon name="arrow" />
        </Link>
      )}
    </div>
  );
}

export default function ChordLibrary() {
  const { chordId } = useParams();
  const navigate = useNavigate();
  const { strum } = useAudio();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ChordFilter[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const selected = chordId ? findChord(chordId) : undefined;

  const visible = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return CHORDS.filter((chord) => {
      const text = searchText(chord);
      const matchesQuery = words.every((word) => text.includes(word));
      const matchesFilters =
        filters.length === 0 || filters.some((filter) => matchesFilter(chord, filter));
      return matchesQuery && matchesFilters;
    });
  }, [query, filters]);

  useEffect(() => {
    document.title = selected ? `${selected.fullName} · Chordwise` : "Chord library · Chordwise";
  }, [selected]);

  // The drawer is a native modal dialog: it traps focus and closes on Escape by itself.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      dialog.querySelector<HTMLElement>("#chord-details-title")?.focus();
    } else if (!selected && dialog.open) {
      dialog.close();
    }
  }, [selected]);

  const toggleFilter = (filter: ChordFilter) =>
    setFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
    );

  const closeDrawer = () => navigate("/chords");

  return (
    <div className={page.page}>
      <header className={page.header}>
        <p className={ui.eyebrow}>Reference</p>
        <h1>Chord library</h1>
        <p className={page.lead}>
          Every chord from the lessons. Tap Play to hear one, or open it for fingering, tips and
          fixes.
        </p>
      </header>

      <div className={page.toolbar}>
        <div className={page.field}>
          <label htmlFor="chord-search" className={ui.eyebrow}>
            Search by name, type or level
          </label>
          <input
            id="chord-search"
            className={ui.input}
            type="search"
            placeholder="Try: Am, minor, seventh, beginner"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className={ui.row} role="group" aria-label="Filter by chord family">
          {CHORD_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={ui.chipButton}
              aria-pressed={filters.includes(filter.id)}
              onClick={() => toggleFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <p className={ui.muted} role="status">
          {visible.length} of {CHORDS.length} chords
        </p>
      </div>

      {chordId && !selected && (
        <p className={page.hint} role="alert">
          There is no chord called “{chordId}” in the library.
        </p>
      )}

      {visible.length === 0 ? (
        <p className={page.empty}>No chords match. Clear the search or remove a filter.</p>
      ) : (
        <ul className={styles.grid}>
          {visible.map((chord) => {
            const lesson = lessonTeachingChord(chord.id);
            return (
              <li key={chord.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <h2 className={styles.cardName}>{chord.name}</h2>
                  <span className={ui.eyebrow}>{chord.fullName}</span>
                </div>
                <ChordDiagram chord={chord} size="md" />
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={ui.button}
                    onClick={() => strum(chord)}
                    aria-label={`Play ${chord.fullName}`}
                  >
                    <Icon name="sound" />
                    Play
                  </button>
                  <Link
                    className={ui.button}
                    to={`/chords/${chord.id}`}
                    aria-label={`Details for ${chord.fullName}`}
                  >
                    Details
                  </Link>
                </div>
                {lesson && (
                  <Link className={styles.lessonLink} to={`/lessons/${lesson.id}`}>
                    Lesson {lesson.order}: {lesson.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        className={styles.drawer}
        aria-labelledby="chord-details-title"
        onClose={() => {
          if (selected) closeDrawer();
        }}
        onClick={(event) => {
          // A click on the backdrop lands on the dialog element itself.
          if (event.target === event.currentTarget) closeDrawer();
        }}
      >
        {selected && (
          <div className={styles.drawerBody}>
            <button
              type="button"
              className={`${ui.ghost} ${styles.close}`}
              onClick={closeDrawer}
              aria-label="Close chord details"
            >
              <Icon name="close" />
            </button>
            <ChordDetails key={selected.id} chord={selected} onPlay={(chord) => strum(chord)} />
          </div>
        )}
      </dialog>
    </div>
  );
}
