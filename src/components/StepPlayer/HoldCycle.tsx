import type { HoldCycle as HoldCycleData } from "../../domain/types";
import ui from "../../styles/ui.module.css";
import styles from "./StepPlayer.module.css";

export interface HoldPhase {
  phase: "hold" | "rest" | "done";
  /** 1-based repetition. */
  rep: number;
  /** Whole seconds left in the current phase. */
  secondsLeft: number;
}

/** Where a hold-and-release exercise stands after `elapsedMs`. */
export function holdPhaseAt(cycle: HoldCycleData, elapsedMs: number): HoldPhase {
  const cycleMs = (cycle.holdSec + cycle.restSec) * 1000;
  const totalMs = cycleMs * cycle.reps;
  if (elapsedMs >= totalMs) return { phase: "done", rep: cycle.reps, secondsLeft: 0 };
  const rep = Math.floor(elapsedMs / cycleMs) + 1;
  const inCycle = elapsedMs % cycleMs;
  const holdMs = cycle.holdSec * 1000;
  if (inCycle < holdMs) {
    return { phase: "hold", rep, secondsLeft: Math.ceil((holdMs - inCycle) / 1000) };
  }
  return { phase: "rest", rep, secondsLeft: Math.ceil((cycleMs - inCycle) / 1000) };
}

const PHASE_LABEL: Record<HoldPhase["phase"], string> = {
  hold: "Hold",
  rest: "Relax",
  done: "Done",
};

export function HoldCycle({ cycle, elapsedMs }: { cycle: HoldCycleData; elapsedMs: number }) {
  const state = holdPhaseAt(cycle, elapsedMs);
  const holding = state.phase === "hold";
  return (
    <div className={holding ? `${styles.hold} ${styles.holdLive}` : styles.hold}>
      <p className={ui.eyebrow}>
        Round {state.rep} of {cycle.reps}
      </p>
      <p className={styles.holdPhase}>
        {PHASE_LABEL[state.phase]}
        {state.phase !== "done" && <span className={styles.holdSeconds}>{state.secondsLeft}</span>}
      </p>
      <p className={ui.muted}>
        {holding
          ? "Press the chord and keep every string ringing."
          : state.phase === "rest"
            ? "Take your hand off the neck and shake it out."
            : "Well done. Rest your hand."}
      </p>
    </div>
  );
}
