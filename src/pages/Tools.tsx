import { useEffect, useState } from "react";
import { clampBpm, MAX_BPM, MIN_BPM } from "../audio/scheduler";
import { ChordChangeDrill } from "../components/ChordChangeDrill/ChordChangeDrill";
import { Metronome } from "../components/Metronome/Metronome";
import { CHORDS, findChord, getChord } from "../data/chords";
import { DRILL_PRESETS, PROGRESSIONS } from "../data/progressions";
import { STRUM_PATTERNS } from "../data/strumPatterns";
import ui from "../styles/ui.module.css";
import page from "./Page.module.css";

const CUSTOM = "custom";

interface DrillOption {
  id: string;
  label: string;
  chordIds: readonly string[];
  barsPerChord: number;
  startBpm: number;
}

const chordName = (chordId: string) => findChord(chordId)?.name ?? chordId;

const PAIR_OPTIONS: readonly DrillOption[] = DRILL_PRESETS.map((preset) => ({
  id: `pair:${preset.id}`,
  label: preset.chordIds.map(chordName).join(" ↔ "),
  chordIds: preset.chordIds,
  barsPerChord: 2,
  startBpm: 60,
}));

const PROGRESSION_OPTIONS: readonly DrillOption[] = PROGRESSIONS.map((progression) => ({
  id: `progression:${progression.id}`,
  label: `${progression.name} (${progression.formula} in ${progression.key})`,
  chordIds: progression.chordIds,
  barsPerChord: 1,
  startBpm: progression.bpm,
}));

const DIFFICULTY_LABEL = { 1: "Easy", 2: "Medium", 3: "Harder" } as const;

function NumberField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className={page.field}>
      <label htmlFor={id} className={ui.eyebrow}>
        {label}
      </label>
      <input
        id={id}
        className={ui.input}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, Math.round(next))));
        }}
      />
    </div>
  );
}

