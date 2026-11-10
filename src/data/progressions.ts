import type { DrillPreset, Progression } from "../domain/types";

export const PROGRESSIONS: readonly Progression[] = [
  {
    id: "g-c-d",
    name: "G - C - D",
    formula: "I - IV - V",
    key: "G",
    chordIds: ["G", "C", "D", "G"],
    description: "The three-chord loop behind thousands of folk, country and rock songs.",
    level: "beginner",
    suggestedPatternId: "quarter-notes",
    bpm: 60,
  },
  {
    id: "am-f-c-g",
    name: "Am - F - C - G",
    formula: "vi - IV - I - V",
    key: "C",
    chordIds: ["Am", "F-simple", "C", "G"],
    description: "A bittersweet four-chord loop used in countless pop songs.",
    level: "beginner",
    suggestedPatternId: "quarter-notes",
    bpm: 60,
  },
  {
    id: "i-iv-v-c",
    name: "C - F - G",
    formula: "I - IV - V",
    key: "C",
    chordIds: ["C", "F-simple", "G", "C"],
    description: "The three main chords in the key of C.",
    level: "intermediate",
    suggestedPatternId: "pop",
    bpm: 80,
  },
  {
    id: "i-iv-v-d",
    name: "D - G - A",
    formula: "I - IV - V",
    key: "D",
    chordIds: ["D", "G", "A", "D"],
    description: "The three main chords in the key of D.",
    level: "intermediate",
    suggestedPatternId: "pop",
    bpm: 80,
  },
  {
    id: "i-iv-v-a",
    name: "A - D - E",
    formula: "I - IV - V",
    key: "A",
    chordIds: ["A", "D", "E", "A"],
    description: "The three main chords in the key of A.",
    level: "intermediate",
    suggestedPatternId: "pop",
    bpm: 80,
  },
  {
    id: "i-iv-v-e",
    name: "E - A - B",
    formula: "I - IV - V",
    key: "E",
    chordIds: ["E", "A", "B", "E"],
    description: "The three main chords in the key of E, with B as a barre chord.",
    level: "intermediate",
    suggestedPatternId: "pop",
    bpm: 72,
  },
  {
    id: "i-v-vi-iv-c",
    name: "C - G - Am - F",
    formula: "I - V - vi - IV",
    key: "C",
    chordIds: ["C", "G", "Am", "F-simple"],
    description: "The famous 'four chords' progression in the key of C.",
    level: "intermediate",
    suggestedPatternId: "pop",
    bpm: 84,
  },
  {
    id: "i-v-vi-iv-g",
    name: "G - D - Em - C",
    formula: "I - V - vi - IV",
    key: "G",
    chordIds: ["G", "D", "Em", "C"],
    description: "The same four-chord formula in the key of G, all open chords.",
    level: "intermediate",
    suggestedPatternId: "pop",
    bpm: 84,
  },
  {
    id: "i-v-vi-iv-d",
    name: "D - A - Bm - G",
    formula: "I - V - vi - IV",
    key: "D",
    chordIds: ["D", "A", "Bm", "G"],
    description: "The four-chord formula in the key of D, with Bm as a barre chord.",
    level: "intermediate",
    suggestedPatternId: "pop",
    bpm: 76,
  },
  {
    id: "blues-in-a",
    name: "12-bar blues in A",
    formula: "I7 - IV7 - V7",
    key: "A",
    chordIds: ["A7", "A7", "A7", "A7", "D7", "D7", "A7", "A7", "E7", "D7", "A7", "E7"],
    description: "Twelve bars that repeat forever: the form behind blues and early rock and roll.",
    level: "intermediate",
    suggestedPatternId: "reggae",
    bpm: 80,
  },
];

export function findProgression(id: string): Progression | undefined {
  return PROGRESSIONS.find((progression) => progression.id === id);
}

/** Chord pairs (and one trio) for the chord-change drill, each with a tip for the move. */
export const DRILL_PRESETS: readonly DrillPreset[] = [
  {
    id: "em-am",
    chordIds: ["Em", "Am"],
    tip: "Fingers 2 and 3 keep their shape and slide over one string toward the floor. Then add finger 1.",
  },
  {
    id: "g-c",
    chordIds: ["G", "C"],
    tip: "The diagonal pair of notes on frets 3 and 2 moves as one shape, one string toward the floor. Think of it as one shape, not separate fingers, then add finger 1 on the B string.",
  },
  {
    id: "c-d",
    chordIds: ["C", "D"],
    tip: "Nothing stays in place here. Lift all fingers together and land them together; do not place them one at a time.",
  },
  {
    id: "d-a",
    chordIds: ["D", "A"],
    tip: "Finger 3 stays on the B string and slides back one fret. Fingers 1 and 2 stay close in a cluster and line up beside it on fret 2.",
  },
  {
    id: "a-e",
    chordIds: ["A", "E"],
    tip: "Fingers 2 and 3 stay side by side on fret 2 and jump two strings toward the ceiling as a pair. Finger 1 then lands on the G string, fret 1.",
  },
  {
    id: "g-d",
    chordIds: ["G", "D"],
    tip: "Finger 3 is the guide: it stays on fret 3 and only moves from the high E string to the B string.",
  },
  {
    id: "am-dm",
    chordIds: ["Am", "Dm"],
    tip: "Finger 2 stays on fret 2 and moves one string toward the floor. Finger 1 does the same on fret 1.",
  },
  {
    id: "e-a7",
    chordIds: ["E", "A7"],
    tip: "Finger 2 keeps fret 2 and moves one string toward the floor. Finger 3 crosses to the B string.",
  },
  {
    id: "c-cmaj7",
    chordIds: ["C", "Cmaj7"],
    tip: "Fingers 2 and 3 are anchor fingers: they never move. Only finger 1 lifts off and comes back.",
  },
  {
    id: "c-am",
    chordIds: ["C", "Am"],
    tip: "Fingers 1 and 2 are anchor fingers: they stay put. Only finger 3 moves, from the A string to the G string.",
  },
  {
    id: "dsus2-d-dsus4",
    chordIds: ["Dsus2", "D", "Dsus4"],
    tip: "The notes on the G and B strings never change. Only the high E string changes: open, fret 2, fret 3.",
  },
  {
    id: "f-c",
    chordIds: ["F-simple", "C"],
    tip: "Finger 1 stays on the B string, fret 1; it only lies flat or stands up. Fingers 2 and 3 keep their diagonal shape and each move one string.",
  },
  {
    id: "bm-g",
    chordIds: ["Bm", "G"],
    tip: "Release the barre completely, then land G as one shape. Practice the release as its own slow move first.",
  },
];

export function findDrillPreset(id: string): DrillPreset | undefined {
  return DRILL_PRESETS.find((preset) => preset.id === id);
}

/** Looks up the tip for a set of chords, regardless of their order. */
export function drillTipFor(chordIds: readonly string[]): string | undefined {
  const wanted = [...chordIds].sort().join("|");
  return DRILL_PRESETS.find((preset) => [...preset.chordIds].sort().join("|") === wanted)?.tip;
}
