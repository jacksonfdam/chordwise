import { useCallback, useEffect, useRef, useState } from "react";

export type TimerStatus = "idle" | "running" | "paused" | "done";

export interface TimerOptions {
  durationSec: number;
  /** Called exactly once each time the countdown reaches zero. */
  onComplete?: () => void;
  /** Clock in milliseconds; injectable for tests. */
  now?: () => number;
  /** How often the display refreshes. The countdown itself never depends on this. */
  refreshMs?: number;
}

export interface TimerControls {
  status: TimerStatus;
  durationMs: number;
  elapsedMs: number;
  remainingMs: number;
  /** Whole seconds left, rounded up, so the display shows 1 until the very end. */
  remainingSec: number;
  /** 0 at the start, 1 when done. */
  progress: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  /** Back to idle. Pass a duration to change the length of the next countdown. */
  reset: (durationSec?: number) => void;
}

const defaultNow = () => performance.now();

/**
 * Countdown timer based on clock deltas. Elapsed time is always computed from
 * performance.now(), never by counting interval ticks, so a throttled or
 * sleeping tab cannot make it run slow.
 */
export function useTimer(options: TimerOptions): TimerControls {
  const { now = defaultNow, refreshMs = 200 } = options;
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [durationMs, setDurationMs] = useState(() => Math.max(0, options.durationSec * 1000));
  const [elapsedMs, setElapsedMs] = useState(0);

  const onCompleteRef = useRef(options.onComplete);
  useEffect(() => {
    onCompleteRef.current = options.onComplete;
  });

  // Time banked before the current run, and when the current run began.
  const bankedRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const durationRef = useRef(durationMs);

  const readElapsed = useCallback(() => {
    const running = startedAtRef.current === null ? 0 : now() - startedAtRef.current;
    return Math.min(durationRef.current, bankedRef.current + running);
  }, [now]);

  useEffect(() => {
    if (status !== "running") return;
    const refresh = () => {
      // Already finished or paused; a late interval tick must not complete twice.
      if (startedAtRef.current === null) return;
      const elapsed = readElapsed();
      setElapsedMs(elapsed);
      if (elapsed >= durationRef.current) {
        bankedRef.current = durationRef.current;
        startedAtRef.current = null;
        setStatus("done");
        onCompleteRef.current?.();
      }
    };
    const id = window.setInterval(refresh, refreshMs);
    // A tab coming back to the foreground catches up immediately.
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [status, readElapsed, refreshMs]);

  const start = useCallback(() => {
    bankedRef.current = 0;
    startedAtRef.current = now();
    setElapsedMs(0);
    setStatus("running");
  }, [now]);

  const pause = useCallback(() => {
    if (startedAtRef.current === null) return;
    bankedRef.current = readElapsed();
    startedAtRef.current = null;
    setElapsedMs(bankedRef.current);
    setStatus("paused");
  }, [readElapsed]);

  const resume = useCallback(() => {
    if (startedAtRef.current !== null || bankedRef.current >= durationRef.current) return;
    startedAtRef.current = now();
    setStatus("running");
  }, [now]);

  const reset = useCallback((durationSec?: number) => {
    if (durationSec !== undefined) {
      durationRef.current = Math.max(0, durationSec * 1000);
      setDurationMs(durationRef.current);
    }
    bankedRef.current = 0;
    startedAtRef.current = null;
    setElapsedMs(0);
    setStatus("idle");
  }, []);

  const remainingMs = Math.max(0, durationMs - elapsedMs);
  return {
    status,
    durationMs,
    elapsedMs,
    remainingMs,
    remainingSec: Math.ceil(remainingMs / 1000),
    progress: durationMs === 0 ? 1 : Math.min(1, elapsedMs / durationMs),
    start,
    pause,
    resume,
    reset,
  };
}
