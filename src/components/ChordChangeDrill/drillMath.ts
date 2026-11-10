import type { TickPosition } from "../../audio/scheduler";

export interface DrillMoment {
  /** True during the four count-in clicks before the first chord. */
  countIn: boolean;
  /** Index into the chord list of the chord to play now (or first, during the count-in). */
  currentIndex: number;
  nextIndex: number;
  /** True on the last beat before a change: time to move. */
  changeNow: boolean;
  /** 1-based bar inside the round; 0 during the count-in. */
  barInRound: number;
}

/** Bar 0 is the count-in; bars 1..n are played. */
export function drillMoment(
  position: Pick<TickPosition, "bar" | "beat" | "beatsPerBar">,
  chordCount: number,
  barsPerChord: number,
): DrillMoment {
  const lastBeat = position.beat === position.beatsPerBar - 1;
  if (position.bar === 0) {
    return {
      countIn: true,
      currentIndex: 0,
      nextIndex: chordCount > 1 ? 1 : 0,
      changeNow: false,
      barInRound: 0,
    };
  }
  const played = position.bar - 1;
  const currentIndex = Math.floor(played / barsPerChord) % chordCount;
  const lastBarOfChord = played % barsPerChord === barsPerChord - 1;
  return {
    countIn: false,
    currentIndex,
    nextIndex: (currentIndex + 1) % chordCount,
    changeNow: lastBarOfChord && lastBeat,
    barInRound: position.bar,
  };
}

/** Bars in one round: once through every chord. */
export function roundBars(chordCount: number, barsPerChord: number): number {
  return chordCount * barsPerChord;
}

/** Tempo for the next round: faster after a clean round, unchanged otherwise. */
export function nextBpm(
  current: number,
  clean: boolean,
  increment: number,
  target: number,
): number {
  if (!clean) return current;
  return Math.min(target, current + increment);
}
