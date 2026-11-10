import type { TimeSignature } from "../domain/types";

export interface SchedulerOptions {
  /** Current time of the audio clock, in seconds. */
  now: () => number;
  /** Length of the given tick in seconds. Read on every tick, so tempo can change while running. */
  tickDuration: (tick: number) => number;
  /** Called ahead of time for every tick, with the exact audio-clock time it should sound at. */
  onTick: (tick: number, time: number) => void;
  /** How far ahead of the audio clock ticks are scheduled. */
  lookaheadSec?: number;
  /** How often the scheduler wakes up to look for ticks to schedule. */
  intervalMs?: number;
  setIntervalFn?: (handler: () => void, ms: number) => number;
  clearIntervalFn?: (id: number) => void;
}

/**
 * Lookahead scheduler: a coarse timer wakes up often and schedules every tick
 * that falls inside a short window, using the audio clock for the exact times.
 * Timer jitter therefore never reaches the audio, and the tempo cannot drift.
 */
export class Scheduler {
  private readonly now: () => number;
  private readonly tickDuration: (tick: number) => number;
  private readonly onTick: (tick: number, time: number) => void;
  private readonly lookaheadSec: number;
  private readonly intervalMs: number;
  private readonly setIntervalFn: (handler: () => void, ms: number) => number;
  private readonly clearIntervalFn: (id: number) => void;

  private timerId: number | null = null;
  private nextTick = 0;
  private nextTime = 0;

  constructor(options: SchedulerOptions) {
    this.now = options.now;
    this.tickDuration = options.tickDuration;
    this.onTick = options.onTick;
    this.lookaheadSec = options.lookaheadSec ?? 0.1;
    this.intervalMs = options.intervalMs ?? 25;
    this.setIntervalFn =
      options.setIntervalFn ?? ((handler, ms) => window.setInterval(handler, ms));
    this.clearIntervalFn = options.clearIntervalFn ?? ((id) => window.clearInterval(id));
  }

  get isRunning(): boolean {
    return this.timerId !== null;
  }

  /** Starts from tick 0. The first tick sounds `startDelaySec` from now. */
  start(startDelaySec = 0.06): void {
    this.stop();
    this.nextTick = 0;
    this.nextTime = this.now() + startDelaySec;
    this.timerId = this.setIntervalFn(() => this.pump(), this.intervalMs);
    this.pump();
  }

  stop(): void {
    if (this.timerId === null) return;
    this.clearIntervalFn(this.timerId);
    this.timerId = null;
  }

  /** Schedules every tick that falls inside the lookahead window. */
  private pump(): void {
    const horizon = this.now() + this.lookaheadSec;
    while (this.nextTime < horizon) {
      this.onTick(this.nextTick, this.nextTime);
      this.nextTime += this.tickDuration(this.nextTick);
      this.nextTick += 1;
    }
  }
}

export interface TickPosition {
  /** Ticks since the start. */
  tick: number;
  /** Index inside the bar: 0-7 in 4/4, 0-5 in 3/4 and 6/8. */
  slot: number;
  slotsPerBar: number;
  /** Zero-based beat inside the bar. */
  beat: number;
  beatsPerBar: number;
  /** True when the tick lands on a beat (not on an "and"). */
  isBeat: boolean;
  /** Zero-based bar number. */
  bar: number;
  /** True on beat 1 of each bar. */
  isDownbeat: boolean;
}

interface Meter {
  slotsPerBar: number;
  beatsPerBar: number;
  slotsPerBeat: number;
}

/*
 * In 4/4 and 3/4 the beat is a quarter note and each beat has two eighth-note slots.
 * In 6/8 the click counts the six eighth notes directly.
 */
const METERS: Readonly<Record<TimeSignature, Meter>> = {
  "4/4": { slotsPerBar: 8, beatsPerBar: 4, slotsPerBeat: 2 },
  "3/4": { slotsPerBar: 6, beatsPerBar: 3, slotsPerBeat: 2 },
  "6/8": { slotsPerBar: 6, beatsPerBar: 6, slotsPerBeat: 1 },
};

export function meterOf(timeSignature: TimeSignature): Meter {
  return METERS[timeSignature];
}

/** Seconds per tick (one eighth-note slot) at a tempo. */
export function tickSeconds(bpm: number, timeSignature: TimeSignature): number {
  return 60 / bpm / METERS[timeSignature].slotsPerBeat;
}

export function positionAt(tick: number, timeSignature: TimeSignature): TickPosition {
  const meter = METERS[timeSignature];
  const slot = tick % meter.slotsPerBar;
  return {
    tick,
    slot,
    slotsPerBar: meter.slotsPerBar,
    beat: Math.floor(slot / meter.slotsPerBeat),
    beatsPerBar: meter.beatsPerBar,
    isBeat: slot % meter.slotsPerBeat === 0,
    bar: Math.floor(tick / meter.slotsPerBar),
    isDownbeat: slot === 0,
  };
}

export const MIN_BPM = 40;
export const MAX_BPM = 200;

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return MIN_BPM;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}
