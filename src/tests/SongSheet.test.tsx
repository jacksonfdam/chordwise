import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SongSheet from "../pages/SongSheet";

const SHEET = `[Verse]
G          Em
Some words go here
C     D/F#
And some more`;

function paste(text: string) {
  fireEvent.change(screen.getByLabelText("Chord sheet text"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Show how to play" }));
}

const panel = () => screen.getByRole("complementary", { name: "Chords in this song" });
const chipNames = () =>
  within(panel())
    .getAllByRole("button", { name: /^Show / })
    .map((button) => button.getAttribute("aria-label"));

describe("SongSheet page", () => {
  it("starts with an empty editor and no song", () => {
    render(<SongSheet />);
    expect(screen.getByRole("button", { name: "Show how to play" })).toBeDisabled();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("shows a diagram for every chord in a pasted sheet", () => {
    render(<SongSheet />);
    paste(SHEET);
    expect(chipNames()).toEqual([
      "Show G, G major",
      "Show Em, E minor",
      "Show C, C major",
      "Show D/F#, D major",
    ]);
    expect(within(panel()).getAllByRole("img").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText("Some words go here")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "[Verse]" })).toBeInTheDocument();
  });

  it("selects a chord when it is tapped in the song", () => {
    render(<SongSheet />);
    paste(SHEET);
    const inSong = screen.getByRole("button", { name: "Em" });
    fireEvent.click(inSong);
    expect(inSong).toHaveAttribute("aria-pressed", "true");
    expect(within(panel()).getByRole("button", { name: "Show Em, E minor" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("transposes the song and its diagrams", () => {
    render(<SongSheet />);
    paste(SHEET);
    fireEvent.click(screen.getByRole("button", { name: "Transpose up one semitone" }));
    expect(chipNames()).toEqual([
      "Show G#, G# major",
      "Show Fm, F minor",
      "Show C#, C# major",
      "Show D#/G, D# major",
    ]);
    fireEvent.click(screen.getByRole("button", { name: /Use flats/ }));
    expect(chipNames()[0]).toBe("Show Ab, Ab major");
  });

  it("remembers the sheet and can clear it", () => {
    const first = render(<SongSheet />);
    paste(SHEET);
    first.unmount();
    render(<SongSheet />);
    expect(chipNames()).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("explains when no chords are found", () => {
    render(<SongSheet />);
    paste("Just some words\nand nothing else");
    expect(screen.getByRole("status")).toHaveTextContent("No chord names were found");
  });
});
