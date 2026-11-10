/**
 * Starter tunes for the tab player, all in the public domain, written in
 * alphaTex: each note is fret.string.duration, with string 1 the thinnest.
 */
export interface LibraryTune {
  id: string;
  title: string;
  credit: string;
  bpm: number;
  tex: string;
}

function tune(title: string, credit: string, bpm: number, bars: string[]): string {
  return `\\title "${title}"\n\\subtitle "${credit}"\n\\tempo ${bpm}\n.\n${bars.join(" |\n")}`;
}

export const TAB_LIBRARY: readonly LibraryTune[] = [
  {
    id: "twinkle",
    title: "Twinkle Twinkle Little Star",
    credit: "Traditional",
    bpm: 100,
    tex: tune("Twinkle Twinkle Little Star", "Traditional", 100, [
      "1.2.4 1.2.4 3.1.4 3.1.4",
      "5.1.4 5.1.4 3.1.2",
      "1.1.4 1.1.4 0.1.4 0.1.4",
      "3.2.4 3.2.4 1.2.2",
      "3.1.4 3.1.4 1.1.4 1.1.4",
      "0.1.4 0.1.4 3.2.2",
      "3.1.4 3.1.4 1.1.4 1.1.4",
      "0.1.4 0.1.4 3.2.2",
      "1.2.4 1.2.4 3.1.4 3.1.4",
      "5.1.4 5.1.4 3.1.2",
      "1.1.4 1.1.4 0.1.4 0.1.4",
      "3.2.4 3.2.4 1.2.2",
    ]),
  },
  {
    id: "ode-to-joy",
    title: "Ode to Joy",
    credit: "Ludwig van Beethoven",
    bpm: 110,
    tex: tune("Ode to Joy", "Ludwig van Beethoven", 110, [
      "0.1.4 0.1.4 1.1.4 3.1.4",
      "3.1.4 1.1.4 0.1.4 3.2.4",
      "1.2.4 1.2.4 3.2.4 0.1.4",
      "0.1.4{d} 3.2.8 3.2.2",
      "0.1.4 0.1.4 1.1.4 3.1.4",
      "3.1.4 1.1.4 0.1.4 3.2.4",
      "1.2.4 1.2.4 3.2.4 0.1.4",
      "3.2.4{d} 1.2.8 1.2.2",
    ]),
  },
  {
    id: "frere-jacques",
    title: "Frère Jacques",
    credit: "Traditional",
    bpm: 110,
    tex: tune("Frère Jacques", "Traditional", 110, [
      "1.2.4 3.2.4 0.1.4 1.2.4",
      "1.2.4 3.2.4 0.1.4 1.2.4",
      "0.1.4 1.1.4 3.1.2",
      "0.1.4 1.1.4 3.1.2",
      "3.1.8 5.1.8 3.1.8 1.1.8 0.1.4 1.2.4",
      "3.1.8 5.1.8 3.1.8 1.1.8 0.1.4 1.2.4",
      "1.2.4 0.3.4 1.2.2",
      "1.2.4 0.3.4 1.2.2",
    ]),
  },
  {
    id: "mary-lamb",
    title: "Mary Had a Little Lamb",
    credit: "Traditional",
    bpm: 110,
    tex: tune("Mary Had a Little Lamb", "Traditional", 110, [
      "0.1.4 3.2.4 1.2.4 3.2.4",
      "0.1.4 0.1.4 0.1.2",
      "3.2.4 3.2.4 3.2.2",
      "0.1.4 3.1.4 3.1.2",
      "0.1.4 3.2.4 1.2.4 3.2.4",
      "0.1.4 0.1.4 0.1.4 0.1.4",
      "3.2.4 3.2.4 0.1.4 3.2.4",
      "1.2.1",
    ]),
  },
  {
    id: "jingle-bells",
    title: "Jingle Bells",
    credit: "James Lord Pierpont",
    bpm: 130,
    tex: tune("Jingle Bells", "James Lord Pierpont", 130, [
      "0.1.4 0.1.4 0.1.2",
      "0.1.4 0.1.4 0.1.2",
      "0.1.4 3.1.4 1.2.4{d} 3.2.8",
      "0.1.1",
      "1.1.4 1.1.4 1.1.4{d} 1.1.8",
      "1.1.4 0.1.4 0.1.4 0.1.8 0.1.8",
      "0.1.4 3.2.4 3.2.4 0.1.4",
      "3.2.2 3.1.2",
    ]),
  },
];
