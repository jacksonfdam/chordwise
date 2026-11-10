import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StepPlayer, type StepPlayerProps } from "../components/StepPlayer/StepPlayer";
import type { Lesson } from "../domain/types";

const lesson: Lesson = {
  id: "test-lesson",
  order: 1,
  level: "beginner",
  title: "Test lesson",
  summary: "A short lesson for tests.",
  estimatedMinutes: 1,
  prerequisites: [],
  chordIds: ["Em"],
  goals: ["Play E minor."],
  steps: [
    { id: "s1", title: "Meet the chord", body: "Read this.", durationSec: 10, action: "read" },
    {
      id: "s2",
      title: "Place finger 2",
      body: "Put finger 2 down.",
      durationSec: 20,
      action: "place",
      chordId: "Em",
      highlightFingers: [2],
    },
    { id: "s3", title: "Why it works", body: "Read more.", durationSec: 5, action: "read" },
    {
      id: "s4",
      title: "Lesson recap",
      body: "All done.",
      durationSec: 5,
      action: "read",
      visual: "summary",
      checklist: ["I can play E minor."],
    },
  ],
};

function renderPlayer(props: Partial<StepPlayerProps> = {}) {
  const handlers = { onExit: vi.fn(), onStepChange: vi.fn(), onComplete: vi.fn() };
  render(
    <MemoryRouter>
      <StepPlayer lesson={lesson} {...handlers} {...props} />
    </MemoryRouter>,
  );
  return handlers;
}

const title = () => screen.getByRole("heading", { level: 2 }).textContent;
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("StepPlayer", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "performance", "Date"],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the first step with its position", () => {
    renderPlayer();
    expect(title()).toBe("Meet the chord");
    expect(screen.getByText(/Lesson 01 · Step 1 of 4/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  });

  it("moves forward and back with the buttons", () => {
    const { onStepChange } = renderPlayer();
    click("Next");
    expect(title()).toBe("Place finger 2");
    expect(onStepChange).toHaveBeenLastCalledWith(1);
    click("Previous");
    expect(title()).toBe("Meet the chord");
    expect(onStepChange).toHaveBeenLastCalledWith(0);
  });

  it("starts on the saved step", () => {
    renderPlayer({ initialStepIndex: 2 });
    expect(title()).toBe("Why it works");
  });

  it("announces step changes politely", () => {
    renderPlayer();
    click("Next");
    expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 4: Place finger 2");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("counts down while playing and pauses", () => {
    renderPlayer();
    click("Play timer");
    advance(3000);
    expect(screen.getByRole("timer")).toHaveAccessibleName(/^7 seconds left/);
    click("Pause timer");
    advance(5000);
    expect(screen.getByRole("timer")).toHaveAccessibleName(/^7 seconds left/);
  });

  it("auto-advances with a get-ready countdown before a hands-on step", () => {
    renderPlayer();
    click("Play timer");
    advance(10200);
    expect(title()).toBe("Place finger 2");
    expect(screen.getByText("Get ready")).toBeInTheDocument();
    advance(3200);
    expect(screen.queryByText("Get ready")).not.toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveAccessibleName(/running/);
  });

  it("auto-advances straight into a reading step", () => {
    renderPlayer({ initialStepIndex: 1 });
    click("Play timer");
    advance(20200);
    expect(title()).toBe("Why it works");
    expect(screen.queryByText("Get ready")).not.toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveAccessibleName(/running/);
  });

  it("stays on the step when auto-advance is off", () => {
    renderPlayer();
    click("Auto-advance");
    expect(screen.getByRole("button", { name: "Auto-advance" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    click("Play timer");
    advance(12000);
    expect(title()).toBe("Meet the chord");
    expect(screen.getByText(/Time is up/)).toBeInTheDocument();
  });

  it("completes the lesson once when the last step finishes", () => {
    const { onComplete } = renderPlayer({ initialStepIndex: 3 });
    expect(screen.getByText("What you learned")).toBeInTheDocument();
    click("Play timer");
    advance(5400);
    expect(onComplete).toHaveBeenCalledTimes(1);
    click("Finish");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Lesson complete.");
  });

  it("supports keyboard shortcuts", () => {
    const { onExit } = renderPlayer();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(title()).toBe("Place finger 2");
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(title()).toBe("Meet the chord");
    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByRole("button", { name: "Pause timer" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("ignores shortcuts while typing in a field", () => {
    renderPlayer({ initialStepIndex: 3 });
    const checkbox = screen.getByRole("checkbox");
    fireEvent.keyDown(checkbox, { key: "ArrowLeft" });
    fireEvent.keyDown(checkbox, { key: " " });
    expect(title()).toBe("Lesson recap");
    expect(screen.getByRole("button", { name: "Play timer" })).toBeInTheDocument();
  });

  it("highlights the step's fingers in the diagram", () => {
    const { container } = render(
      <MemoryRouter>
        <StepPlayer lesson={lesson} initialStepIndex={1} onExit={() => undefined} />
      </MemoryRouter>,
    );
    expect(container.querySelector('[data-dot="2"]')).toHaveClass("hot");
    expect(container.querySelector('[data-dot="3"]')).toHaveClass("dim");
  });
});
