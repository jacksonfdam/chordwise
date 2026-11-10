import type {
  Chord,
  ChordQuality,
  Finger,
  FretValue,
  SixStrings,
  StringIndex,
} from "../domain/types";

type Mistake = Chord["commonMistakes"][number];

/* Mistakes that show up on almost every chord, written once and reused. */
const BUZZ_FAR_FROM_FRET: Mistake = {
  problem: "A note buzzes or rattles.",
  fix: "Slide the fingertip closer to the fret wire (the metal strip), just behind it, and press a little more firmly.",
};
const FLAT_FINGERS: Mistake = {
  problem: "An open string sounds dead because a finger is leaning on it.",
  fix: "Arch your fingers like small bridges and press with the very tips so the neighbor strings ring freely.",
};
const THUMB_TOO_HIGH: Mistake = {
  problem: "Your fingers cannot reach and the hand feels cramped.",
  fix: "Lower your thumb to the middle of the back of the neck so your fingers can curl over the strings.",
};
const COLLAPSED_WRIST: Mistake = {
  problem: "Your wrist is bent sharply and starts to ache.",
  fix: "Drop your elbow and let the wrist hang relaxed and nearly straight. Shake the hand out between tries.",
};
const WRONG_STRINGS_STRUMMED: Mistake = {
  problem: "The chord sounds muddy because muted strings are ringing.",
  fix: "Start your strum on the lowest string that belongs to the chord and skip the strings marked with an X.",
};
const BARRE_BUZZ: Mistake = {
  problem: "Some strings under the barre buzz or stay silent.",
  fix: "Roll the index finger slightly onto its bony edge, move it right behind the fret wire and keep the thumb behind the neck.",
};
const BARRE_SQUEEZE: Mistake = {
  problem: "Your hand tires within seconds.",
  fix: "Use the weight of your arm pulling back instead of squeezing with the thumb. Rest often; hand fatigue is normal here.",
};

/** Barre shapes written in open position; add the barre fret to move them up the neck. */
export interface MovableShape {
  id: "e-major" | "e-minor" | "a-major" | "a-minor";
  name: string;
  quality: ChordQuality;
  rootString: StringIndex;
  /** Offsets from the barre fret; "x" stays muted. */
  offsets: SixStrings<FretValue>;
  fingers: SixStrings<Finger>;
}

export const MOVABLE_SHAPES: readonly MovableShape[] = [
  {
    id: "e-major",
    name: "E-shape major",
    quality: "major",
    rootString: 0,
    offsets: [0, 2, 2, 1, 0, 0],
    fingers: [1, 3, 4, 2, 1, 1],
  },
  {
    id: "e-minor",
    name: "E-shape minor",
    quality: "minor",
    rootString: 0,
    offsets: [0, 2, 2, 0, 0, 0],
    fingers: [1, 3, 4, 1, 1, 1],
  },
  {
    id: "a-major",
    name: "A-shape major",
    quality: "major",
    rootString: 1,
    offsets: ["x", 0, 2, 2, 2, 0],
    fingers: [0, 1, 2, 3, 4, 1],
  },
  {
    id: "a-minor",
    name: "A-shape minor",
    quality: "minor",
    rootString: 1,
    offsets: ["x", 0, 2, 2, 1, 0],
    fingers: [0, 1, 3, 4, 2, 1],
  },
];

function shapeById(id: MovableShape["id"]): MovableShape {
  const shape = MOVABLE_SHAPES.find((candidate) => candidate.id === id);
  if (!shape) throw new Error(`Unknown movable shape: ${id}`);
  return shape;
}

/** Fingering of a movable barre shape with the index finger barring `barreFret`. */
export function buildBarreShape(
  shapeId: MovableShape["id"],
  barreFret: number,
): Pick<Chord, "frets" | "fingers" | "baseFret" | "barres" | "rootString" | "quality"> {
  const shape = shapeById(shapeId);
  const frets = shape.offsets.map((offset) =>
    offset === "x" ? "x" : offset + barreFret,
  ) as SixStrings<FretValue>;
  return {
    frets,
    fingers: shape.fingers,
    baseFret: barreFret,
    barres: [{ fret: barreFret, fromString: shape.rootString, toString: 5, finger: 1 }],
    rootString: shape.rootString,
    quality: shape.quality,
  };
}

