import { useState } from "react";
import ui from "../../styles/ui.module.css";
import styles from "./GuitarParts.module.css";

type PartId =
  | "headstock"
  | "tuning-pegs"
  | "nut"
  | "neck"
  | "frets"
  | "body"
  | "sound-hole"
  | "bridge"
  | "strings";

interface Part {
  id: PartId;
  name: string;
  description: string;
}

const PARTS: readonly Part[] = [
  {
    id: "headstock",
    name: "Headstock",
    description: "The top end of the guitar. It holds the tuning pegs.",
  },
  {
    id: "tuning-pegs",
    name: "Tuning pegs",
    description:
      "Six knobs, one per string. Turning a peg tightens or loosens its string, which raises or lowers the pitch.",
  },
  {
    id: "nut",
    name: "Nut",
    description:
      "A small grooved strip where the neck meets the headstock. It holds the strings in place and marks the start of the fretboard.",
  },
  {
    id: "neck",
    name: "Neck",
    description:
      "The long part you hold with your fretting hand. Its flat front, the fretboard, is where your fingers press the strings.",
  },
  {
    id: "frets",
    name: "Frets",
    description:
      "Thin metal strips across the neck. Pressing a string just behind a fret shortens it and gives a higher note.",
  },
  {
    id: "body",
    name: "Body",
    description:
      "The large hollow part. It rests on your leg and makes the sound of the strings louder.",
  },
  {
    id: "sound-hole",
    name: "Sound hole",
    description:
      "The round opening that lets the sound out. You strum the strings over or near it.",
  },
  {
    id: "bridge",
    name: "Bridge",
    description: "The strip on the body where the strings are anchored.",
  },
  {
    id: "strings",
    name: "Strings",
    description:
      "Six strings, from the thickest (lowest sound) to the thinnest (highest sound). The thickest is closest to your face when you play.",
  },
];

/*
 * The guitar is drawn flat, in plain x/y units, and then laid onto an
 * isometric ground plane with one matrix: x runs down-right, y down-left.
 * Thickness is the same outline drawn again a few pixels lower.
 */
const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const PLANE = `matrix(${COS} ${SIN} ${-COS} ${SIN} 96 10)`;
const BODY_DEPTH = 12;
const NECK_DEPTH = 6;

const BODY_PATH =
  "M140 50C140 20 165 14 180 14C195 14 200 22 210 22C220 22 228 4 250 4C280 4 292 28 292 50C292 72 280 96 250 96C228 96 220 78 210 78C200 78 195 86 180 86C165 86 140 80 140 50Z";
const HEADSTOCK_PATH = "M39 40L13 34L6 50L13 66L39 60Z";
const FRET_POSITIONS = [52, 63, 73, 82, 91, 99, 107, 114, 121, 127, 133, 139];
const STRING_YS = [43.5, 46.1, 48.7, 51.3, 53.9, 56.5];
const PEGS: readonly [number, number][] = [
  [16, 30],
  [24, 31.5],
  [32, 33],
  [16, 70],
  [24, 68.5],
  [32, 67],
];

export function GuitarParts() {
  const [selected, setSelected] = useState<PartId>("body");
  const part = PARTS.find((candidate) => candidate.id === selected) ?? PARTS[0];
  const cls = (id: PartId, base: string | undefined) =>
    `${base ?? ""} ${styles.part} ${selected === id ? styles.hot : ""}`;
  const pick = (id: PartId) => () => setSelected(id);

  return (
    <div className={styles.wrap}>
      {/* The drawing is decorative for assistive tech; the buttons below carry the content. */}
      <svg className={styles.svg} viewBox="0 0 366 226" aria-hidden="true">
        <g transform={`translate(0 ${BODY_DEPTH})`}>
          <g transform={PLANE}>
            <path className={styles.side} d={BODY_PATH} />
          </g>
        </g>
        <g transform={`translate(0 ${NECK_DEPTH})`}>
          <g transform={PLANE}>
            <rect className={styles.side} x="39" y="41" width="106" height="18" />
            <path className={styles.side} d={HEADSTOCK_PATH} />
          </g>
        </g>

        <g transform={PLANE}>
          <path className={cls("body", styles.top)} d={BODY_PATH} onClick={pick("body")} />
          <circle
            className={cls("sound-hole", styles.hole)}
            cx="198"
            cy="50"
            r="13"
            onClick={pick("sound-hole")}
          />
          <rect
            className={cls("bridge", styles.top)}
            x="252"
            y="35"
            width="8"
            height="30"
            rx="2"
            onClick={pick("bridge")}
          />
          <rect
            className={cls("neck", styles.top)}
            x="39"
            y="41"
            width="106"
            height="18"
            onClick={pick("neck")}
          />
          <g className={cls("frets", undefined)} onClick={pick("frets")}>
            {FRET_POSITIONS.map((x) => (
              <line key={x} className={styles.line} x1={x} x2={x} y1="41" y2="59" />
            ))}
          </g>
          <path
            className={cls("headstock", styles.top)}
            d={HEADSTOCK_PATH}
            onClick={pick("headstock")}
          />
          <g className={cls("tuning-pegs", undefined)} onClick={pick("tuning-pegs")}>
            {PEGS.map(([x, y]) => (
              <circle key={`${x}-${y}`} className={styles.peg} cx={x} cy={y} r="3.2" />
            ))}
          </g>
          <g className={cls("strings", undefined)} onClick={pick("strings")}>
            {STRING_YS.map((y) => (
              <line key={y} className={styles.line} x1="20" x2="256" y1={y} y2={y} />
            ))}
          </g>
          <rect
            className={cls("nut", styles.nut)}
            x="37"
            y="41"
            width="3.5"
            height="18"
            onClick={pick("nut")}
          />
        </g>
      </svg>

      <ul className={styles.buttons} aria-label="Parts of the guitar">
        {PARTS.map((candidate) => (
          <li key={candidate.id}>
            <button
              type="button"
              className={ui.chipButton}
              aria-pressed={selected === candidate.id}
              onClick={pick(candidate.id)}
            >
              {candidate.name}
            </button>
          </li>
        ))}
      </ul>

      {part && (
        <p className={styles.description} aria-live="polite">
          <strong className={styles.partName}>{part.name}.</strong> {part.description}
        </p>
      )}
    </div>
  );
}
