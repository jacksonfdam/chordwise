import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { TabFretboard } from "../components/TabFretboard/TabFretboard";
import { TAB_LIBRARY } from "../data/tabLibrary";
import { buildChordSheet, chordsPerBar, type ScoreLike } from "../domain/tabChords";
import { parseChordSheet } from "../domain/chordSheet";
import TabPlayer from "../pages/TabPlayer";

vi.mock("../tab/alphaTabLoader", () => ({
  loadAlphaTab: () => Promise.reject(new Error("The tab engine could not be downloaded.")),
  alphaTabPaths: () => ({ script: "", fontDirectory: "", soundFont: "" }),
}));

/** Length of one alphaTex note as a fraction of a whole note. */
function noteLength(token: string): number {
  const match = /^\d+\.\d+\.(\d+)(\{d\})?$/.exec(token);
  if (!match?.[1]) throw new Error(`Unexpected note: ${token}`);
  const base = 1 / Number(match[1]);
  return match[2] ? base * 1.5 : base;
}

describe("tab library", () => {
  it.each(TAB_LIBRARY.map((tune) => [tune.title, tune] as const))(
    "%s fills every bar exactly",
    (_title, tune) => {
      const body = tune.tex.split("\n.\n")[1] ?? "";
      const bars = body.split("|").map((bar) => bar.trim().split(/\s+/));
      expect(bars.length).toBeGreaterThanOrEqual(8);
      bars.forEach((bar, index) => {
        const total = bar.reduce((sum, token) => sum + noteLength(token), 0);
        expect(total, `bar ${index + 1}`).toBeCloseTo(1, 6);
      });
    },
  );

  it("declares a title, a credit and a tempo for each tune", () => {
    for (const tune of TAB_LIBRARY) {
      expect(tune.tex).toContain(`\\title "${tune.title}"`);
      expect(tune.tex).toContain(`\\tempo ${tune.bpm}`);
      expect(tune.credit.length).toBeGreaterThan(0);
    }
    expect(new Set(TAB_LIBRARY.map((tune) => tune.id)).size).toBe(TAB_LIBRARY.length);
  });

  it("only uses frets a beginner can reach on the three thinnest strings", () => {
    for (const tune of TAB_LIBRARY) {
      for (const [, fret, string] of tune.tex.matchAll(/(\d+)\.(\d+)\.\d+/g)) {
        expect(Number(fret)).toBeLessThanOrEqual(5);
        expect(Number(string)).toBeLessThanOrEqual(3);
      }
    }
  });
});

function score(bars: (string | null)[][], sections: Record<number, string> = {}): ScoreLike {
  const chords = new Map<string, { name: string }>();
  for (const name of bars.flat()) if (name) chords.set(name, { name });
  return {
    title: "Test Song",
    artist: "Someone",
    masterBars: bars.map((_, index) => ({
      section: sections[index] ? { text: sections[index] } : null,
    })),
    tracks: [
      { staves: [{ chords: null, bars: [] }] },
      {
        staves: [
          {
            chords,
            bars: bars.map((bar) => ({
              voices: [{ beats: bar.map((name) => ({ chordId: name })) }],
            })),
          },
        ],
      },
    ],
  };
}

describe("chords from a tab file", () => {
  it("lists the chords of each bar, skipping repeats inside a bar", () => {
    const bars = chordsPerBar(score([["G", null, "G", "D"], [null], ["Em"]]));
    expect(bars).toEqual([["G", "D"], [], ["Em"]]);
  });

  it("returns null when the file names no chords", () => {
    expect(buildChordSheet(score([[null], [null]]))).toBeNull();
    expect(buildChordSheet({ title: "", artist: "", masterBars: [], tracks: [] })).toBeNull();
  });

  it("writes four bars per line, with % for a repeated bar and sections in brackets", () => {
    const sheet = buildChordSheet(
      score([[null], ["G"], [null], ["C", "D"], ["Em"], ["C"]], { 0: "Intro", 4: "Verse" }),
    );
    expect(sheet).toBe(
      [
        "Test Song by Someone",
        "",
        "[Intro]",
        "| N.C. | G | % | C D |",
        "",
        "[Verse]",
        "| Em | C |",
      ].join("\n"),
    );
  });

  it("produces a sheet the chord sheet page can read", () => {
    const sheet = buildChordSheet(score([["G"], ["D/F#"], [null], ["Em"]], { 0: "Chorus" })) ?? "";
    const parsed = parseChordSheet(sheet);
    expect(parsed.symbols).toEqual(["G", "D/F#", "Em"]);
    expect(parsed.lines.some((line) => line.kind === "section")).toBe(true);
  });
});

describe("TabFretboard", () => {
  it("is quiet when nothing is playing", () => {
    const { container } = render(<TabFretboard notes={[]} />);
    expect(container.querySelectorAll("[data-note]")).toHaveLength(0);
    expect(screen.getByRole("img")).toHaveAccessibleName("Fretboard. No note is sounding.");
  });

  it("lights the sounding notes and names them", () => {
    const { container } = render(
      <TabFretboard
        notes={[
          { string: 6, fret: 3 },
          { string: 1, fret: 0 },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-note]")).toHaveLength(2);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Fretboard. Now playing: G on the E string, fret 3; E on the E string, open.",
    );
  });

  it("ignores notes outside the drawn neck", () => {
    const { container } = render(
      <TabFretboard
        notes={[
          { string: 2, fret: 19 },
          { string: 9, fret: 1 },
        ]}
        frets={12}
      />,
    );
    expect(container.querySelectorAll("[data-note]")).toHaveLength(0);
  });

  it("follows the tuning of the track", () => {
    render(<TabFretboard tuning={[38, 45, 50, 55, 59, 64]} notes={[{ string: 1, fret: 2 }]} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/E on the D string, fret 2/);
  });
});

describe("TabPlayer page", () => {
  it("explains when the tab engine cannot be loaded and keeps the controls off", async () => {
    render(
      <MemoryRouter>
        <TabPlayer />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be downloaded");
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Import a file" })).toBeDisabled();
    expect(screen.getByRole("heading", { name: "Tab player unavailable" })).toBeInTheDocument();
  });

  it("links back to the chord sheet", () => {
    render(
      <MemoryRouter>
        <TabPlayer />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Chord sheet" })).toHaveAttribute("href", "/songs");
  });
});
