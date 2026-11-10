const MAX_GAP_MS = 2000;
const MAX_TAPS = 6;

/** Adds a tap and forgets taps that are too old to belong to the same tempo. */
export function addTap(taps: readonly number[], timeMs: number): number[] {
  const last = taps[taps.length - 1];
  const recent = last !== undefined && timeMs - last > MAX_GAP_MS ? [] : [...taps];
  recent.push(timeMs);
  return recent.slice(-MAX_TAPS);
}

/** Tempo from the average gap between taps, or null with fewer than two taps. */
export function bpmFromTaps(taps: readonly number[]): number | null {
  const first = taps[0];
  const last = taps[taps.length - 1];
  if (taps.length < 2 || first === undefined || last === undefined || last <= first) return null;
  const averageGap = (last - first) / (taps.length - 1);
  return Math.round(60000 / averageGap);
}
