import { useMemo, useSyncExternalStore } from "react";

export const STORAGE_KEY = "chordwise:progress:v1";
export const CURRENT_VERSION = 1;

export interface LessonProgress {
  lastStepIndex: number;
  completed: boolean;
  /** ISO date string, or null while the lesson is unfinished. */
  completedAt: string | null;
}

export interface DrillStats {
  rounds: number;
  cleanRounds: number;
  bestStreak: number;
  bestBpm: number;
  lastPlayedAt: string | null;
}

export type MotionPreference = "system" | "reduce" | "full";

export interface Settings {
  /** 0 to 1. */
  volume: number;
  muted: boolean;
  leftHanded: boolean;
  showFingerNumbers: boolean;
  motion: MotionPreference;
}

export interface ProgressState {
  version: typeof CURRENT_VERSION;
  lessons: Record<string, LessonProgress>;
  drillStats: Record<string, DrillStats>;
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  volume: 0.8,
  muted: false,
  leftHanded: false,
  showFingerNumbers: true,
  motion: "system",
};

export function defaultProgress(): ProgressState {
  return {
    version: CURRENT_VERSION,
    lessons: {},
    drillStats: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function toDateString(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

function sanitizeLessons(value: unknown): Record<string, LessonProgress> {
  const lessons: Record<string, LessonProgress> = {};
  if (!isRecord(value)) return lessons;
  for (const [id, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    const completed = entry.completed === true;
    lessons[id] = {
      lastStepIndex: toCount(entry.lastStepIndex),
      completed,
      completedAt: completed ? toDateString(entry.completedAt) : null,
    };
  }
  return lessons;
}

function sanitizeDrillStats(value: unknown): Record<string, DrillStats> {
  const stats: Record<string, DrillStats> = {};
  if (!isRecord(value)) return stats;
  for (const [id, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    stats[id] = {
      rounds: toCount(entry.rounds),
      cleanRounds: toCount(entry.cleanRounds),
      bestStreak: toCount(entry.bestStreak),
      bestBpm: toCount(entry.bestBpm),
      lastPlayedAt: toDateString(entry.lastPlayedAt),
    };
  }
  return stats;
}

function sanitizeSettings(value: unknown): Settings {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS };
  const volume =
    typeof value.volume === "number" && Number.isFinite(value.volume)
      ? Math.min(1, Math.max(0, value.volume))
      : DEFAULT_SETTINGS.volume;
  const motion =
    value.motion === "reduce" || value.motion === "full" || value.motion === "system"
      ? value.motion
      : DEFAULT_SETTINGS.motion;
  return {
    volume,
    muted: typeof value.muted === "boolean" ? value.muted : DEFAULT_SETTINGS.muted,
    leftHanded:
      typeof value.leftHanded === "boolean" ? value.leftHanded : DEFAULT_SETTINGS.leftHanded,
    showFingerNumbers:
      typeof value.showFingerNumbers === "boolean"
        ? value.showFingerNumbers
        : DEFAULT_SETTINGS.showFingerNumbers,
    motion,
  };
}

/**
 * Upgrades stored data to the current shape.
 * Version 0 (no `version` field) kept finished lessons as `completedLessons: string[]`
 * and had no per-step position.
 */
export function migrate(raw: unknown): ProgressState {
  if (!isRecord(raw)) return defaultProgress();
  const version = typeof raw.version === "number" ? raw.version : 0;

  if (version > CURRENT_VERSION) {
    // Written by a newer release: do not guess at its shape.
    return defaultProgress();
  }

  if (version === 0) {
    const lessons: Record<string, LessonProgress> = {};
    if (Array.isArray(raw.completedLessons)) {
      for (const id of raw.completedLessons) {
        if (typeof id === "string") {
          lessons[id] = { lastStepIndex: 0, completed: true, completedAt: null };
        }
      }
    }
    return {
      version: CURRENT_VERSION,
      lessons,
      drillStats: {},
      settings: sanitizeSettings(raw.settings),
    };
  }

  return {
    version: CURRENT_VERSION,
    lessons: sanitizeLessons(raw.lessons),
    drillStats: sanitizeDrillStats(raw.drillStats),
    settings: sanitizeSettings(raw.settings),
  };
}

/** Reads and validates stored progress; any failure falls back to defaults. */
export function loadProgress(storage: Pick<Storage, "getItem"> | undefined): ProgressState {
  if (!storage) return defaultProgress();
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (text === null) return defaultProgress();
    return migrate(JSON.parse(text));
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(
  storage: Pick<Storage, "setItem"> | undefined,
  state: ProgressState,
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked (private mode). Progress then lasts for this visit only.
  }
}

function browserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

type Listener = () => void;

/** A tiny external store so every component sees the same progress. */
function createProgressStore() {
  let state: ProgressState | null = null;
  const listeners = new Set<Listener>();

  const getState = (): ProgressState => {
    state ??= loadProgress(browserStorage());
    return state;
  };

  const setState = (next: ProgressState) => {
    state = next;
    saveProgress(browserStorage(), next);
    for (const listener of listeners) listener();
  };

  return {
    getState,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(recipe: (current: ProgressState) => ProgressState) {
      setState(recipe(getState()));
    },
    /** Drops the cached state so the next read comes from storage again. */
    reload() {
      state = null;
      for (const listener of listeners) listener();
    },
  };
}

export const progressStore = createProgressStore();

export interface ProgressActions {
  /** Remembers the furthest step reached in a lesson. */
  setStepReached: (lessonId: string, stepIndex: number) => void;
  completeLesson: (lessonId: string) => void;
  recordDrillRound: (
    drillId: string,
    round: { clean: boolean; streak: number; bpm: number },
  ) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Clears lesson progress and drill stats but keeps the settings. */
  resetProgress: () => void;
}

const actions: ProgressActions = {
  setStepReached(lessonId, stepIndex) {
    progressStore.update((current) => {
      const previous = current.lessons[lessonId];
      if (previous && previous.lastStepIndex === stepIndex) return current;
      return {
        ...current,
        lessons: {
          ...current.lessons,
          [lessonId]: {
            lastStepIndex: stepIndex,
            completed: previous?.completed ?? false,
            completedAt: previous?.completedAt ?? null,
          },
        },
      };
    });
  },
  completeLesson(lessonId) {
    progressStore.update((current) => {
      const previous = current.lessons[lessonId];
      if (previous?.completed) return current;
      return {
        ...current,
        lessons: {
          ...current.lessons,
          [lessonId]: {
            lastStepIndex: previous?.lastStepIndex ?? 0,
            completed: true,
            completedAt: new Date().toISOString(),
          },
        },
      };
    });
  },
  recordDrillRound(drillId, round) {
    progressStore.update((current) => {
      const previous = current.drillStats[drillId];
      return {
        ...current,
        drillStats: {
          ...current.drillStats,
          [drillId]: {
            rounds: (previous?.rounds ?? 0) + 1,
            cleanRounds: (previous?.cleanRounds ?? 0) + (round.clean ? 1 : 0),
            bestStreak: Math.max(previous?.bestStreak ?? 0, round.streak),
            bestBpm: round.clean
              ? Math.max(previous?.bestBpm ?? 0, round.bpm)
              : (previous?.bestBpm ?? 0),
            lastPlayedAt: new Date().toISOString(),
          },
        },
      };
    });
  },
  updateSettings(patch) {
    progressStore.update((current) => ({
      ...current,
      settings: sanitizeSettings({ ...current.settings, ...patch }),
    }));
  },
  resetProgress() {
    progressStore.update((current) => ({ ...defaultProgress(), settings: current.settings }));
  },
};

export function useProgress(): ProgressState & ProgressActions {
  const state = useSyncExternalStore(progressStore.subscribe, progressStore.getState);
  return useMemo(() => ({ ...state, ...actions }), [state]);
}