export const CHORDS: readonly Chord[] = [
  /* ---------- Beginner: open chords ---------- */
  {
    id: "Em",
    name: "Em",
    fullName: "E minor",
    quality: "minor",
    level: "beginner",
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
    baseFret: 1,
    rootString: 0,
    sound: "Dark, calm and a little sad, like a quiet evening.",
    tips: [
      "Only two fingers are needed, so this is a great first chord.",
      "Strum all six strings; every one of them belongs to the chord.",
      "Keep fingers 2 and 3 side by side, like two neighbors on the same street.",
    ],
    commonMistakes: [BUZZ_FAR_FROM_FRET, FLAT_FINGERS, COLLAPSED_WRIST],
    relatedChordIds: ["E", "Am", "G", "E7"],
  },
  {
    id: "Am",
    name: "Am",
    fullName: "A minor",
    quality: "minor",
    level: "beginner",
    frets: ["x", 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
    baseFret: 1,
    rootString: 1,
    sound: "Soft and thoughtful, a gentle kind of sadness.",
    tips: [
      "Start your strum on the A string; the low E string stays silent.",
      "Finger 1 sits alone on the B string, fret 1. Place it first.",
      "The shape is the same as E major, moved one string toward the floor.",
    ],
    commonMistakes: [
      {
        problem: "The high E string is silent.",
        fix: "Finger 1 is lying flat. Stand it up on its tip so the thinnest string can ring.",
      },
      WRONG_STRINGS_STRUMMED,
      BUZZ_FAR_FROM_FRET,
    ],
    relatedChordIds: ["A", "C", "Em", "Am7", "Dm"],
  },
  {
    id: "E",
    name: "E",
    fullName: "E major",
    quality: "major",
    level: "beginner",
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    baseFret: 1,
    rootString: 0,
    sound: "Big, bright and confident; the fullest open chord on the guitar.",
    tips: [
      "It is E minor plus finger 1 on the G string, fret 1.",
      "All six strings ring, so strum freely.",
      "Remember this shape: later it becomes the most common barre chord.",
    ],
    commonMistakes: [
      {
        problem: "The B string is muted.",
        fix: "Finger 1 is touching it. Curl finger 1 more so only its tip presses the G string.",
      },
      BUZZ_FAR_FROM_FRET,
      THUMB_TOO_HIGH,
    ],
    relatedChordIds: ["Em", "A", "E7", "Am", "F-barre"],
  },
  {
    id: "A",
    name: "A",
    fullName: "A major",
    quality: "major",
    level: "beginner",
    frets: ["x", 0, 2, 2, 2, 0],
    fingers: [0, 0, 1, 2, 3, 0],
    baseFret: 1,
    rootString: 1,
    sound: "Sunny and open, like the start of a road trip.",
    tips: [
      "Three fingers line up in a row on fret 2. Angle them slightly so they all fit.",
      "Start your strum on the A string.",
      "If the fingers feel crowded, let finger 1 sit a little further back in the fret.",
    ],
    commonMistakes: [
      {
        problem: "The high E string is silent.",
        fix: "Finger 3 is leaning on it. Arch finger 3 and press with its tip.",
      },
      {
        problem: "Three fingers do not fit in one fret.",
        fix: "Turn your hand slightly so the fingers form a diagonal line instead of a straight stack.",
      },
      WRONG_STRINGS_STRUMMED,
    ],
    relatedChordIds: ["Am", "D", "E", "A7", "Asus2"],
  },
  {
    id: "D",
    name: "D",
    fullName: "D major",
    quality: "major",
    level: "beginner",
    frets: ["x", "x", 0, 2, 3, 2],
    fingers: [0, 0, 0, 1, 3, 2],
    baseFret: 1,
    rootString: 2,
    sound: "Bright, sweet and hopeful; a small chord with a clear voice.",
    tips: [
      "The fingers make a small triangle on the three thinnest strings.",
      "Strum only four strings, starting from the open D string.",
      "Place finger 3 last; it is the point of the triangle.",
    ],
    commonMistakes: [
      {
        problem: "The high E string is muted.",
        fix: "Finger 3 is touching it from above. Stand finger 3 up straight on its tip.",
      },
      WRONG_STRINGS_STRUMMED,
      BUZZ_FAR_FROM_FRET,
    ],
    relatedChordIds: ["Dm", "A", "G", "D7", "Dsus2", "Dsus4"],
  },
  {
    id: "C",
    name: "C",
    fullName: "C major",
    quality: "major",
    level: "beginner",
    frets: ["x", 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
    baseFret: 1,
    rootString: 1,
    sound: "Warm, plain and happy; the sound of 'home' in countless songs.",
    tips: [
      "The fingers form a staircase: fret 1, fret 2, fret 3.",
      "Finger 3 has the longest stretch. Let your elbow move in toward your body to help it.",
      "Start your strum on the A string.",
    ],
    commonMistakes: [
      {
        problem: "The open G string is dead.",
        fix: "Finger 2 is leaning on it. Arch finger 2 so there is daylight under its knuckle.",
      },
      {
        problem: "The high E string is silent.",
        fix: "The base of finger 1 is touching it. Pull your palm slightly away from the neck.",
      },
      THUMB_TOO_HIGH,
    ],
    relatedChordIds: ["Am", "G", "F-simple", "Cmaj7", "D"],
  },
  {
    id: "G",
    name: "G",
    fullName: "G major",
    quality: "major",
    level: "beginner",
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    baseFret: 1,
    rootString: 0,
    sound: "Wide, full and friendly; it rings across all six strings.",
    tips: [
      "Your hand spans the whole neck: two fingers on the thick strings, one on the thinnest.",
      "Strum all six strings.",
      "This three-finger version makes the change to C easier, because fingers 1 and 2 keep their order.",
    ],
    commonMistakes: [
      {
        problem: "The open D string is dead.",
        fix: "Finger 1 is lying across it. Curl finger 1 so only the tip touches the A string.",
      },
      {
        problem: "The stretch to the high E string feels too far.",
        fix: "Bring your elbow closer to your side and let the thumb sit lower behind the neck.",
      },
      BUZZ_FAR_FROM_FRET,
    ],
    relatedChordIds: ["G-alt", "C", "D", "Em"],
  },
  {
    id: "G-alt",
    name: "G (4 fingers)",
    fullName: "G major, four-finger version",
    quality: "major",
    level: "beginner",
    frets: [3, 2, 0, 0, 3, 3],
    fingers: [2, 1, 0, 0, 3, 4],
    baseFret: 1,
    rootString: 0,
    sound: "The same friendly G with a stronger, more modern ring on top.",
    tips: [
      "Fingers 3 and 4 sit side by side on fret 3 of the two thinnest strings.",
      "Fingers 3 and 4 can stay in place when you change to Dsus4 or a D-family chord.",
      "Choose the G version that makes your next chord change easiest.",
    ],
    commonMistakes: [
      {
        problem: "The pinky (finger 4) collapses and buzzes.",
        fix: "Keep the pinky curved and press with its tip. It is the weakest finger, so give it time.",
      },
      FLAT_FINGERS,
    ],
    relatedChordIds: ["G", "C", "D", "Dsus4"],
  },
  {
    id: "Dm",
    name: "Dm",
    fullName: "D minor",
    quality: "minor",
    level: "beginner",
    frets: ["x", "x", 0, 2, 3, 1],
    fingers: [0, 0, 0, 2, 3, 1],
    baseFret: 1,
    rootString: 2,
    sound: "Sad and serious, the most melancholy of the open chords.",
    tips: [
      "Compared with D major, only the note on the high E string moves, from fret 2 to fret 1.",
      "Strum four strings, starting from the open D string.",
      "Place finger 1 first, then let fingers 2 and 3 fall into place.",
    ],
    commonMistakes: [
      {
        problem: "The high E string buzzes.",
        fix: "Press finger 1 closer to the first fret wire and keep it on its tip.",
      },
      WRONG_STRINGS_STRUMMED,
      FLAT_FINGERS,
    ],
    relatedChordIds: ["D", "Am", "Dm7", "F-simple"],
  },
  {
    id: "F-simple",
    name: "F (easy)",
    fullName: "F major, simplified",
    quality: "major",
    level: "beginner",
    frets: ["x", "x", 3, 2, 1, 1],
    fingers: [0, 0, 3, 2, 1, 1],
    baseFret: 1,
    barres: [{ fret: 1, fromString: 4, toString: 5, finger: 1 }],
    rootString: 2,
    sound: "Bright and a little tense, as if it wants to move on to C.",
    tips: [
      "Finger 1 lies flat across the two thinnest strings at fret 1. This small barre is called a mini-barre.",
      "Strum four strings, starting from the D string.",
      "It is the shape of C with finger 1 flattened, so C to F is a small move.",
    ],
    commonMistakes: [
      {
        problem: "One of the two strings under finger 1 is silent.",
        fix: "Flatten the last joint of finger 1 and roll it slightly toward the nut until both strings ring.",
      },
      BARRE_SQUEEZE,
      WRONG_STRINGS_STRUMMED,
    ],
    relatedChordIds: ["C", "F-barre", "Dm", "Am"],
  },

  /* ---------- Intermediate: sevenths ---------- */
  {
    id: "A7",
    name: "A7",
    fullName: "A dominant seventh",
    quality: "dominant7",
    level: "intermediate",
    frets: ["x", 0, 2, 0, 2, 0],
    fingers: [0, 0, 2, 0, 3, 0],
    baseFret: 1,
    rootString: 1,
    sound: "Bluesy and restless; it sounds like it needs to resolve to D.",
    tips: [
      "It is A major with the middle note lifted, leaving the G string open.",
      "The open G string is the 'seventh' that gives the chord its blues color.",
      "Start your strum on the A string.",
    ],
    commonMistakes: [
      {
        problem: "The open G string is muted, so it sounds like plain A.",
        fix: "Arch both fingers so the G string between them rings clearly.",
      },
      WRONG_STRINGS_STRUMMED,
    ],
    relatedChordIds: ["A", "D", "D7", "E7"],
  },
  {
    id: "D7",
    name: "D7",
    fullName: "D dominant seventh",
    quality: "dominant7",
    level: "intermediate",
    frets: ["x", "x", 0, 2, 1, 2],
    fingers: [0, 0, 0, 2, 1, 3],
    baseFret: 1,
    rootString: 2,
    sound: "Twangy and expectant; it leans hard toward G.",
    tips: [
      "The triangle of D major is flipped upside down.",
      "Place finger 1 on the B string first; it is the point of the triangle.",
      "Strum four strings, starting from the open D string.",
    ],
    commonMistakes: [
      {
        problem: "The high E string is muted.",
        fix: "Finger 3 is flat or finger 1 is leaning back. Stand both up on their tips.",
      },
      WRONG_STRINGS_STRUMMED,
      BUZZ_FAR_FROM_FRET,
    ],
    relatedChordIds: ["D", "G", "A7", "Dm7"],
  },
  {
    id: "E7",
    name: "E7",
    fullName: "E dominant seventh",
    quality: "dominant7",
    level: "intermediate",
    frets: [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
    baseFret: 1,
    rootString: 0,
    sound: "Gritty and bluesy, an E chord with unfinished business.",
    tips: [
      "It is E major with finger 3 lifted, leaving the D string open.",
      "Only two fingers, all six strings.",
      "It pulls strongly toward A or Am.",
    ],
    commonMistakes: [
      {
        problem: "The open D string is dead, so the seventh is missing.",
        fix: "Finger 2 is leaning on it. Arch finger 2 and press with its tip.",
      },
      BUZZ_FAR_FROM_FRET,
    ],
    relatedChordIds: ["E", "A", "A7", "Em"],
  },
  {
    id: "Am7",
    name: "Am7",
    fullName: "A minor seventh",
    quality: "minor7",
    level: "intermediate",
    frets: ["x", 0, 2, 0, 1, 0],
    fingers: [0, 0, 2, 0, 1, 0],
    baseFret: 1,
    rootString: 1,
    sound: "Mellow and relaxed, like A minor after a deep breath.",
    tips: [
      "It is A minor with finger 3 lifted, leaving the G string open.",
      "The shape is identical to the top of C major, so Am7 to C needs just one extra finger.",
      "Start your strum on the A string.",
    ],
    commonMistakes: [
      {
        problem: "The open G string is muted.",
        fix: "Arch finger 2 so the G string below it is untouched.",
      },
      WRONG_STRINGS_STRUMMED,
    ],
    relatedChordIds: ["Am", "C", "Cmaj7", "Dm7"],
  },
  {
    id: "Dm7",
    name: "Dm7",
    fullName: "D minor seventh",
    quality: "minor7",
    level: "intermediate",
    frets: ["x", "x", 0, 2, 1, 1],
    fingers: [0, 0, 0, 2, 1, 1],
    baseFret: 1,
    barres: [{ fret: 1, fromString: 4, toString: 5, finger: 1 }],
    rootString: 2,
    sound: "Smooth and jazzy, a softer shade of D minor.",
    tips: [
      "Finger 1 lies flat across the two thinnest strings at fret 1, the same mini-barre as easy F.",
      "Finger 2 reaches over to the G string, fret 2.",
      "Strum four strings, starting from the open D string.",
    ],
    commonMistakes: [
      {
        problem: "The B string or high E string is silent under the mini-barre.",
        fix: "Flatten the last joint of finger 1 and press close to the fret wire.",
      },
      WRONG_STRINGS_STRUMMED,
    ],
    relatedChordIds: ["Dm", "F-simple", "Am7", "G"],
  },
  {
    id: "Cmaj7",
    name: "Cmaj7",
    fullName: "C major seventh",
    quality: "major7",
    level: "intermediate",
    frets: ["x", 3, 2, 0, 0, 0],
    fingers: [0, 3, 2, 0, 0, 0],
    baseFret: 1,
    rootString: 1,
    sound: "Dreamy and airy, like sunlight through a window.",
    tips: [
      "It is C major with finger 1 lifted, leaving the B string open.",
      "Fingers 2 and 3 do not move when you switch between C and Cmaj7.",
      "Start your strum on the A string.",
    ],
    commonMistakes: [
      {
        problem: "The open G string is dead.",
        fix: "Finger 2 is leaning on it. Arch finger 2 more.",
      },
      WRONG_STRINGS_STRUMMED,
    ],
    relatedChordIds: ["C", "Am7", "Em", "Dm7"],
  },

  /* ---------- Intermediate: suspended ---------- */
  {
    id: "Dsus2",
    name: "Dsus2",
    fullName: "D suspended second",
    quality: "sus2",
    level: "intermediate",
    frets: ["x", "x", 0, 2, 3, 0],
    fingers: [0, 0, 0, 1, 2, 0],
    baseFret: 1,
    rootString: 2,
    sound: "Open and floating, neither happy nor sad.",
    tips: [
      "It is D major with the high E string left open.",
      "From D major, simply lift the finger on the high E string and put it back to 'resolve'.",
      "Strum four strings, starting from the open D string.",
    ],
    commonMistakes: [
      {
        problem: "The open high E string is muted.",
        fix: "The finger on the B string is leaning on it. Stand that finger up on its tip.",
      },
      WRONG_STRINGS_STRUMMED,
    ],
    relatedChordIds: ["D", "Dsus4", "Asus2"],
  },
  {
    id: "Dsus4",
    name: "Dsus4",
    fullName: "D suspended fourth",
    quality: "sus4",
    level: "intermediate",
    frets: ["x", "x", 0, 2, 3, 3],
    fingers: [0, 0, 0, 1, 2, 3],
    baseFret: 1,
    rootString: 2,
    sound: "Tense and shimmering; it begs to fall back to D major.",
    tips: [
      "It is D major with one extra note on the high E string, fret 3.",
      "When you play D major, you can add your pinky on fret 3 instead and keep the D shape underneath.",
      "Strum four strings, starting from the open D string.",
    ],
    commonMistakes: [
      {
        problem: "The note on the high E string buzzes.",
        fix: "Press with the fingertip right behind the third fret wire and keep the finger curved.",
      },
      WRONG_STRINGS_STRUMMED,
    ],
    relatedChordIds: ["D", "Dsus2", "G-alt"],
  },
  {
    id: "Asus2",
    name: "Asus2",
    fullName: "A suspended second",
    quality: "sus2",
    level: "intermediate",
    frets: ["x", 0, 2, 2, 0, 0],
    fingers: [0, 0, 1, 2, 0, 0],
    baseFret: 1,
    rootString: 1,
    sound: "Spacious and unresolved, like a question left hanging.",
    tips: [
      "It is A major with the B string left open.",
      "Add a finger on the B string, fret 2, to resolve it to A major.",
      "Start your strum on the A string.",
    ],
    commonMistakes: [
      {
        problem: "The open B string is muted.",
        fix: "Finger 2 is leaning on it. Arch finger 2 so the B string rings.",
      },
      WRONG_STRINGS_STRUMMED,
    ],
    relatedChordIds: ["A", "Dsus2", "Am"],
  },

  /* ---------- Intermediate: barre chords ---------- */
  {
    id: "F-barre",
    name: "F",
    fullName: "F major, full barre",
    level: "intermediate",
    ...buildBarreShape("e-major", 1),
    sound: "Strong and complete; the first full barre chord most players learn.",
    tips: [
      "Finger 1 presses all six strings at fret 1. Pressing several strings with one finger is called a barre.",
      "The other three fingers make an E major shape one fret higher.",
      "Keep the thumb behind the neck, roughly opposite finger 2.",
    ],
    commonMistakes: [BARRE_BUZZ, BARRE_SQUEEZE, COLLAPSED_WRIST],
    relatedChordIds: ["F-simple", "E", "G-barre", "F-sharp-m", "C"],
  },
  {
    id: "Bm",
    name: "Bm",
    fullName: "B minor",
    level: "intermediate",
    ...buildBarreShape("a-minor", 2),
    sound: "Moody and dramatic, a darker cousin of D major.",
    tips: [
      "Finger 1 barres five strings at fret 2. The low E string is not played.",
      "The other fingers make an A minor shape two frets higher.",
      "Let the tip of finger 1 lightly touch the low E string to keep it quiet.",
    ],
    commonMistakes: [BARRE_BUZZ, WRONG_STRINGS_STRUMMED, BARRE_SQUEEZE],
    relatedChordIds: ["Am", "D", "G", "Cm", "F-sharp-m"],
  },
  {
    id: "G-barre",
    name: "G (barre)",
    fullName: "G major, E-shape barre",
    level: "intermediate",
    ...buildBarreShape("e-major", 3),
    sound: "A tight, punchy G that you can move anywhere on the neck.",
    tips: [
      "It is the F barre chord moved up two frets, to fret 3.",
      "The name comes from the note under finger 1 on the low E string: fret 3 is G.",
      "Frets are closer together up here, so the stretch is a little easier than F.",
    ],
    commonMistakes: [BARRE_BUZZ, BARRE_SQUEEZE],
    relatedChordIds: ["F-barre", "G", "F-sharp-m"],
  },
  {
    id: "F-sharp-m",
    name: "F#m",
    fullName: "F sharp minor",
    level: "intermediate",
    ...buildBarreShape("e-minor", 2),
    sound: "Serious and bittersweet, common in songs in the keys of A and D.",
    tips: [
      "It is an E minor shape with a barre at fret 2.",
      "Finger 1 has more work than in a major barre, because it also plays the G string.",
      "The root note is on the low E string, fret 2: F sharp.",
    ],
    commonMistakes: [
      {
        problem: "The G string is silent, so the chord loses its minor sound.",
        fix: "Roll finger 1 onto its edge and check that the crease of a finger joint is not sitting on the G string.",
      },
      BARRE_BUZZ,
      BARRE_SQUEEZE,
    ],
    relatedChordIds: ["F-barre", "Em", "Bm", "A"],
  },
  {
    id: "Bb",
    name: "Bb",
    fullName: "B flat major",
    level: "intermediate",
    ...buildBarreShape("a-major", 1),
    sound: "Round and warm, a favorite partner of F major.",
    tips: [
      "It is an A major shape with a barre at fret 1. The low E string is not played.",
      "The root note is on the A string, fret 1: B flat.",
      "If three fingers feel crowded on fret 3, angle them diagonally as you did for A major.",
    ],
    commonMistakes: [
      {
        problem: "The high E string is silent.",
        fix: "Finger 4 is leaning on it, or the barre is too light at its tip end. Arch finger 4 and press the barre evenly.",
      },
      BARRE_BUZZ,
      WRONG_STRINGS_STRUMMED,
    ],
    relatedChordIds: ["A", "F-barre", "Bm", "Cm"],
  },
  {
    id: "B",
    name: "B",
    fullName: "B major",
    level: "intermediate",
    ...buildBarreShape("a-major", 2),
    sound: "Bright and urgent, the chord that leads back home to E.",
    tips: [
      "It is an A major shape with a barre at fret 2. The low E string is not played.",
      "The root note is on the A string, fret 2: B.",
      "Many players flatten finger 3 across the D, G and B strings instead of using three fingers. Try both.",
    ],
    commonMistakes: [
      {
        problem: "The high E string is silent.",
        fix: "That is common at first and still sounds fine. To fix it, arch finger 4 and press the barre evenly to its tip.",
      },
      BARRE_BUZZ,
      WRONG_STRINGS_STRUMMED,
    ],
    relatedChordIds: ["Bb", "Bm", "E", "A"],
  },
  {
    id: "Cm",
    name: "Cm",
    fullName: "C minor",
    level: "intermediate",
    ...buildBarreShape("a-minor", 3),
    sound: "Heavy and solemn, full of drama.",
    tips: [
      "It is the Bm shape moved up one fret, to fret 3.",
      "The root note is on the A string, fret 3: C.",
      "Mute the low E string with the tip of finger 1.",
    ],
    commonMistakes: [BARRE_BUZZ, WRONG_STRINGS_STRUMMED],
    relatedChordIds: ["Bm", "Am", "C", "Bb"],
  },

  /* ---------- Intermediate: power chords ---------- */
  {
    id: "E5",
    name: "E5",
    fullName: "E power chord",
    quality: "power",
    level: "intermediate",
    frets: [0, 2, 2, "x", "x", "x"],
    fingers: [0, 1, 2, 0, 0, 0],
    baseFret: 1,
    rootString: 0,
    sound: "Raw and heavy; neither major nor minor, just power.",
    tips: [
      "A power chord has only two different notes: the root and the fifth, plus the root again one octave higher.",
      "Play only the three thickest strings.",
      "Rest the side of your picking hand lightly on the strings near the bridge for a tight, chunky sound. This is called palm muting.",
    ],
    commonMistakes: [
      {
        problem: "Thin strings ring and blur the sound.",
        fix: "Let your fretting fingers lie lightly across the three thin strings to keep them silent, and aim the pick at the thick strings.",
      },
      BUZZ_FAR_FROM_FRET,
    ],
    relatedChordIds: ["A5", "G5", "F5", "E", "Em"],
  },
  {
    id: "A5",
    name: "A5",
    fullName: "A power chord",
    quality: "power",
    level: "intermediate",
    frets: ["x", 0, 2, 2, "x", "x"],
    fingers: [0, 0, 1, 2, 0, 0],
    baseFret: 1,
    rootString: 1,
    sound: "Punchy and direct, the backbone of countless rock riffs.",
    tips: [
      "Play three strings only: A, D and G.",
      "The open A string is the root note, the note the chord is named after.",
      "Keep the strum small and tight.",
    ],
    commonMistakes: [
      {
        problem: "The low E string booms underneath.",
        fix: "Touch the low E string lightly with the tip of your thumb or finger 1 to mute it, and start the strum on the A string.",
      },
      BUZZ_FAR_FROM_FRET,
    ],
    relatedChordIds: ["E5", "D5", "A", "Am"],
  },
  {
    id: "D5",
    name: "D5",
    fullName: "D power chord",
    quality: "power",
    level: "intermediate",
    frets: ["x", 5, 7, 7, "x", "x"],
    fingers: [0, 1, 3, 4, 0, 0],
    baseFret: 5,
    rootString: 1,
    sound: "Tight and driving, higher up the neck.",
    tips: [
      "Finger 1 plays the root note on the A string, fret 5. Fingers 3 and 4 sit two frets higher on the next two strings.",
      "This is the movable shape with its root on the A string: slide it anywhere.",
      "Let finger 1 lightly touch the strings below it to keep them quiet.",
    ],
    commonMistakes: [
      {
        problem: "The shape falls apart when you slide it.",
        fix: "Keep the fingers lightly on the strings while you move, as one frozen shape, and press again when you arrive.",
      },
      BUZZ_FAR_FROM_FRET,
    ],
    relatedChordIds: ["A5", "G5", "D"],
  },
  {
    id: "G5",
    name: "G5",
    fullName: "G power chord",
    quality: "power",
    level: "intermediate",
    frets: [3, 5, 5, "x", "x", "x"],
    fingers: [1, 3, 4, 0, 0, 0],
    baseFret: 3,
    rootString: 0,
    sound: "Thick and solid, a classic rock sound.",
    tips: [
      "Finger 1 plays the root note on the low E string, fret 3.",
      "This is the movable shape with its root on the low E string.",
      "Fingers 3 and 4 can be replaced by finger 3 lying flat across both strings.",
    ],
    commonMistakes: [
      {
        problem: "The pinky note is weak or buzzing.",
        fix: "Keep the pinky curved and close to the fret wire. Practice the shape slowly without strumming first.",
      },
      THUMB_TOO_HIGH,
    ],
    relatedChordIds: ["F5", "E5", "D5", "G"],
  },
  {
    id: "F5",
    name: "F5",
    fullName: "F power chord",
    quality: "power",
    level: "intermediate",
    frets: [1, 3, 3, "x", "x", "x"],
    fingers: [1, 3, 4, 0, 0, 0],
    baseFret: 1,
    rootString: 0,
    sound: "Dark and forceful, the lowest movable power chord.",
    tips: [
      "It is the G5 shape moved down to fret 1.",
      "Fret 1 needs the most pressure on the whole neck, so press close to the fret wire.",
      "It is a good first step toward the full F barre chord.",
    ],
    commonMistakes: [
      {
        problem: "The root note on the low E string buzzes.",
        fix: "Move finger 1 right up behind the first fret wire and drop your wrist slightly.",
      },
      COLLAPSED_WRIST,
    ],
    relatedChordIds: ["G5", "E5", "F-barre", "F-simple"],
  },
];

const CHORD_BY_ID: ReadonlyMap<string, Chord> = new Map(CHORDS.map((chord) => [chord.id, chord]));

export function findChord(id: string): Chord | undefined {
  return CHORD_BY_ID.get(id);
}

/** Looks up a chord that is known to exist; throws on a bad id so data errors surface early. */
export function getChord(id: string): Chord {
  const chord = CHORD_BY_ID.get(id);
  if (!chord) throw new Error(`Unknown chord id: ${id}`);
  return chord;
}

export type ChordFilter = "major" | "minor" | "seventh" | "sus" | "barre" | "power";

export const CHORD_FILTERS: readonly { id: ChordFilter; label: string }[] = [
  { id: "major", label: "Major" },
  { id: "minor", label: "Minor" },
  { id: "seventh", label: "7th" },
  { id: "sus", label: "Sus" },
  { id: "barre", label: "Barre" },
  { id: "power", label: "Power" },
];

/** A full barre covers at least five strings; mini-barres do not count. */
export function isBarreChord(chord: Chord): boolean {
  return (chord.barres ?? []).some((barre) => barre.toString - barre.fromString >= 4);
}

export function matchesFilter(chord: Chord, filter: ChordFilter): boolean {
  switch (filter) {
    case "major":
      return chord.quality === "major";
    case "minor":
      return chord.quality === "minor";
    case "seventh":
      return (
        chord.quality === "dominant7" || chord.quality === "minor7" || chord.quality === "major7"
      );
    case "sus":
      return chord.quality === "sus2" || chord.quality === "sus4";
    case "barre":
      return isBarreChord(chord);
    case "power":
      return chord.quality === "power";
  }
}
