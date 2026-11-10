import { describe, expect, it, vi } from "vitest";
import { clampBpm, positionAt, Scheduler, tickSeconds } from "../audio/scheduler";

/** A fake audio context clock plus a manually driven interval timer. */
function createHarness(tickDuration: () => number) {
  const context = { currentTime: 0 };
  let handler: (() => void) | null = null;
  const onTick = vi.fn<(tick: number, time: number) => void>();
  const clearIntervalFn = vi.fn(() => {
    handler = null;
  });
  const scheduler = new Scheduler({
    now: () => context.currentTime,
    tickDuration,
    onTick,
    lookaheadSec: 0.1,
    intervalMs: 25,
    setIntervalFn: (callback) => {
      handler = callback;
      return 1;
    },
    clearIntervalFn,
  });
  /** Advances the audio clock in 25 ms timer steps. */
  const advance = (seconds: number) => {
    const steps = Math.round(seconds / 0.025);
    for (let i = 0; i < steps; i += 1) {
      context.currentTime = Number((context.currentTime + 0.025).toFixed(6));
      handler?.();
    }
  };
  return { context, scheduler, onTick, advance, clearIntervalFn };
}

describe("Scheduler", () => {
  it("schedules clicks at exact audio-clock times", () => {
    // 120 BPM quarter notes: one tick every 0.5 s.
    const { scheduler, onTick, advance } = createHarness(() => 0.5);
    scheduler.start(0);
    advance(2);
    const times = onTick.mock.calls.map(([, time]) => time);
    expect(onTick.mock.calls.map(([tick]) => tick)).toEqual([0, 1, 2, 3, 4]);
    times.forEach((time, index) => expect(time).toBeCloseTo(index * 0.5, 9));
  });

  it("only schedules ticks inside the lookahead window", () => {
    const { scheduler, onTick, advance } = createHarness(() => 0.5);
    scheduler.start(0);
    expect(onTick).toHaveBeenCalledTimes(1);
    advance(0.375);
    // The tick at 0.5 s is still more than 0.1 s away.
    expect(onTick).toHaveBeenCalledTimes(1);
    advance(0.05);
    expect(onTick).toHaveBeenCalledTimes(2);
    expect(onTick).toHaveBeenLastCalledWith(1, 0.5);
  });

  it("schedules ahead of the clock, never late", () => {
    const { context, scheduler, onTick, advance } = createHarness(() => 0.25);
    onTick.mockImplementation((_tick, time) => {
      expect(time).toBeGreaterThanOrEqual(context.currentTime);
    });
    scheduler.start(0.06);
    advance(3);
    expect(onTick.mock.calls.length).toBeGreaterThan(10);
  });

  it("does not drift over five minutes", () => {
    const interval = tickSeconds(100, "4/4");
    const { scheduler, onTick, advance } = createHarness(() => interval);
    scheduler.start(0);
    advance(300);
    const calls = onTick.mock.calls;
    const last = calls[calls.length - 1];
    expect(last).toBeDefined();
    if (!last) return;
    const [tick, time] = last;
    expect(Math.abs(time - tick * interval)).toBeLessThan(1e-6);
    expect(tick).toBeGreaterThanOrEqual(Math.floor(300 / interval));
  });

  it("follows tempo changes on the next tick", () => {
    let duration = 0.5;
    const { scheduler, onTick, advance } = createHarness(() => duration);
    scheduler.start(0);
    advance(0.5);
    duration = 0.25;
    advance(1);
    const times = onTick.mock.calls.map(([, time]) => time);
    expect(times.slice(0, 5)).toEqual([0, 0.5, 1, 1.25, 1.5].map((t) => expect.closeTo(t, 9)));
  });

  it("stops scheduling after stop()", () => {
    const { scheduler, onTick, advance, clearIntervalFn } = createHarness(() => 0.5);
    scheduler.start(0);
    advance(1);
    const count = onTick.mock.calls.length;
    scheduler.stop();
    advance(2);
    expect(onTick).toHaveBeenCalledTimes(count);
    expect(clearIntervalFn).toHaveBeenCalledTimes(1);
    expect(scheduler.isRunning).toBe(false);
  });

  it("restarts from tick 0", () => {
    const { scheduler, onTick, advance } = createHarness(() => 0.5);
    scheduler.start(0);
    advance(1);
    onTick.mockClear();
    scheduler.start(0);
    expect(onTick).toHaveBeenCalledWith(0, expect.any(Number));
  });
});

describe("metronome positions", () => {
  it("splits 4/4 into eight slots with beats on the even ones", () => {
    expect(positionAt(0, "4/4")).toMatchObject({
      slot: 0,
      beat: 0,
      isBeat: true,
      isDownbeat: true,
      bar: 0,
    });
    expect(positionAt(1, "4/4")).toMatchObject({
      slot: 1,
      beat: 0,
      isBeat: false,
      isDownbeat: false,
    });
    expect(positionAt(6, "4/4")).toMatchObject({ slot: 6, beat: 3, isBeat: true });
    expect(positionAt(8, "4/4")).toMatchObject({ slot: 0, bar: 1, isDownbeat: true });
  });

  it("handles 3/4 and 6/8", () => {
    expect(positionAt(6, "3/4")).toMatchObject({ slot: 0, bar: 1, beatsPerBar: 3 });
    expect(positionAt(4, "3/4")).toMatchObject({ beat: 2, isBeat: true });
    expect(positionAt(3, "6/8")).toMatchObject({ beat: 3, isBeat: true, beatsPerBar: 6 });
  });

  it("converts tempo to tick length", () => {
    expect(tickSeconds(60, "4/4")).toBeCloseTo(0.5);
    expect(tickSeconds(120, "3/4")).toBeCloseTo(0.25);
    expect(tickSeconds(120, "6/8")).toBeCloseTo(0.5);
  });

  it("clamps tempo to the supported range", () => {
    expect(clampBpm(10)).toBe(40);
    expect(clampBpm(500)).toBe(200);
    expect(clampBpm(99.6)).toBe(100);
    expect(clampBpm(Number.NaN)).toBe(40);
  });
});
