import { soundingStrings } from "../domain/fretboard";
import type { Chord } from "../domain/types";

export type AudioStatus = "idle" | "suspended" | "running" | "unsupported";

export interface StrumOptions {
  direction?: "D" | "U";
  /** Delay between neighboring strings. */
  speedMs?: number;
  /** 0 to 1. */
  velocity?: number;
  /** Audio-clock time to start at; defaults to now. */
  when?: number;
  /** Damped "chuck": short, pitchless hit. */
  muted?: boolean;
}

export interface PluckOptions {
  when?: number;
  velocity?: number;
  muted?: boolean;
}

export interface ClickOptions {
  accent?: boolean;
  when?: number;
}

const PLUCK_SECONDS = 2.2;
const MUTED_PLUCK_SECONDS = 0.09;

/**
 * Karplus-Strong plucked string: a burst of noise circulates through a delay
 * line one period long, and a gentle averaging filter makes it decay like a
 * real string. Returns mono samples in the range -1 to 1.
 */
export function karplusStrong(
  frequency: number,
  sampleRate: number,
  durationSec: number,
  random: () => number = Math.random,
): Float32Array {
  const length = Math.max(1, Math.floor(sampleRate * durationSec));
  const period = Math.max(2, Math.round(sampleRate / frequency));
  const delay = new Float32Array(period);

  // Noise burst, lightly smoothed so the attack is warm instead of harsh.
  let previous = 0;
  for (let i = 0; i < period; i += 1) {
    const noise = random() * 2 - 1;
    previous = 0.5 * (noise + previous);
    delay[i] = previous;
  }

  const output = new Float32Array(length);
  // Higher notes lose energy on every (shorter) lap, so they get a feedback closer to 1.
  const feedback = 0.994 + Math.min(0.004, frequency / 200000);
  let index = 0;
  let peak = 0;
  for (let i = 0; i < length; i += 1) {
    const current = delay[index] ?? 0;
    const nextIndex = index + 1 === period ? 0 : index + 1;
    const next = delay[nextIndex] ?? 0;
    output[i] = current;
    delay[index] = feedback * 0.5 * (current + next);
    index = nextIndex;
    const magnitude = Math.abs(current);
    if (magnitude > peak) peak = magnitude;
  }

  // Normalize, then fade the tail so the sample never ends with a click.
  const gain = peak > 0 ? 1 / peak : 1;
  const fadeLength = Math.min(length, Math.floor(sampleRate * 0.05));
  for (let i = 0; i < length; i += 1) {
    const fromEnd = length - 1 - i;
    const fade = fromEnd < fadeLength ? fromEnd / fadeLength : 1;
    output[i] = (output[i] ?? 0) * gain * fade;
  }
  return output;
}

type AudioContextConstructor = new () => AudioContext;

function findAudioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const scope = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext;
}

type Listener = () => void;

/**
 * Owns the single AudioContext. The context is only created on a user gesture
 * (browsers, mobile Safari in particular, refuse to start audio otherwise).
 */
export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly listeners = new Set<Listener>();
  private volume = 0.8;
  private muted = false;
  private status: AudioStatus;

  constructor(private readonly createContext: () => AudioContext | undefined = defaultFactory) {
    this.status = findAudioContextConstructor() ? "idle" : "unsupported";
  }

  getStatus = (): AudioStatus => this.status;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Seconds on the audio clock, or a wall-clock fallback when audio is unavailable. */
  currentTime(): number {
    return this.context ? this.context.currentTime : performance.now() / 1000;
  }

  /**
   * Creates or resumes the AudioContext. Call from a user gesture (click, key press).
   * Resolves to true when sound can play.
   */
  async unlock(): Promise<boolean> {
    if (!this.context) {
      let created: AudioContext | undefined;
      try {
        created = this.createContext();
      } catch {
        created = undefined;
      }
      if (!created) {
        this.setStatus("unsupported");
        return false;
      }
      this.context = created;
      this.master = created.createGain();
      this.master.connect(created.destination);
      this.applyGain();
      created.onstatechange = () => this.syncStatus();
    }
    if (this.context.state !== "running") {
      try {
        await this.context.resume();
      } catch {
        // Stays suspended until the next gesture.
      }
    }
    this.syncStatus();
    return this.context.state === "running";
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.applyGain();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGain();
  }

  /** Plays one plucked note. */
  playString(frequency: number, options: PluckOptions = {}): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || context.state !== "running") return;

    const when = Math.max(options.when ?? 0, context.currentTime);
    const velocity = options.velocity ?? 0.8;
    const source = context.createBufferSource();
    source.buffer = this.bufferFor(context, frequency, options.muted ?? false);

    const gain = context.createGain();
    gain.gain.value = velocity * (options.muted ? 0.5 : 0.42);

    // Softer plucks are also darker, like a real string.
    const tone = context.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = options.muted ? 1400 : 1800 + velocity * 4200;

    source.connect(tone).connect(gain).connect(master);
    source.start(when);
  }

  /** Plays the sounding strings of a chord one after another, like a strum. */
  strumChord(chord: Pick<Chord, "frets">, options: StrumOptions = {}): void {
    const context = this.context;
    if (!context || context.state !== "running") return;
    const direction = options.direction ?? "D";
    const gap = (options.speedMs ?? 25) / 1000;
    const start = Math.max(options.when ?? 0, context.currentTime);
    const strings = soundingStrings(chord);
    const ordered = direction === "D" ? strings : [...strings].reverse();
    // Up-strums usually catch only the thinner strings.
    const played = direction === "U" ? ordered.slice(0, 4) : ordered;
    played.forEach((string, index) => {
      this.playString(string.frequency, {
        when: start + index * gap,
        velocity: options.velocity ?? 0.8,
        muted: options.muted,
      });
    });
  }

  /** Short metronome blip; the accent is higher and louder. */
  playClick(options: ClickOptions = {}): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || context.state !== "running") return;
    const when = Math.max(options.when ?? 0, context.currentTime);
    const accent = options.accent ?? false;

    const oscillator = context.createOscillator();
    oscillator.type = accent ? "square" : "sine";
    oscillator.frequency.value = accent ? 1568 : 1046.5;

    const gain = context.createGain();
    const peak = accent ? 0.22 : 0.3;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);

    oscillator.connect(gain).connect(master);
    oscillator.start(when);
    oscillator.stop(when + 0.06);
  }

  private bufferFor(context: AudioContext, frequency: number, muted: boolean): AudioBuffer {
    const key = `${muted ? "m" : "p"}:${frequency.toFixed(2)}`;
    const cached = this.buffers.get(key);
    if (cached) return cached;
    const samples = karplusStrong(
      frequency,
      context.sampleRate,
      muted ? MUTED_PLUCK_SECONDS : PLUCK_SECONDS,
    );
    const buffer = context.createBuffer(1, samples.length, context.sampleRate);
    buffer.getChannelData(0).set(samples);
    this.buffers.set(key, buffer);
    return buffer;
  }

  private applyGain(): void {
    if (!this.master || !this.context) return;
    const target = this.muted ? 0 : this.volume;
    this.master.gain.setTargetAtTime(target, this.context.currentTime, 0.015);
  }

  private syncStatus(): void {
    if (!this.context) return;
    this.setStatus(this.context.state === "running" ? "running" : "suspended");
  }

  private setStatus(status: AudioStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const listener of this.listeners) listener();
  }
}

function defaultFactory(): AudioContext | undefined {
  const Constructor = findAudioContextConstructor();
  return Constructor ? new Constructor() : undefined;
}

/** The app-wide engine. */
export const audioEngine = new AudioEngine();
