import { useCallback, useEffect, useRef, useState } from "react";
import { audioEngine } from "../audio/audioEngine";
import { positionAt, Scheduler, tickSeconds, type TickPosition } from "../audio/scheduler";
import type { TimeSignature } from "../domain/types";

export interface MetronomeOptions {
  bpm: number;
  timeSignature?: TimeSignature;
  /** Play the click sound. Defaults to true. */
  click?: boolean;
  /**
   * Called ahead of time for each tick with its exact audio-clock time.
   * Use it to schedule sound (strums) in perfect sync with the click.
   */
  onSchedule?: (position: TickPosition, time: number) => void;
  /** Called when a tick actually becomes audible. Use it for visuals and counters. */
  onTick?: (position: TickPosition) => void;
}

export interface MetronomeControls {
  isRunning: boolean;
  /** The tick that is sounding right now, or null when stopped. */
  position: TickPosition | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

interface QueuedTick {
  position: TickPosition;
  time: number;
}

/**
 * A metronome driven by the lookahead scheduler. Sound is scheduled on the
 * audio clock; the visual position follows the same clock, so what you see
 * and what you hear cannot drift apart.
 */
export function useMetronome(options: MetronomeOptions): MetronomeControls {
  const [isRunning, setIsRunning] = useState(false);
  const [position, setPosition] = useState<TickPosition | null>(null);

  // The scheduler reads the latest options on every tick without being restarted.
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const schedulerRef = useRef<Scheduler | null>(null);
  const queueRef = useRef<QueuedTick[]>([]);
  const frameRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    schedulerRef.current?.stop();
    schedulerRef.current = null;
    queueRef.current = [];
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setIsRunning(false);
    setPosition(null);
  }, []);

  const start = useCallback(() => {
    schedulerRef.current?.stop();
    queueRef.current = [];

    const signature = () => latest.current.timeSignature ?? "4/4";
    const scheduler = new Scheduler({
      now: () => audioEngine.currentTime(),
      tickDuration: () => tickSeconds(latest.current.bpm, signature()),
      onTick: (tick, time) => {
        const tickPosition = positionAt(tick, signature());
        if (tickPosition.isBeat && latest.current.click !== false) {
          audioEngine.playClick({ accent: tickPosition.isDownbeat, when: time });
        }
        latest.current.onSchedule?.(tickPosition, time);
        queueRef.current.push({ position: tickPosition, time });
      },
    });
    schedulerRef.current = scheduler;

    // Visuals follow the audio clock: a queued tick is shown once its time has come.
    const follow = () => {
      const now = audioEngine.currentTime();
      const queue = queueRef.current;
      let due: QueuedTick | undefined;
      while (queue[0] && queue[0].time <= now) {
        due = queue.shift();
        if (due) latest.current.onTick?.(due.position);
      }
      if (due) setPosition(due.position);
      frameRef.current = requestAnimationFrame(follow);
    };

    setIsRunning(true);
    // Must be called from a user gesture so the audio context may start.
    void audioEngine.unlock().finally(() => {
      if (schedulerRef.current !== scheduler) return;
      scheduler.start();
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(follow);
    });
  }, []);

  const toggle = useCallback(() => {
    if (schedulerRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => stop, [stop]);

  return { isRunning, position, start, stop, toggle };
}
