# Chordwise

A guided guitar chord trainer for absolute beginners. Chordwise teaches you to read and play
chords from the very first lesson up to barre chords, one small step at a time: each step has
plain-English instructions, a chord diagram, a suggested time and, where it helps, sound.

**Live:** <https://guitarchordwise.vercel.app>

It is a single-page app that runs entirely in the browser. There is no account, no backend and
no tracking; your progress is stored on your own device.

## Features

- **21 guided lessons** in two levels (Beginner and Intermediate), each made of 5 to 12 short
  steps with a countdown, auto-advance and a "get ready" pause before hands-on steps.
- **Chord diagrams** drawn in SVG with finger numbers, open and muted markers, barres,
  per-step finger highlights, a left-handed mode and full text alternatives.
- **Chord library** with search, filters, fingering in words, tips, common mistakes and fixes.
- **Synthesized sound**: every chord can be strummed, using a plucked-string model built on the
  Web Audio API. No audio files are downloaded.
- **Metronome** (40 to 200 BPM, 4/4, 3/4 and 6/8, tap tempo) driven by a lookahead scheduler on
  the audio clock, so it does not drift.
- **Strumming patterns** shown as an arrow grid with a playhead that follows the click.
- **Chord-change drills** with a count-in, a "change now" cue and tempo that rises after each
  round you judge to be clean.
- **Song sheets**: paste a chord sheet (chord names above the lyrics) and get a diagram for
  every chord in it. Tap a chord in the song to see and hear it, transpose, switch to flats,
  change the text size and autoscroll while you play. Shapes written in the sheet itself
  (`G 3-x-0-0-3-3`) are used as given.
- **Glossary** of every guitar term used in the lessons.
- **Accessible and mobile-first**: keyboard shortcuts, visible focus, screen-reader
  announcements, reduced-motion support and large tap targets from 360 px wide.
- **Installable** as a PWA, with the app shell cached for offline use.

### Keyboard shortcuts in a lesson

| Key       | Action                  |
| --------- | ----------------------- |
| `Space`   | Play or pause the timer |
| `←` / `→` | Previous or next step   |
| `R`       | Replay the chord sound  |
| `M`       | Toggle the metronome    |
| `Esc`     | Leave the lesson        |

## Screenshots

_Screenshots go here._ Suggested set: home page, lesson player on a phone, chord library, tools.

## Local development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open the URL printed in the terminal.

## Scripts

| Script               | What it does                                         |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Start the development server                         |
| `npm run build`      | Type-check and build the production bundle to `dist` |
| `npm run preview`    | Serve the production build locally                   |
| `npm run typecheck`  | Run the TypeScript compiler without emitting files   |
| `npm run lint`       | Run ESLint (warnings fail the run)                   |
| `npm run format`     | Format the code with Prettier                        |
| `npm test`           | Run the test suite once                              |
| `npm run test:watch` | Run the tests in watch mode                          |

## Project structure

```text
src/
  main.tsx, App.tsx, routes.tsx
  data/
    chords.ts            All chord definitions and movable barre shapes
    lessons.ts           Lesson index (collects every file in data/lessons)
    lessons/             One file per lesson
    strumPatterns.ts     Built-in strumming patterns
    progressions.ts      Progressions and chord-change drill presets
    glossary.ts          Glossary terms
  domain/
    types.ts             Chord, Lesson, Step, StrumPattern and related types
    fretboard.ts         String and fret to frequency and note-name math
    chordSymbols.ts      Chord symbol parsing, transposing and shape lookup
    chordSheet.ts        Parser for pasted chord sheets
    validate.ts          Validators for chord, pattern and lesson data
  audio/
    audioEngine.ts       AudioContext lifecycle, plucked strings, strums, clicks
    scheduler.ts         Lookahead scheduler and metronome position math
  hooks/                 useTimer, useAudio, useMetronome, useProgress, useReducedMotion
  components/            ChordDiagram, StepPlayer, Timer, Metronome, StrumPattern,
                         ChordChangeDrill, LessonCard, ProgressBar, GuitarParts,
                         Fretboard, Layout, Settings, Icon
  pages/                 Home, LessonList, LessonPlayer, ChordLibrary, SongSheet, Tools,
                         Glossary, NotFound
  styles/                tokens.css (design tokens), global.css, ui.module.css
  tests/                 Vitest suites
design/                  SVG sources for the icons and the social preview image
public/                  Static files: icons, manifest, service worker
```

