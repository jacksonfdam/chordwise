import { existsSync } from "node:fs";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HandDiagram, hasHandPicture } from "../components/HandDiagram/HandDiagram";
import { HandPicture } from "../components/HandDiagram/HandPicture";
import { PluckStrings } from "../components/StrumHand/PluckStrings";
import { StrumHand } from "../components/StrumHand/StrumHand";
import { CHORDS, getChord } from "../data/chords";

/** Every picture a component points at must exist in public/. */
function expectFileFor(image: HTMLImageElement) {
  const source = image.getAttribute("src") ?? "";
  expect(existsSync(`public${source}`), source).toBe(true);
}

describe("HandDiagram", () => {
  it("shows the hand picture for a chord that has one", () => {
    render(<HandDiagram chord={getChord("C")} />);
    const image = screen.getByRole("img", { name: /Fretting hand playing C major/ });
    expect(image).toHaveAttribute("src", "/hands/chord-c.webp");
    expectFileFor(image as HTMLImageElement);
  });

  it("renders nothing for a chord without a picture", () => {
    const { container } = render(<HandDiagram chord={getChord("Dsus4")} />);
    expect(container).toBeEmptyDOMElement();
    expect(hasHandPicture(getChord("Dsus4"))).toBe(false);
  });

  it("has a file for every chord it claims to cover", () => {
    const covered = CHORDS.filter((chord) => hasHandPicture(chord));
    expect(covered.map((chord) => chord.id).sort()).toEqual(
      ["A", "Am", "C", "D", "E", "Em", "F-barre", "G"].sort(),
    );
    for (const chord of covered) {
      const view = render(<HandDiagram chord={chord} />);
      expectFileFor(view.container.querySelector("img") as HTMLImageElement);
      view.unmount();
    }
  });

  it("points the learner to the diagram for exact positions", () => {
    render(<HandDiagram chord={getChord("Em")} />);
    expect(screen.getByText(/Use the diagram for the exact fingers and frets/)).toBeInTheDocument();
  });
});

describe("HandPicture", () => {
  it.each(["thumb-behind-neck", "picking-hand-position", "thumb-strum"] as const)(
    "shows the %s illustration with a text alternative",
    (name) => {
      render(<HandPicture name={name} />);
      const image = screen.getByRole("img");
      expect(image.getAttribute("alt")?.length).toBeGreaterThan(20);
      expectFileFor(image as HTMLImageElement);
    },
  );
});

describe("StrumHand", () => {
  const shown = (container: HTMLElement) =>
    container.querySelector(".frameOn")?.getAttribute("data-frame");

  it("rests until the pattern plays", () => {
    const { container } = render(<StrumHand stroke={null} />);
    expect(shown(container)).toBe("idle");
    expect(screen.getByTestId("strum-caption")).toHaveTextContent("Press start");
  });

  it("shows the picture and the words for each stroke", () => {
    const { container, rerender } = render(<StrumHand stroke="D" />);
    expect(shown(container)).toBe("down");
    expect(screen.getByTestId("strum-caption")).toHaveTextContent("Down-strum");
    rerender(<StrumHand stroke="U" />);
    expect(shown(container)).toBe("up");
    expect(screen.getByTestId("strum-caption")).toHaveTextContent("Up-strum");
    rerender(<StrumHand stroke="x" />);
    expect(shown(container)).toBe("down");
    expect(screen.getByTestId("strum-caption")).toHaveTextContent("Muted hit");
    rerender(<StrumHand stroke="-" />);
    expect(shown(container)).toBe("rest");
    expect(screen.getByTestId("strum-caption")).toHaveTextContent("Rest");
  });

  it("keeps all four pictures loaded and has a file for each", () => {
    const { container } = render(<StrumHand stroke={null} />);
    const frames = container.querySelectorAll("img");
    expect(frames).toHaveLength(4);
    frames.forEach((frame) => expectFileFor(frame));
    expect(container.querySelectorAll(".frameOn")).toHaveLength(1);
  });
});

describe("PluckStrings", () => {
  it("offers every sounding string and disables muted ones", () => {
    render(<PluckStrings chord={getChord("D")} />);
    expect(screen.getByRole("button", { name: "Pluck the D string: D" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Pluck the High E string: F#" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Low E string: muted, do not play it" }),
    ).toBeDisabled();
  });

  it("marks the string that was tapped", () => {
    const { container } = render(<PluckStrings chord={getChord("Em")} />);
    expect(container.querySelector("[data-on-string]")).toHaveAttribute("data-on-string", "none");
    fireEvent.click(screen.getByRole("button", { name: "Pluck the G string: G" }));
    expect(container.querySelector("[data-on-string]")).toHaveAttribute("data-on-string", "3");
    expect(screen.getByText(/G string\. It should ring clearly/)).toBeInTheDocument();
  });

  it("shows the picking illustration", () => {
    render(<PluckStrings chord={getChord("Em")} />);
    expectFileFor(screen.getByRole("img") as HTMLImageElement);
  });
});
