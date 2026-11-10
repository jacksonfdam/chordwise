import type { Chord } from "../../domain/types";
import styles from "./HandDiagram.module.css";

/** Illustrations of the fretting hand, by chord id. Files live in public/hands. */
const HAND_PICTURES: Readonly<Record<string, string>> = {
  A: "/hands/chord-a.webp",
  Am: "/hands/chord-am.webp",
  C: "/hands/chord-c.webp",
  D: "/hands/chord-d.webp",
  E: "/hands/chord-e.webp",
  Em: "/hands/chord-em.webp",
  G: "/hands/chord-g.webp",
  "F-barre": "/hands/barre-f.webp",
};

/** True when there is a hand illustration for this chord. */
export function hasHandPicture(chord: Pick<Chord, "id">): boolean {
  return chord.id in HAND_PICTURES;
}

export interface HandDiagramProps {
  chord: Chord;
  size?: "md" | "lg";
}

/**
 * A picture of the fretting hand on the neck, for the chords that have one.
 * It shows the general shape of the hand; the chord diagram beside it is the
 * exact reference for strings, frets and fingers. Renders nothing otherwise.
 */
export function HandDiagram({ chord, size = "md" }: HandDiagramProps) {
  const source = HAND_PICTURES[chord.id];
  if (!source) return null;
  return (
    <figure className={`${styles.figure} ${styles[size]}`} data-hand={chord.id}>
      <img
        className={styles.picture}
        src={source}
        width={520}
        height={398}
        loading="lazy"
        decoding="async"
        alt={`Fretting hand playing ${chord.fullName}, seen from the front with the nut on the right.`}
      />
      <figcaption className={styles.caption}>
        Hand shape, seen from the front. Use the diagram for the exact fingers and frets.
      </figcaption>
    </figure>
  );
}
