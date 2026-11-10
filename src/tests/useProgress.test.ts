import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  CURRENT_VERSION,
  DEFAULT_SETTINGS,
  defaultProgress,
  loadProgress,
  migrate,
  progressStore,
  STORAGE_KEY,
  useProgress,
} from "../hooks/useProgress";

function stored(): unknown {
  const text = window.localStorage.getItem(STORAGE_KEY);
  return text === null ? null : JSON.parse(text);
}

describe("useProgress", () => {
  beforeEach(() => {
    window.localStorage.clear();
    progressStore.reload();
  });

  it("starts from defaults when nothing is stored", () => {
    const { result } = renderHook(() => useProgress());
    expect(result.current.lessons).toEqual({});
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.current.version).toBe(CURRENT_VERSION);
  });

  it("writes lesson progress to localStorage", () => {
    const { result } = renderHook(() => useProgress());
    act(() => result.current.setStepReached("beginner-04-em-am", 3));
    expect(result.current.lessons["beginner-04-em-am"]).toEqual({
      lastStepIndex: 3,
      completed: false,
      completedAt: null,
    });
    expect(stored()).toMatchObject({
      version: 1,
      lessons: { "beginner-04-em-am": { lastStepIndex: 3, completed: false } },
    });
  });

  it("marks a lesson complete once and keeps the date", () => {
    const { result } = renderHook(() => useProgress());
    act(() => result.current.completeLesson("a"));
    const first = result.current.lessons.a?.completedAt;
    expect(result.current.lessons.a?.completed).toBe(true);
    expect(first).toEqual(expect.any(String));
    act(() => result.current.completeLesson("a"));
    expect(result.current.lessons.a?.completedAt).toBe(first);
  });

  it("reads previously stored progress", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        lessons: {
          a: { lastStepIndex: 2, completed: true, completedAt: "2026-01-02T03:04:05.000Z" },
        },
        drillStats: {},
        settings: { ...DEFAULT_SETTINGS, leftHanded: true },
      }),
    );
    progressStore.reload();
    const { result } = renderHook(() => useProgress());
    expect(result.current.lessons.a?.completed).toBe(true);
    expect(result.current.settings.leftHanded).toBe(true);
  });

  it("shares updates between hook instances", () => {
    const first = renderHook(() => useProgress());
    const second = renderHook(() => useProgress());
    act(() => first.result.current.updateSettings({ muted: true }));
    expect(second.result.current.settings.muted).toBe(true);
  });

  it("records drill rounds", () => {
    const { result } = renderHook(() => useProgress());
    act(() => result.current.recordDrillRound("em-am", { clean: true, streak: 4, bpm: 64 }));
    act(() => result.current.recordDrillRound("em-am", { clean: false, streak: 2, bpm: 90 }));
    expect(result.current.drillStats["em-am"]).toMatchObject({
      rounds: 2,
      cleanRounds: 1,
      bestStreak: 4,
      bestBpm: 64,
    });
  });

  it("resets progress but keeps settings", () => {
    const { result } = renderHook(() => useProgress());
    act(() => {
      result.current.completeLesson("a");
      result.current.updateSettings({ leftHanded: true });
    });
    act(() => result.current.resetProgress());
    expect(result.current.lessons).toEqual({});
    expect(result.current.settings.leftHanded).toBe(true);
  });
});

describe("stored progress loading", () => {
  const storageWith = (text: string | null) => ({ getItem: () => text });

  it("falls back to defaults on corrupted JSON", () => {
    expect(loadProgress(storageWith("{not json"))).toEqual(defaultProgress());
  });

  it("falls back to defaults on the wrong shape", () => {
    expect(loadProgress(storageWith('"just a string"'))).toEqual(defaultProgress());
    expect(loadProgress(storageWith("[1,2,3]"))).toEqual(defaultProgress());
    expect(loadProgress(storageWith("null"))).toEqual(defaultProgress());
  });

  it("falls back to defaults when storage throws", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadProgress(broken)).toEqual(defaultProgress());
  });

  it("drops invalid entries and clamps bad values", () => {
    const state = migrate({
      version: 1,
      lessons: {
        good: { lastStepIndex: 4, completed: true, completedAt: "2026-05-01T10:00:00.000Z" },
        negative: { lastStepIndex: -3, completed: "yes", completedAt: 12 },
        junk: "nope",
      },
      drillStats: { "em-am": { rounds: "many" } },
      settings: { volume: 9, motion: "sideways", leftHanded: true },
    });
    expect(state.lessons.good).toEqual({
      lastStepIndex: 4,
      completed: true,
      completedAt: "2026-05-01T10:00:00.000Z",
    });
    expect(state.lessons.negative).toEqual({
      lastStepIndex: 0,
      completed: false,
      completedAt: null,
    });
    expect(state.lessons.junk).toBeUndefined();
    expect(state.drillStats["em-am"]?.rounds).toBe(0);
    expect(state.settings).toEqual({ ...DEFAULT_SETTINGS, volume: 1, leftHanded: true });
  });

  it("migrates version 0 data", () => {
    const state = migrate({ completedLessons: ["a", "b", 7], settings: { muted: true } });
    expect(state.version).toBe(1);
    expect(Object.keys(state.lessons)).toEqual(["a", "b"]);
    expect(state.lessons.a).toEqual({ lastStepIndex: 0, completed: true, completedAt: null });
    expect(state.settings.muted).toBe(true);
  });

  it("ignores data from a newer version", () => {
    expect(migrate({ version: 99, lessons: { a: { completed: true } } })).toEqual(
      defaultProgress(),
    );
  });
});
