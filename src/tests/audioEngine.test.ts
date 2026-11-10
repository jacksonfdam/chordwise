import { describe, expect, it, vi } from "vitest";
import { AudioEngine, karplusStrong } from "../audio/audioEngine";
import { getChord } from "../data/chords";

function seededRandom(seed = 1): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

/** Similarity of a signal with itself shifted by `lag` samples: 1 means perfectly periodic. */
function selfSimilarity(samples: Float32Array, lag: number): number {
  let cross = 0;
  let energy = 0;
  for (let i = 0; i + lag < samples.length; i += 1) {
    const a = samples[i] ?? 0;
    const b = samples[i + lag] ?? 0;
    cross += a * b;
    energy += a * a;
  }
  return energy === 0 ? 0 : cross / energy;
}

describe("karplusStrong", () => {
  it("produces a normalized signal of the requested length", () => {
    const samples = karplusStrong(110, 44100, 0.5, seededRandom());
    expect(samples).toHaveLength(22050);
    const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    expect(peak).toBeGreaterThan(0.9);
    expect(peak).toBeLessThanOrEqual(1);
  });

  it("decays over time and ends in silence", () => {
    const samples = karplusStrong(196, 44100, 1.5, seededRandom());
    const energy = (from: number, to: number) => {
      let sum = 0;
      for (let i = from; i < to; i += 1) sum += (samples[i] ?? 0) ** 2;
      return sum;
    };
    expect(energy(0, 4410)).toBeGreaterThan(energy(44100, 48510) * 2);
    expect(samples[samples.length - 1]).toBeCloseTo(0, 9);
  });

  it("rings at the requested pitch", () => {
    const sampleRate = 44100;
    const samples = karplusStrong(220, sampleRate, 1, seededRandom()).subarray(8820, 30870);
    const period = Math.round(sampleRate / 220);
    // One period later the wave looks the same; half a period later it does not.
    expect(selfSimilarity(samples, period)).toBeGreaterThan(0.9);
    expect(selfSimilarity(samples, Math.round(period / 2))).toBeLessThan(0.6);
  });
});

function createFakeContext() {
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  });
  const node = () => {
    const self = { connect: vi.fn(() => self) };
    return self;
  };
  const starts: number[] = [];
  const context = {
    state: "suspended" as AudioContextState,
    currentTime: 10,
    sampleRate: 8000,
    destination: {},
    onstatechange: null as (() => void) | null,
    resume: vi.fn(async () => {
      context.state = "running";
    }),
    createGain: vi.fn(() => ({ ...node(), gain: param() })),
    createBiquadFilter: vi.fn(() => ({ ...node(), type: "lowpass", frequency: param() })),
    createOscillator: vi.fn(() => ({
      ...node(),
      type: "sine",
      frequency: param(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createBuffer: vi.fn((_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    })),
    createBufferSource: vi.fn(() => ({
      ...node(),
      buffer: null,
      start: vi.fn((when: number) => starts.push(when)),
    })),
  };
  return { context, starts };
}

describe("AudioEngine", () => {
  it("creates the context lazily and resumes it on unlock", async () => {
    const { context } = createFakeContext();
    const factory = vi.fn(() => context as unknown as AudioContext);
    const engine = new AudioEngine(factory);
    expect(factory).not.toHaveBeenCalled();
    await expect(engine.unlock()).resolves.toBe(true);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(engine.getStatus()).toBe("running");
    await engine.unlock();
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("stays silent before a user gesture unlocks audio", () => {
    const { context, starts } = createFakeContext();
    const engine = new AudioEngine(() => context as unknown as AudioContext);
    engine.strumChord(getChord("Em"));
    expect(starts).toEqual([]);
  });

  it("strums the sounding strings in order, skipping muted ones", async () => {
    const { context, starts } = createFakeContext();
    const engine = new AudioEngine(() => context as unknown as AudioContext);
    await engine.unlock();
    engine.strumChord(getChord("D"), { direction: "D", speedMs: 25 });
    expect(starts).toHaveLength(4);
    starts.forEach((time, index) => expect(time).toBeCloseTo(10 + index * 0.025, 6));
  });

  it("reports unsupported when no context can be created", async () => {
    const engine = new AudioEngine(() => undefined);
    await expect(engine.unlock()).resolves.toBe(false);
    expect(engine.getStatus()).toBe("unsupported");
  });

  it("notifies subscribers when the status changes", async () => {
    const { context } = createFakeContext();
    const engine = new AudioEngine(() => context as unknown as AudioContext);
    const listener = vi.fn();
    engine.subscribe(listener);
    await engine.unlock();
    expect(listener).toHaveBeenCalled();
  });
});
