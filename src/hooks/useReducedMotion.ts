import { useEffect, useSyncExternalStore } from "react";
import { useProgress } from "./useProgress";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => undefined;
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function systemPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

/** True when animations should be skipped: the system asks for it, or the user chose it. */
export function useReducedMotion(): boolean {
  const system = useSyncExternalStore(subscribe, systemPrefersReducedMotion, () => false);
  const { settings } = useProgress();
  if (settings.motion === "reduce") return true;
  if (settings.motion === "full") return false;
  return system;
}

/** Mirrors the motion decision onto <html data-motion> so CSS can gate every animation. */
export function useMotionAttribute(): void {
  const reduced = useReducedMotion();
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduce" : "full";
  }, [reduced]);
}
