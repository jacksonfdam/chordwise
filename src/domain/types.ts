/** 0 = low E (6th string), 5 = high E (1st string). */
export type StringIndex = 0 | 1 | 2 | 3 | 4 | 5;

/** 0 = open, "x" = muted. Fret numbers are absolute (counted from the nut). */
export type FretValue = number | "x";

/** 0 = none/open, 1 = index ... 4 = pinky, "T" = thumb. */
export type Finger = 0 | 1 | 2 | 3 | 4 | "T";

export type Level = "beginner" | "intermediate";

export interface Barre {
  fret: number;
  fromString: StringIndex;
  toString: StringIndex;
  finger: 1 | 2 | 3 | 4;
}

export type ChordQuality =
  "major" | "minor" | "dominant7" | "minor7" | "major7" | "sus2" | "sus4" | "power";

export type SixStrings<T> = [T, T, T, T, T, T];

export interface Chord {
  /** URL-safe id: "Em", "Cmaj7", "F-barre". */
  id: string;
  /** Display name. */
  name: string;
  /** Spelled-out name: "E minor". */
  fullName: string;
  quality: ChordQuality;
  level: Level;
  frets: SixStrings<FretValue>;
  fingers: SixStrings<Finger>;
  /** First fret shown in the diagram: 1 for open chords, higher for movable shapes. */
  baseFret: number;
  barres?: Barre[];
  rootString?: StringIndex;
  /** One-sentence plain-English description of the mood. */
  sound: string;
  tips: string[];
  commonMistakes: { problem: string; fix: string }[];
  relatedChordIds: string[];
}

export type StepAction = "read" | "place" | "strum" | "hold" | "drill" | "metronome" | "quiz";

/** Extra illustration shown on the stage for a step. */
export type StepVisual =
  | "guitar-parts"
  | "string-names"
  | "diagram-anatomy"
  | "tuner"
  | "root-notes"
  | "mistakes"
  | "summary";

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Index into `options`. */
  answerIndex: number;
  explanation: string;
}

export interface HoldCycle {
  holdSec: number;
  restSec: number;
  reps: number;
}

export interface Step {
  id: string;
  title: string;
  /** Plain English, max ~60 words. */
  body: string;
  /** Suggested time in seconds; drives the countdown. */
  durationSec: number;
  chordId?: string;
  /** Fingers to emphasize in the diagram for this step. */
  highlightFingers?: Finger[];
  highlightStrings?: StringIndex[];
  action: StepAction;
  strumPatternId?: string;
  bpm?: number;
  /** Play a strum when the step starts. */
  autoplayChord?: boolean;
  /** "Can you see...?" self-checks. */
  checklist?: string[];
  visual?: StepVisual;
  quiz?: QuizQuestion;
  /** Chords cycled through in a drill or progression step (two or more). */
  drillChordIds?: string[];
  /** Bars spent on each chord in a drill step. Defaults to 2. */
  barsPerChord?: number;
  /** Hold-and-release timing for "hold" steps. */
  holdCycle?: HoldCycle;
  /** A second chord played right after the first, to compare their sound. */
  compareChordId?: string;
}

export interface Lesson {
  /** "beginner-04-em-am" */
  id: string;
  order: number;
  level: Level;
  title: string;
  summary: string;
  estimatedMinutes: number;
  /** Lesson ids. */
  prerequisites: string[];
  chordIds: string[];
  steps: Step[];
  /** "By the end you can..." */
  goals: string[];
}

/** Down, up, muted, rest. */
export type StrumStroke = "D" | "U" | "x" | "-";

export type TimeSignature = "4/4" | "3/4" | "6/8";

export interface StrumPattern {
  id: string;
  name: string;
  timeSignature: TimeSignature;
  /** One slot per eighth note: 8 slots in 4/4, 6 in 3/4 and 6/8. */
  grid: StrumStroke[];
  /** Slot indexes that are accented. */
  accents: number[];
  description: string;
  difficulty: 1 | 2 | 3;
  tips: string[];
}

export interface Progression {
  id: string;
  name: string;
  /** Roman-numeral formula, e.g. "I - IV - V". */
  formula: string;
  key: string;
  /** One chord id per bar. */
  chordIds: string[];
  description: string;
  level: Level;
  suggestedPatternId: string;
  bpm: number;
}

export interface DrillPreset {
  id: string;
  chordIds: string[];
  tip: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  seeAlso?: string[];
}
