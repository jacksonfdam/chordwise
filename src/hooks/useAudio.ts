import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { audioEngine, type AudioStatus, type StrumOptions } from "../audio/audioEngine";
import type { Chord } from "../domain/types";
import { useProgress } from "./useProgress";

export interface AudioControls {
  status: AudioStatus;
  /** True when sound needs a tap before it can play (first visit, or after the tab slept). */
  needsUnlock: boolean;
  /** Call from a click or key press. */
  unlock: () => Promise<boolean>;
  /** Strums a chord right away. Safe to call from a gesture before audio is unlocked. */
  strum: (chord: Pick<Chord, "frets">, options?: StrumOptions) => void;
  pluck: (frequency: number) => void;
}

/** Keeps the engine's volume in step with the saved settings. Mount once, near the root. */
export function useAudioSettingsSync(): void {
  const { settings } = useProgress();
  useEffect(() => {
    audioEngine.setVolume(settings.volume);
    audioEngine.setMuted(settings.muted);
  }, [settings.volume, settings.muted]);
}

export function useAudio(): AudioControls {
  const status = useSyncExternalStore(audioEngine.subscribe, audioEngine.getStatus);

  const unlock = useCallback(() => audioEngine.unlock(), []);

  const strum = useCallback((chord: Pick<Chord, "frets">, options?: StrumOptions) => {
    if (audioEngine.getStatus() === "running") {
      audioEngine.strumChord(chord, options);
      return;
    }
    // Not running yet: this only succeeds inside a user gesture, which is exactly the rule we want.
    void audioEngine.unlock().then((ready) => {
      if (ready) audioEngine.strumChord(chord, options);
    });
  }, []);

  const pluck = useCallback((frequency: number) => {
    if (audioEngine.getStatus() === "running") {
      audioEngine.playString(frequency);
      return;
    }
    void audioEngine.unlock().then((ready) => {
      if (ready) audioEngine.playString(frequency);
    });
  }, []);

  return useMemo(
    () => ({
      status,
      needsUnlock: status === "idle" || status === "suspended",
      unlock,
      strum,
      pluck,
    }),
    [status, unlock, strum, pluck],
  );
}
