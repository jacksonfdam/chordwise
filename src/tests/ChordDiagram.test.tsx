import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChordDiagram } from "../components/ChordDiagram/ChordDiagram";
import { getChord } from "../data/chords";

function dots(container: HTMLElement) {
  return container.querySelectorAll("[data-dot]");
}

describe("ChordDiagram", () => {
  it("renders one dot per fretted string for an open chord", () => {
    const { container } = render(<ChordDiagram chord={getChord("Em")} />);
    expect(dots(container)).toHaveLength(2);
    expect(container.querySelectorAll('[data-marker="open"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-marker="muted"]')).toHaveLength(0);
  });

  it("marks muted and open strings", () => {
    const { container } = render(<ChordDiagram chord={getChord("D")} />);
    expect(dots(container)).toHaveLength(3);
    expect(container.querySelectorAll('[data-marker="muted"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-marker="open"]')).toHaveLength(1);
  });

  it("draws a barre as one bar instead of separate dots", () => {
    const { container } = render(<ChordDiagram chord={getChord("F-barre")} />);
    expect(container.querySelectorAll("[data-barre]")).toHaveLength(1);
    // Fingers 2, 3 and 4 keep their own dots; the three notes under the barre do not.
    expect(dots(container)).toHaveLength(3);
  });

  it("has a generated aria-label describing the fingering", () => {
    render(<ChordDiagram chord={getChord("Em")} />);
    expect(
      screen.getByRole("img", {
        name: "E minor chord. Low E string open. A string, fret 2, finger 2. D string, fret 2, finger 3. G string open. B string open. High E string open.",
      }),
    ).toBeInTheDocument();
  });

  it("offers a text table alternative", () => {
    render(<ChordDiagram chord={getChord("Am")} />);
    const table = screen.getByRole("table");
    expect(table).toHaveTextContent("Low E");
    expect(table).toHaveTextContent("Muted");
    expect(screen.getAllByRole("row")).toHaveLength(7);
  });

  it("shows finger numbers by default and hides them on request", () => {
    const { container, rerender } = render(<ChordDiagram chord={getChord("C")} />);
    expect(container.querySelector("[data-dot] text")).not.toBeNull();
    rerender(<ChordDiagram chord={getChord("C")} showFingerNumbers={false} />);
    expect(container.querySelector("[data-dot] text")).toBeNull();
  });

  it("highlights the requested fingers and dims the others", () => {
    const { container } = render(<ChordDiagram chord={getChord("C")} highlightFingers={[1]} />);
    expect(container.querySelector('[data-dot="1"]')).toHaveClass("hot");
    expect(container.querySelector('[data-dot="2"]')).toHaveClass("dim");
    expect(container.querySelector('[data-dot="3"]')).toHaveClass("dim");
  });

  it("shows a fret label instead of the nut for shapes up the neck", () => {
    const { container } = render(<ChordDiagram chord={getChord("D5")} />);
    expect(container).toHaveTextContent("5fr");
  });
});
