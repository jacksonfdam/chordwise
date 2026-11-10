import { useEffect, useRef, useState } from "react";
import { useProgress, type MotionPreference } from "../../hooks/useProgress";
import ui from "../../styles/ui.module.css";
import { Icon } from "../Icon/Icon";
import styles from "./SettingsMenu.module.css";

const MOTION_OPTIONS: readonly { value: MotionPreference; label: string }[] = [
  { value: "system", label: "Follow my device" },
  { value: "reduce", label: "Reduce motion" },
  { value: "full", label: "Allow motion" },
];

/** The settings button and its dialog. */
export function SettingsMenu() {
  const { settings, updateSettings, resetProgress } = useProgress();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const open = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setConfirming(false);
    setResetDone(false);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  };
  const close = () => dialogRef.current?.close();

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <>
      <button type="button" className={ui.ghost} onClick={open} aria-haspopup="dialog">
        <Icon name="settings" />
        <span className={styles.label}>Settings</span>
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="settings-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={styles.body}>
          <header className={styles.header}>
            <h2 id="settings-title">Settings</h2>
            <button type="button" className={ui.ghost} onClick={close} aria-label="Close settings">
              <Icon name="close" />
            </button>
          </header>

          <div className={styles.field}>
            <label htmlFor="settings-volume" className={ui.eyebrow}>
              Volume: {Math.round(settings.volume * 100)}%
            </label>
            <input
              id="settings-volume"
              className={ui.range}
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(settings.volume * 100)}
              onChange={(event) => updateSettings({ volume: Number(event.target.value) / 100 })}
            />
          </div>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.muted}
              onChange={(event) => updateSettings({ muted: event.target.checked })}
            />
            <span>
              Mute all sound
              <small>Lessons still work; you just will not hear the chords or the click.</small>
            </span>
          </label>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.leftHanded}
              onChange={(event) => updateSettings({ leftHanded: event.target.checked })}
            />
            <span>
              Left-handed mode
              <small>Mirrors every chord diagram.</small>
            </span>
          </label>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.showFingerNumbers}
              onChange={(event) => updateSettings({ showFingerNumbers: event.target.checked })}
            />
            <span>
              Show finger numbers
              <small>Numbers inside the dots tell you which finger to use.</small>
            </span>
          </label>

          <div className={styles.field}>
            <label htmlFor="settings-motion" className={ui.eyebrow}>
              Animation
            </label>
            <select
              id="settings-motion"
              className={styles.select}
              value={settings.motion}
              onChange={(event) => {
                const choice = MOTION_OPTIONS.find((option) => option.value === event.target.value);
                if (choice) updateSettings({ motion: choice.value });
              }}
            >
              {MOTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.danger}>
            <p className={ui.eyebrow}>Progress</p>
            {confirming ? (
              <div className={styles.confirm} role="alertdialog" aria-labelledby="reset-question">
                <p id="reset-question">
                  Erase all lesson progress and drill stats? This cannot be undone.
                </p>
                <div className={ui.row}>
                  <button
                    type="button"
                    className={ui.button}
                    onClick={() => {
                      resetProgress();
                      setConfirming(false);
                      setResetDone(true);
                    }}
                  >
                    Yes, erase it
                  </button>
                  <button type="button" className={ui.primary} onClick={() => setConfirming(false)}>
                    Keep my progress
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className={ui.button} onClick={() => setConfirming(true)}>
                Reset progress
              </button>
            )}
            <p className={ui.muted} role="status">
              {resetDone ? "Progress erased. Your settings were kept." : ""}
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