function StrumPractice() {
  const [patternId, setPatternId] = useState("quarter-notes");
  const [chordId, setChordId] = useState("Em");
  const pattern =
    STRUM_PATTERNS.find((candidate) => candidate.id === patternId) ?? STRUM_PATTERNS[0];
  const chord = findChord(chordId) ?? getChord("Em");
  if (!pattern) return null;

  return (
    <div className={page.panel}>
      <div className={page.fields}>
        <div className={page.field}>
          <label htmlFor="strum-pattern" className={ui.eyebrow}>
            Pattern
          </label>
          <select
            id="strum-pattern"
            className={page.select}
            value={pattern.id}
            onChange={(event) => setPatternId(event.target.value)}
          >
            {STRUM_PATTERNS.map((candidate, index) => (
              <option key={candidate.id} value={candidate.id}>
                {index + 1}. {candidate.name} ({candidate.timeSignature})
              </option>
            ))}
          </select>
        </div>
        <div className={page.field}>
          <label htmlFor="strum-chord" className={ui.eyebrow}>
            Chord
          </label>
          <select
            id="strum-chord"
            className={page.select}
            value={chord.id}
            onChange={(event) => setChordId(event.target.value)}
          >
            {CHORDS.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p>
        <span className={ui.eyebrow}>{DIFFICULTY_LABEL[pattern.difficulty]}</span>{" "}
        {pattern.description}
      </p>
      {/* A new pattern is a new exercise: remounting stops the old click cleanly. */}
      <Metronome
        key={pattern.id}
        pattern={pattern}
        chord={chord}
        initialBpm={70}
        title={pattern.name}
      />
      <ul className={ui.stack}>
        {pattern.tips.map((tip) => (
          <li key={tip} className={ui.muted}>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DrillPractice() {
  const [optionId, setOptionId] = useState(PAIR_OPTIONS[0]?.id ?? CUSTOM);
  const [customA, setCustomA] = useState("G");
  const [customB, setCustomB] = useState("D");
  const [startBpm, setStartBpm] = useState(60);
  const [targetBpm, setTargetBpm] = useState(100);
  const [increment, setIncrement] = useState(4);
  const [barsPerChord, setBarsPerChord] = useState(2);

  const option = [...PAIR_OPTIONS, ...PROGRESSION_OPTIONS].find(
    (candidate) => candidate.id === optionId,
  );
  const chordIds = option ? option.chordIds : [customA, customB];

  const choose = (id: string) => {
    setOptionId(id);
    const chosen = [...PAIR_OPTIONS, ...PROGRESSION_OPTIONS].find(
      (candidate) => candidate.id === id,
    );
    if (chosen) {
      setBarsPerChord(chosen.barsPerChord);
      setStartBpm(chosen.startBpm);
      setTargetBpm(Math.max(targetBpm, chosen.startBpm));
    }
  };

  const sameChord = !option && customA === customB;
  const safeTarget = Math.max(targetBpm, startBpm);
  // Any setting change is a fresh drill.
  const drillKey = [chordIds.join("+"), startBpm, safeTarget, increment, barsPerChord].join("|");

  return (
    <div className={page.panel}>
      <div className={page.field}>
        <label htmlFor="drill-preset" className={ui.eyebrow}>
          What to drill
        </label>
        <select
          id="drill-preset"
          className={page.select}
          value={optionId}
          onChange={(event) => choose(event.target.value)}
        >
          <optgroup label="Chord pairs">
            {PAIR_OPTIONS.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Progressions">
            {PROGRESSION_OPTIONS.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </optgroup>
          <option value={CUSTOM}>Choose two chords…</option>
        </select>
      </div>

      {!option && (
        <div className={page.fields}>
          <div className={page.field}>
            <label htmlFor="drill-a" className={ui.eyebrow}>
              Chord A
            </label>
            <select
              id="drill-a"
              className={page.select}
              value={customA}
              onChange={(event) => setCustomA(event.target.value)}
            >
              {CHORDS.map((chord) => (
                <option key={chord.id} value={chord.id}>
                  {chord.name}
                </option>
              ))}
            </select>
          </div>
          <div className={page.field}>
            <label htmlFor="drill-b" className={ui.eyebrow}>
              Chord B
            </label>
            <select
              id="drill-b"
              className={page.select}
              value={customB}
              onChange={(event) => setCustomB(event.target.value)}
            >
              {CHORDS.map((chord) => (
                <option key={chord.id} value={chord.id}>
                  {chord.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className={page.fields}>
        <NumberField
          id="drill-start"
          label="Start BPM"
          value={startBpm}
          min={MIN_BPM}
          max={MAX_BPM}
          onChange={(value) => setStartBpm(clampBpm(value))}
        />
        <NumberField
          id="drill-target"
          label="Target BPM"
          value={safeTarget}
          min={MIN_BPM}
          max={MAX_BPM}
          onChange={(value) => setTargetBpm(clampBpm(value))}
        />
        <NumberField
          id="drill-increment"
          label="Step up by"
          value={increment}
          min={1}
          max={20}
          onChange={setIncrement}
        />
        <NumberField
          id="drill-bars"
          label="Bars per chord"
          value={barsPerChord}
          min={1}
          max={8}
          onChange={setBarsPerChord}
        />
      </div>

      {sameChord ? (
        <p className={page.hint}>Pick two different chords to practice changing between them.</p>
      ) : (
        <ChordChangeDrill
          key={drillKey}
          chordIds={chordIds}
          startBpm={startBpm}
          targetBpm={safeTarget}
          increment={increment}
          barsPerChord={barsPerChord}
          drillId={option ? option.id : [customA, customB].sort().join("-")}
        />
      )}
    </div>
  );
}

export default function Tools() {
  useEffect(() => {
    document.title = "Practice tools · Chordwise";
  }, []);

  return (
    <div className={page.page}>
      <header className={page.header}>
        <p className={ui.eyebrow}>Practice</p>
        <h1>Tools</h1>
        <p className={page.lead}>
          Three tools for daily practice: a metronome, strumming patterns and chord-change drills.
        </p>
        <ul className={ui.row}>
          <li>
            <a className={ui.chipButton} href="#metronome">
              Metronome
            </a>
          </li>
          <li>
            <a className={ui.chipButton} href="#strumming">
              Strumming
            </a>
          </li>
          <li>
            <a className={ui.chipButton} href="#drill">
              Change drill
            </a>
          </li>
        </ul>
      </header>

      <section id="metronome" className={page.section} aria-labelledby="tools-metronome">
        <div className={page.sectionHeader}>
          <h2 id="tools-metronome">Metronome</h2>
          <p>A steady click to play along with. Beat 1 of each bar is accented.</p>
        </div>
        <div className={page.panel}>
          <Metronome initialBpm={80} title="Click" />
        </div>
      </section>

      <section id="strumming" className={page.section} aria-labelledby="tools-strumming">
        <div className={page.sectionHeader}>
          <h2 id="tools-strumming">Strumming patterns</h2>
          <p>
            Arrows show down-strums and up-strums, a cross is a muted hit and a dash is a rest. The
            highlighted slot moves with the click.
          </p>
        </div>
        <StrumPractice />
      </section>

      <section id="drill" className={page.section} aria-labelledby="tools-drill">
        <div className={page.sectionHeader}>
          <h2 id="tools-drill">Chord-change drill</h2>
          <p>
            Switch chords in time with the click. After each round you decide whether it was clean;
            clean rounds raise the tempo.
          </p>
        </div>
        <DrillPractice />
      </section>
    </div>
  );
}
