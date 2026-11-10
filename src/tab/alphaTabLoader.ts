import type * as AlphaTab from "@coderline/alphatab";

export type AlphaTabModule = typeof AlphaTab;
export type AlphaTabApi = AlphaTab.AlphaTabApi;
export type Score = AlphaTab.model.Score;
export type Track = AlphaTab.model.Track;

/** Where scripts/copy-alphatab.mjs puts the tab player's runtime files. */
export const ALPHATAB_BASE = "/alphatab/";
const SCRIPT_URL = `${ALPHATAB_BASE}alphaTab.min.js`;

let pending: Promise<AlphaTabModule> | null = null;

function readGlobal(): AlphaTabModule | undefined {
  return (window as unknown as { alphaTab?: AlphaTabModule }).alphaTab;
}

/**
 * Loads the tab engine on first use. It is a large script, so it is fetched
 * only when the tab player is opened and never ends up in the app bundle.
 */
export function loadAlphaTab(): Promise<AlphaTabModule> {
  const ready = readGlobal();
  if (ready) return Promise.resolve(ready);
  pending ??= new Promise<AlphaTabModule>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const loaded = readGlobal();
      if (loaded) resolve(loaded);
      else reject(new Error("The tab engine loaded but did not start."));
    };
    script.onerror = () => {
      pending = null;
      reject(new Error("The tab engine could not be downloaded. Check your connection."));
    };
    document.head.appendChild(script);
  });
  return pending;
}

/**
 * Full addresses of the engine's files. They must be absolute: the engine
 * starts background workers, which cannot resolve a path like "/alphatab/".
 */
export function alphaTabPaths(): { script: string; fontDirectory: string; soundFont: string } {
  const absolute = (path: string) => new URL(path, window.location.origin).href;
  return {
    script: absolute(SCRIPT_URL),
    fontDirectory: absolute(`${ALPHATAB_BASE}font/`),
    soundFont: absolute(`${ALPHATAB_BASE}soundfont/sonivox.sf2`),
  };
}
