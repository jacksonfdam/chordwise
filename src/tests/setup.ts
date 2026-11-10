import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { progressStore } from "../hooks/useProgress";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  progressStore.reload();
});
