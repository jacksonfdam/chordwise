import { rootNoteTable } from "../../domain/fretboard";
import styles from "./RootNoteTable.module.css";

/** Flat spellings for the sharps, since chord names often use them (Bb, Eb). */
const FLAT_NAMES: Readonly<Record<string, string>> = {
  "A#": "Bb",
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
};

function spell(note: string): string {
  const flat = FLAT_NAMES[note];
  return flat ? `${note} / ${flat}` : note;
}

/** Root notes on strings 6 and 5 through fret 12, as a real table. */
export function RootNoteTable() {
  const rows = rootNoteTable(12);
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption className="sr-only">
          Note names on the low E string and the A string, from the open string to fret 12
        </caption>
        <thead>
          <tr>
            <th scope="col">Fret</th>
            <th scope="col">String 6 (low E)</th>
            <th scope="col">String 5 (A)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.fret}>
              <th scope="row">{row.fret === 0 ? "Open" : row.fret}</th>
              <td>{spell(row.sixthString)}</td>
              <td>{spell(row.fifthString)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
