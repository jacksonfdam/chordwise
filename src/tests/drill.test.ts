import { describe, expect, it } from "vitest";
import { positionAt } from "../audio/scheduler";
import { drillMoment, nextBpm, roundBars } from "../components/ChordChangeDrill/drillMath";
import { addTap, bpmFromTaps } from "../components/Metronome/tapTempo";

const at = (bar: number, beat: number) => positionAt(bar * 8 + beat * 2, "4/4");

describe("chord-change drill timing", () => {
  it("uses the first bar as a count-in", () => {
    expect(drillMoment(at(0, 0), 2, 2)).toMatchObject({
      countIn: true,
      currentIndex: 0,
      nextIndex: 1,
    });
    expect(drillMoment(at(0, 3), 2, 2).changeNow).toBe(false);
  });

  it("holds each chord for the requested number of bars", () => {
    expect(drillMoment(at(1, 0), 2, 2).currentIndex).toBe(0);
    expect(drillMoment(at(2, 3), 2, 2).currentIndex).toBe(0);
    expect(drillMoment(at(3, 0), 2, 2).currentIndex).toBe(1);
    expect(drillMoment(at(5, 0), 2, 2).currentIndex).toBe(0);
  });

  it("cues the change one beat before it happens", () => {
    expect(drillMoment(at(1, 3), 2, 2).changeNow).toBe(false);
    expect(drillMoment(at(2, 2), 2, 2).changeNow).toBe(false);
    expect(drillMoment(at(2, 3), 2, 2).changeNow).toBe(true);
  });

  it("cycles through three or more chords", () => {
    expect(drillMoment(at(3, 0), 3, 1)).toMatchObject({ currentIndex: 2, nextIndex: 0 });
    expect(roundBars(3, 1)).toBe(3);
    expect(roundBars(2, 2)).toBe(4);
  });

  it("raises the tempo only after a clean round, up to the target", () => {
    expect(nextBpm(60, true, 4, 100)).toBe(64);
    expect(nextBpm(60, false, 4, 100)).toBe(60);
    expect(nextBpm(98, true, 4, 100)).toBe(100);
  });
});

describe("tap tempo", () => {
  it("needs two taps", () => {
    expect(bpmFromTaps([])).toBeNull();
    expect(bpmFromTaps(addTap([], 0))).toBeNull();
  });

  it("averages the gap between taps", () => {
    let taps: number[] = [];
    for (const time of [0, 500, 1000, 1500]) taps = addTap(taps, time);
    expect(bpmFromTaps(taps)).toBe(120);
  });

  it("starts over after a long pause", () => {
    let taps = addTap(addTap([], 0), 500);
    taps = addTap(taps, 10000);
    expect(taps).toEqual([10000]);
  });
});
