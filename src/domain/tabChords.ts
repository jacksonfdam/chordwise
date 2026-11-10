/*
 * Turns the chord names stored in a tab file into a chord sheet, so an
 * imported song can be opened on the song sheet page.
 * The types below describe only the parts of a score this needs.
 */
interface ChordLike {
  name: string;
}

interface BeatLike {
  chordId: string | null;
}

interface BarLike {
  voices: { beats: BeatLike[] }[];
}

interface StaffLike {
  chords: Map<string, ChordLike> | null;
  bars: BarLike[];
}

export interface ScoreLike {
  title: string;
  artist: string;
  masterBars: { section: { text: string } | null }[];
  tracks: { staves: StaffLike[] }[];
}

const BARS_PER_LINE = 4;

/** Chord names of each bar of the first staff that has any chords. */
export function chordsPerBar(score: ScoreLike): string[][] | null {
  for (const track of score.tracks) {
    for (const staff of track.staves) {
      const chords = staff.chords;
      if (!chords || chords.size === 0) continue;
      const bars = staff.bars.map((bar) => {
        const names: string[] = [];
        for (const beat of bar.voices[0]?.beats ?? []) {
          const name = beat.chordId ? chords.get(beat.chordId)?.name.trim() : undefined;
          // Sheets repeat a chord only when it changes.
          if (name && names[names.length - 1] !== name) names.push(name);
        }
        return names;
      });
      if (bars.some((names) => names.length > 0)) return bars;
    }
  }
  return null;
}

/**
 * Builds a chord sheet: section names in [brackets] and bars between bar
 * lines. A bar that keeps the previous chord is written "%". Returns null
 * when the file has no chord names.
 */
export function buildChordSheet(score: ScoreLike): string | null {
  const bars = chordsPerBar(score);
  if (!bars) return null;

  const lines: string[] = [];
  const heading = [score.title, score.artist].filter((part) => part.trim() !== "").join(" by ");
  if (heading) lines.push(heading, "");

  let row: string[] = [];
  let anyChordYet = false;
  const flush = () => {
    if (row.length > 0) lines.push(`| ${row.join(" | ")} |`);
    row = [];
  };

  bars.forEach((names, index) => {
    const section = score.masterBars[index]?.section?.text.trim();
    if (section) {
      flush();
      if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push("");
      lines.push(`[${section}]`);
    }
    if (names.length > 0) {
      anyChordYet = true;
      row.push(names.join(" "));
    } else {
      // "%" repeats the bar before; before the first chord there is nothing to repeat.
      row.push(anyChordYet ? "%" : "N.C.");
    }
    if (row.length === BARS_PER_LINE) flush();
  });
  flush();

  return lines.join("\n");
}
