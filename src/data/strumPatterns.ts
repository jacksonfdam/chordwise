import type { StrumPattern } from "../domain/types";

export const STRUM_PATTERNS: readonly StrumPattern[] = [
  {
    id: "whole-notes",
    name: "Long strums",
    timeSignature: "4/4",
    grid: ["D", "-", "-", "-", "D", "-", "-", "-"],
    accents: [],
    description: "One slow down-strum on beat 1 and one on beat 3. Let the chord ring in between.",
    difficulty: 1,
    tips: [
      "Count '1, 2, 3, 4' out loud and strum on 1 and 3.",
      "Use the long gaps to look ahead to the next chord.",
    ],
  },
  {
    id: "quarter-notes",
    name: "Quarter notes",
    timeSignature: "4/4",
    grid: ["D", "-", "D", "-", "D", "-", "D", "-"],
    accents: [0],
    description: "A down-strum on every beat: 1, 2, 3, 4. The foundation of all strumming.",
    difficulty: 1,
    tips: [
      "Move from the wrist, as if shaking water off your hand.",
      "Make beat 1 slightly louder so you always know where the bar starts.",
    ],
  },
  {
    id: "down-up",
    name: "Down-up basic",
    timeSignature: "4/4",
    grid: ["D", "U", "D", "U", "D", "U", "D", "U"],
    accents: [0],
    description:
      "Down on the beat, up on the 'and': 1 & 2 & 3 & 4 &. Your hand swings like a pendulum.",
    difficulty: 2,
    tips: [
      "Up-strums are lighter and only need to catch the three or four thinnest strings.",
      "Keep the hand moving evenly; do not speed up on the up-strums.",
    ],
  },
  {
    id: "folk",
    name: "Folk classic",
    timeSignature: "4/4",
    grid: ["D", "-", "D", "U", "-", "U", "D", "U"],
    accents: [],
    description:
      "Down, down-up, (miss) up, down-up. The most used strumming pattern in acoustic music.",
    difficulty: 2,
    tips: [
      "On beat 3 your hand still moves down, but it misses the strings on purpose. That silent move is called a ghost strum.",
      "Say it out loud: 'down, down-up, up, down-up'.",
    ],
  },
  {
    id: "pop",
    name: "Pop",
    timeSignature: "4/4",
    grid: ["D", "-", "D", "U", "-", "U", "D", "U"],
    accents: [0],
    description:
      "The folk pattern with a strong accent on beat 1, which gives it a modern, driving feel.",
    difficulty: 2,
    tips: [
      "Hit beat 1 harder and across all the strings; keep everything else light.",
      "The accent comes from a faster wrist, not from a tense arm.",
    ],
  },
  {
    id: "muted-chuck",
    name: "Muted chuck",
    timeSignature: "4/4",
    grid: ["D", "x", "D", "U", "x", "U", "D", "U"],
    accents: [0],
    description:
      "Strums mixed with muted 'chuck' hits, where the strings are damped so you hear a click instead of a chord.",
    difficulty: 3,
    tips: [
      "For a muted hit, relax your fretting fingers so they touch the strings without pressing, then strum.",
      "You can also mute by landing the side of your picking hand on the strings as you strum.",
    ],
  },
  {
    id: "reggae",
    name: "Reggae offbeat",
    timeSignature: "4/4",
    grid: ["-", "U", "-", "U", "-", "U", "-", "U"],
    accents: [],
    description:
      "Silence on the beat and a short up-strum on every 'and'. It makes the music bounce.",
    difficulty: 3,
    tips: [
      "Your hand still moves down on the beat, but it misses the strings.",
      "Release the chord pressure right after each strum to keep the sound short.",
    ],
  },
  {
    id: "waltz",
    name: "Waltz",
    timeSignature: "3/4",
    grid: ["D", "-", "D", "U", "D", "U"],
    accents: [0],
    description: "Three beats per bar instead of four: a strong 1, then two lighter down-up beats.",
    difficulty: 2,
    tips: [
      "Count '1, 2 &, 3 &' and lean into beat 1.",
      "Think of a slow swaying dance: strong, light, light.",
    ],
  },
];

const PATTERN_BY_ID: ReadonlyMap<string, StrumPattern> = new Map(
  STRUM_PATTERNS.map((pattern) => [pattern.id, pattern]),
);

export function findStrumPattern(id: string): StrumPattern | undefined {
  return PATTERN_BY_ID.get(id);
}

/** Labels shown under each slot: "1 & 2 & 3 & 4 &". */
export function slotLabels(pattern: Pick<StrumPattern, "grid">): string[] {
  return pattern.grid.map((_, index) => (index % 2 === 0 ? String(index / 2 + 1) : "&"));
}
