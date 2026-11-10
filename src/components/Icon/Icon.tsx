import type { ReactNode } from "react";

export type IconName =
  | "play"
  | "pause"
  | "previous"
  | "next"
  | "sound"
  | "auto"
  | "metronome"
  | "close"
  | "check"
  | "settings"
  | "arrow"
  | "stop";

const PATHS: Record<IconName, ReactNode> = {
  play: <path d="M8 5.5v13l10-6.5z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  previous: <path d="M15 5l-7 7 7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  sound: <path d="M4 10v4h3l5 4V6L7 10zM16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11" />,
  auto: (
    <path d="M4 12a8 8 0 0113.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 01-13.7 5.7L4 15.5M4 20v-4.5h4.5" />
  ),
  metronome: <path d="M9 3h6l4 18H5zM12 15l5-9M7.5 15h9" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  settings: <path d="M4 7h10M18 7h2M4 17h2M10 17h10M16 4.5v5M8 14.5v5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  stop: <path d="M7 7h10v10H7z" />,
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
