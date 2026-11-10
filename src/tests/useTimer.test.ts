import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTimer } from "../hooks/useTimer";

describe("useTimer", () => {
  let clock = 0;
  const now = () => clock;
  /** Moves the fake clock and lets the refresh interval fire. */
  const advance = (ms: number) => {
    act(() => {
      clock += ms;
      vi.advanceTimersByTime(ms);
    });
  };

  beforeEach(() => {
    clock = 1000;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle with the full duration", () => {
    const { result } = renderHook(() => useTimer({ durationSec: 10, now }));
    expect(result.current.status).toBe("idle");
    expect(result.current.remainingSec).toBe(10);
    expect(result.current.progress).toBe(0);
  });

  it("counts down", () => {
    const { result } = renderHook(() => useTimer({ durationSec: 10, now }));
    act(() => result.current.start());
    advance(3000);
    expect(result.current.status).toBe("running");
    expect(result.current.remainingSec).toBe(7);
    expect(result.current.progress).toBeCloseTo(0.3);
  });

  it("uses clock deltas, not tick counts", () => {
    const { result } = renderHook(() => useTimer({ durationSec: 60, now }));
    act(() => result.current.start());
    // A throttled tab: 30 s pass on the clock but the interval fires only once.
    act(() => {
      clock += 30000;
      vi.advanceTimersByTime(200);
    });
    expect(result.current.remainingSec).toBe(30);
  });

  it("pauses and resumes without losing or gaining time", () => {
    const { result } = renderHook(() => useTimer({ durationSec: 10, now }));
    act(() => result.current.start());
    advance(4000);
    act(() => result.current.pause());
    expect(result.current.status).toBe("paused");
    advance(60000);
    expect(result.current.remainingSec).toBe(6);
    act(() => result.current.resume());
    advance(2000);
    expect(result.current.status).toBe("running");
    expect(result.current.remainingSec).toBe(4);
  });

  it("completes exactly once", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer({ durationSec: 2, now, onComplete }));
    act(() => result.current.start());
    advance(1900);
    expect(onComplete).not.toHaveBeenCalled();
    advance(200);
    expect(result.current.status).toBe("done");
    expect(result.current.remainingMs).toBe(0);
    expect(result.current.progress).toBe(1);
    advance(5000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("resets to idle and can take a new duration", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer({ durationSec: 5, now, onComplete }));
    act(() => result.current.start());
    advance(3000);
    act(() => result.current.reset());
    expect(result.current.status).toBe("idle");
    expect(result.current.remainingSec).toBe(5);
    act(() => result.current.reset(20));
    expect(result.current.remainingSec).toBe(20);
    advance(30000);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("can run again after completing", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer({ durationSec: 1, now, onComplete }));
    act(() => result.current.start());
    advance(1200);
    act(() => result.current.start());
    expect(result.current.status).toBe("running");
    advance(1200);
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});