All colors, spacing and motion values live in `src/styles/tokens.css` as CSS variables.
Components never use literal colors.

## Adding a chord

Add an entry to `CHORDS` in `src/data/chords.ts`. Strings are listed from low E (index 0) to
high E (index 5). Fret numbers are absolute; `"x"` is a muted string and `0` an open one.

```ts
{
  id: "Em7",
  name: "Em7",
  fullName: "E minor seventh",
  quality: "minor7",
  level: "intermediate",
  frets: [0, 2, 0, 0, 0, 0],
  fingers: [0, 2, 0, 0, 0, 0],
  baseFret: 1,
  rootString: 0,
  sound: "Open and wistful, a lighter E minor.",
  tips: [
    "It is E minor with finger 3 lifted.",
    "Strum all six strings.",
  ],
  commonMistakes: [
    {
      problem: "The open D string is dead.",
      fix: "Arch finger 2 so it only touches the A string.",
    },
    {
      problem: "A note buzzes.",
      fix: "Press closer to the fret wire.",
    },
  ],
  relatedChordIds: ["Em", "E7"],
}
```

For a movable barre chord, spread `buildBarreShape("e-major" | "e-minor" | "a-major" | "a-minor", fret)`
into the entry instead of writing `frets`, `fingers` and `barres` by hand.

Run `npm test`: the chord validator checks fingering consistency, barres, ids and related chords.

## Adding a lesson

Create a file in `src/data/lessons/` that exports a `lesson`. It is picked up automatically and
placed by its `order` field.

```ts
import type { Lesson } from "../../domain/types";

const id = "intermediate-22-em7";

export const lesson: Lesson = {
  id,
  order: 22,
  level: "intermediate",
  title: "A softer E minor: Em7",
  summary: "Lift one finger to turn Em into Em7.",
  estimatedMinutes: 4,
  prerequisites: ["intermediate-21-checkpoint"],
  chordIds: ["Em", "Em7"],
  goals: ["Play Em7 and hear how it differs from Em."],
  steps: [
    {
      id: `${id}-meet`,
      title: "Meet Em7",
      body: "Em7 is E minor with one finger lifted. Listen to both chords and compare.",
      durationSec: 20,
      chordId: "Em7",
      compareChordId: "Em",
      action: "read",
      autoplayChord: true,
    },
    // ...four to ten more steps...
    {
      id: `${id}-summary`,
      title: "Lesson recap",
      body: "You added a new color to a chord you already know.",
      durationSec: 15,
      action: "read",
      visual: "summary",
      checklist: ["I can change between Em and Em7 without looking."],
    },
  ],
};
```

Rules the lesson validator enforces: 5 to 12 steps, unique step ids, positive durations, every
chord used by a step listed in `chordIds` and present in the library, existing prerequisites
with no cycles, and a final step with `visual: "summary"` and a self-check list.

Step `action` values: `read`, `place`, `strum`, `hold`, `drill`, `metronome`, `quiz`. See
`src/domain/types.ts` for every optional field (`highlightFingers`, `strumPatternId`, `bpm`,
`holdCycle`, `drillChordIds`, `quiz`, `visual`).

## Testing

```bash
npm test
```

The suite covers the fretboard math, chord and lesson data validation, the timer hook, the
scheduler (against a mocked audio clock, including a five-minute drift check), the audio
engine, progress storage (read, write, corruption fallback, migration), the chord diagram and
the step player. It runs in a few seconds and needs no browser.

## Deployment

The app is a static site and deploys to Vercel as is:

- Build command `npm run build`, output directory `dist`, Node.js 20.
- `vercel.json` rewrites every path to `index.html` so client-side routes work on reload, and
  sets long-lived cache headers for the hashed files in `/assets`.
- Production deploys come from the `main` branch; pull requests get preview deployments.

To regenerate the icons and the social preview image after editing the SVGs in `design/`
(requires `rsvg-convert`):

```bash
./scripts/generate-assets.sh
```

## Browser support

Current versions of Chrome, Firefox, Safari and Edge, including iOS Safari and Android Chrome.
Sound starts after your first tap or key press, as browsers require.

## License

[MIT](LICENSE)

## Credits

- Built with [React](https://react.dev), [Vite](https://vite.dev),
  [React Router](https://reactrouter.com) and [Vitest](https://vitest.dev).
- The string sound uses the Karplus-Strong plucked-string algorithm (Kevin Karplus and
  Alex Strong, 1983).
- Created by Jackson F. de A. Mafra.
