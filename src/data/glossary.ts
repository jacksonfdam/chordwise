import type { GlossaryTerm } from "../domain/types";

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    term: "Accent",
    definition:
      "A strum or beat played louder than the ones around it, to give the rhythm a shape.",
    seeAlso: ["Beat", "Strum"],
  },
  {
    term: "Anchor finger",
    definition:
      "A finger that stays on the same string and fret while you change from one chord to the next. It keeps your hand steady.",
    seeAlso: ["Common finger"],
  },
  {
    term: "Bar",
    definition:
      "A small group of beats that repeats, also called a measure. In most songs a bar has four beats.",
    seeAlso: ["Beat", "Time signature"],
  },
  {
    term: "Barre",
    definition:
      "Pressing several strings at the same fret with one flat finger, usually the index finger.",
    seeAlso: ["Barre chord", "Mini-barre"],
  },
  {
    term: "Barre chord",
    definition:
      "A chord built on a barre. Because it uses no open strings, the whole shape can slide up and down the neck to make new chords.",
    seeAlso: ["Barre", "Movable shape"],
  },
  {
    term: "Beat",
    definition: "The steady pulse of the music, the thing you tap your foot to.",
    seeAlso: ["BPM", "Bar"],
  },
  {
    term: "BPM",
    definition:
      "Beats per minute: how fast the music is. 60 BPM is one beat every second; 120 BPM is twice as fast.",
    seeAlso: ["Beat", "Metronome", "Tempo"],
  },
  {
    term: "Bridge",
    definition: "The part on the body of the guitar where the strings are anchored.",
    seeAlso: ["Nut", "Saddle"],
  },
  {
    term: "Capo",
    definition:
      "A clamp placed across a fret that raises the pitch of all the strings, like a movable nut. It lets you play open chord shapes in a higher key.",
    seeAlso: ["Nut", "Key"],
  },
  {
    term: "Chord",
    definition: "Three or more notes played together.",
    seeAlso: ["Triad", "Chord diagram"],
  },
  {
    term: "Chord diagram",
    definition:
      "A picture of the fretboard that shows where to put your fingers for a chord. Vertical lines are strings, horizontal lines are frets, dots are fingers.",
    seeAlso: ["Chord", "Fret"],
  },
  {
    term: "Common finger",
    definition:
      "A finger that is used in both chords of a change, even if it has to move. Planning its path makes the change smoother.",
    seeAlso: ["Anchor finger"],
  },
  {
    term: "Dominant seventh",
    definition:
      "A major chord with one extra note (a flattened seventh). It sounds bluesy and restless. Written with a 7, as in A7.",
    seeAlso: ["Seventh chord"],
  },
  {
    term: "Down-strum",
    definition:
      "Brushing the strings from the thickest toward the thinnest, moving toward the floor.",
    seeAlso: ["Up-strum", "Strum"],
  },
  {
    term: "Eighth note",
    definition:
      "A note that lasts half a beat. Counting eighth notes sounds like '1 and 2 and 3 and 4 and'.",
    seeAlso: ["Beat", "Quarter note"],
  },
  {
    term: "Fret",
    definition:
      "One of the metal strips across the neck, and also the space just behind it where you press the string. 'Fret 2' means the second space from the nut.",
    seeAlso: ["Fret wire", "Fretboard"],
  },
  {
    term: "Fret wire",
    definition: "The metal strip itself. Press just behind it for a clean note.",
    seeAlso: ["Fret"],
  },
  {
    term: "Fretboard",
    definition:
      "The front of the neck, where the frets are and where your fingers press the strings.",
    seeAlso: ["Fret", "Neck"],
  },
  {
    term: "Fretting hand",
    definition:
      "The hand that presses the strings on the neck: the left hand for right-handed players.",
    seeAlso: ["Picking hand"],
  },
  {
    term: "Ghost strum",
    definition:
      "A strumming motion that misses the strings on purpose. It keeps your hand moving in time through a rest.",
    seeAlso: ["Rest", "Strum"],
  },
  {
    term: "Headstock",
    definition: "The top end of the guitar, which holds the tuning pegs.",
    seeAlso: ["Tuning peg"],
  },
  {
    term: "Key",
    definition:
      "The family of notes and chords a song is built from, named after its 'home' chord. A song in the key of G feels at rest on a G chord.",
    seeAlso: ["Progression", "Root"],
  },
  {
    term: "Major",
    definition:
      "A chord quality that sounds bright and happy. A chord name with just a letter, like G, is major.",
    seeAlso: ["Minor", "Triad"],
  },
  {
    term: "Major seventh",
    definition:
      "A major chord with one extra note (a natural seventh). It sounds dreamy and soft. Written maj7, as in Cmaj7.",
    seeAlso: ["Seventh chord"],
  },
  {
    term: "Metronome",
    definition: "A device that clicks at a steady speed so you can practice in time.",
    seeAlso: ["BPM", "Beat"],
  },
  {
    term: "Mini-barre",
    definition: "A small barre that covers only two or three strings, as in the easy F chord.",
    seeAlso: ["Barre"],
  },
  {
    term: "Minor",
    definition: "A chord quality that sounds dark or sad. Written with a small m, as in Am.",
    seeAlso: ["Major", "Triad"],
  },
  {
    term: "Minor seventh",
    definition:
      "A minor chord with one extra note (a flattened seventh). It sounds mellow and relaxed. Written m7, as in Am7.",
    seeAlso: ["Seventh chord"],
  },
  {
    term: "Movable shape",
    definition:
      "A chord shape with no open strings. Slide it to a different fret and you get a different chord of the same type.",
    seeAlso: ["Barre chord", "Power chord"],
  },
  {
    term: "Muting",
    definition:
      "Stopping a string from ringing, either by touching it lightly with a finger or by resting the picking hand on it. Muted strings are marked X in a diagram.",
    seeAlso: ["Palm muting"],
  },
  {
    term: "Neck",
    definition: "The long, thin part of the guitar that you hold with your fretting hand.",
    seeAlso: ["Fretboard"],
  },
  {
    term: "Nut",
    definition:
      "The small grooved strip at the top of the neck where the strings pass onto the headstock. In a chord diagram it is the thick line at the top.",
    seeAlso: ["Headstock", "Bridge"],
  },
  {
    term: "Octave",
    definition:
      "The same note at a higher or lower pitch. Fret 12 on any string is one octave above the open string.",
    seeAlso: ["Root"],
  },
  {
    term: "Open string",
    definition: "A string played without pressing any fret. Marked O in a chord diagram.",
    seeAlso: ["Muting"],
  },
  {
    term: "Palm muting",
    definition:
      "Resting the side of the picking hand lightly on the strings near the bridge while strumming, for a short, chunky sound.",
    seeAlso: ["Muting", "Power chord"],
  },
  {
    term: "Pick",
    definition:
      "A small flat piece of plastic held between thumb and index finger and used to strum or pluck the strings. Also called a plectrum.",
    seeAlso: ["Strum", "Pluck"],
  },
  {
    term: "Picking hand",
    definition:
      "The hand that strums or plucks the strings: the right hand for right-handed players.",
    seeAlso: ["Fretting hand"],
  },
  {
    term: "Pluck",
    definition: "Playing a single string, with a pick or a finger.",
    seeAlso: ["Strum"],
  },
  {
    term: "Power chord",
    definition:
      "A two-note chord (root and fifth) that is neither major nor minor. Written with a 5, as in E5. Common in rock.",
    seeAlso: ["Root", "Movable shape"],
  },
  {
    term: "Progression",
    definition: "A series of chords played in order, usually repeated. The backbone of a song.",
    seeAlso: ["Key", "Roman numerals"],
  },
  {
    term: "Quarter note",
    definition: "A note that lasts one beat.",
    seeAlso: ["Beat", "Eighth note"],
  },
  {
    term: "Rest",
    definition: "A moment of silence that still takes up time in the rhythm.",
    seeAlso: ["Ghost strum"],
  },
  {
    term: "Roman numerals",
    definition:
      "A way to describe progressions in any key. I is the home chord, IV the chord four steps up, V five steps up. Small numerals, like vi, are minor chords.",
    seeAlso: ["Progression", "Key"],
  },
  {
    term: "Root",
    definition:
      "The note a chord is named after and built on. The root of a G chord is the note G. Also called the root note.",
    seeAlso: ["Chord", "Octave"],
  },
  {
    term: "Saddle",
    definition: "The thin strip on the bridge that the strings rest on.",
    seeAlso: ["Bridge"],
  },
  {
    term: "Seventh chord",
    definition:
      "A chord with four different notes: a triad plus a note called the seventh. It adds color and tension.",
    seeAlso: ["Dominant seventh", "Major seventh", "Minor seventh"],
  },
  {
    term: "Sound hole",
    definition: "The round opening in the body of an acoustic guitar that lets the sound out.",
  },
  {
    term: "Standard tuning",
    definition: "The usual tuning of the six strings, from thickest to thinnest: E, A, D, G, B, E.",
    seeAlso: ["Tuning peg", "Tuner"],
  },
  {
    term: "Strum",
    definition: "Brushing across several strings in one motion, with a pick or your fingers.",
    seeAlso: ["Down-strum", "Up-strum", "Strumming pattern"],
  },
  {
    term: "Strumming pattern",
    definition: "A repeating rhythm of down-strums, up-strums and rests.",
    seeAlso: ["Strum", "Ghost strum"],
  },
  {
    term: "Sus chord",
    definition:
      "Short for suspended. One note of the chord is swapped for a neighbor, so the chord sounds open and unresolved until it returns to major or minor. Written sus2 or sus4.",
    seeAlso: ["Major", "Minor"],
  },
  {
    term: "Tempo",
    definition: "The speed of the music, measured in BPM.",
    seeAlso: ["BPM"],
  },
  {
    term: "Time signature",
    definition:
      "Tells you how many beats are in each bar. 4/4 has four beats per bar; 3/4 has three, like a waltz.",
    seeAlso: ["Bar", "Beat"],
  },
  {
    term: "Triad",
    definition: "A chord made of three different notes. Plain major and minor chords are triads.",
    seeAlso: ["Chord", "Seventh chord"],
  },
  {
    term: "Tuner",
    definition:
      "A device or app that shows whether a string is too low (flat), too high (sharp) or in tune. A clip-on tuner attaches to the headstock.",
    seeAlso: ["Standard tuning"],
  },
  {
    term: "Tuning peg",
    definition:
      "One of the knobs on the headstock. Turning it tightens or loosens a string, which raises or lowers its pitch.",
    seeAlso: ["Headstock", "Standard tuning"],
  },
  {
    term: "Up-strum",
    definition:
      "Brushing the strings from the thinnest toward the thickest, moving toward the ceiling.",
    seeAlso: ["Down-strum", "Strum"],
  },
];
