import styles from "./HandDiagram.module.css";

export type HandPictureName = "thumb-behind-neck" | "picking-hand-position" | "thumb-strum";

const PICTURES: Readonly<
  Record<
    HandPictureName,
    { src: string; width: number; height: number; alt: string; caption: string }
  >
> = {
  "thumb-behind-neck": {
    src: "/hands/thumb-behind-neck.webp",
    width: 640,
    height: 686,
    alt: "The back of the guitar neck with the thumb resting in the middle of it, pointing up.",
    caption: "The thumb rests on the middle of the back of the neck.",
  },
  "picking-hand-position": {
    src: "/hands/picking-hand-position.webp",
    width: 640,
    height: 678,
    alt: "The picking hand resting over the sound hole, with the forearm on the edge of the guitar body.",
    caption: "The picking hand hangs relaxed over the sound hole.",
  },
  "thumb-strum": {
    src: "/hands/thumb-strum.webp",
    width: 640,
    height: 679,
    alt: "A hand over the sound hole with the thumb brushing down across the strings.",
    caption: "Without a pick, the side of the thumb brushes down across the strings.",
  },
};

/** A general illustration of hand position, used by lesson steps. */
export function HandPicture({ name }: { name: HandPictureName }) {
  const picture = PICTURES[name];
  return (
    <figure className={`${styles.figure} ${styles.lg}`} style={{ margin: "0 auto" }}>
      <img
        className={styles.picture}
        src={picture.src}
        width={picture.width}
        height={picture.height}
        loading="lazy"
        decoding="async"
        alt={picture.alt}
      />
      <figcaption className={styles.caption}>{picture.caption}</figcaption>
    </figure>
  );
}
