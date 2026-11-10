import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon/Icon";
import { TabFretboard, type FretNote } from "../components/TabFretboard/TabFretboard";
import { SHEET_STORAGE_KEY } from "../data/sheetStorage";
import { TAB_LIBRARY } from "../data/tabLibrary";
import { buildChordSheet } from "../domain/tabChords";
import { useProgress } from "../hooks/useProgress";
import "../styles/alphatab.css";
import ui from "../styles/ui.module.css";
import {
  alphaTabPaths,
  loadAlphaTab,
  type AlphaTabApi,
  type AlphaTabModule,
  type Score,
} from "../tab/alphaTabLoader";
import page from "./Page.module.css";
import styles from "./TabPlayer.module.css";

const SPEEDS = [0.5, 0.75, 1, 1.25] as const;
const FILE_TYPES = ".gp,.gp3,.gp4,.gp5,.gpx,.gp7,.musicxml,.mxl,.xml";

interface TrackInfo {
  index: number;
  name: string;
  /** MIDI note of each open string, thickest first; empty for drums and the like. */
  tuning: number[];
  maxFret: number;
}

interface SongInfo {
  title: string;
  artist: string;
  tempo: number;
  bars: number;
  tracks: TrackInfo[];
  chordSheet: string | null;
}

function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Reads a CSS colour token so the notation matches the current theme. */
function token(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function describeSong(score: Score): SongInfo {
  const tracks = score.tracks.map((track) => {
    const staff = track.staves[0];
    // The file lists strings thinnest first; the fretboard wants thickest first.
    const tuning = staff && staff.isStringed ? [...staff.tuning].reverse() : [];
    let maxFret = 0;
    for (const bar of staff?.bars ?? []) {
      for (const voice of bar.voices) {
        for (const beat of voice.beats) {
          for (const note of beat.notes) maxFret = Math.max(maxFret, note.fret);
        }
      }
    }
    return { index: track.index, name: track.name || `Track ${track.index + 1}`, tuning, maxFret };
  });
  return {
    title: score.title || "Untitled",
    artist: score.artist || score.subTitle || "",
    tempo: score.tempo,
    bars: score.masterBars.length,
    tracks,
    chordSheet: buildChordSheet(score),
  };
}

export default function TabPlayer() {
  const navigate = useNavigate();
  const { settings } = useProgress();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const apiRef = useRef<AlphaTabApi | null>(null);
  const moduleRef = useRef<AlphaTabModule | null>(null);
  const trackRef = useRef(0);

  const [engine, setEngine] = useState<"loading" | "ready" | "failed">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [song, setSong] = useState<SongInfo | null>(null);
  const [soundReady, setSoundReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ current: 0, end: 0 });
  const [notes, setNotes] = useState<FretNote[]>([]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [muted, setMuted] = useState<number[]>([]);
  const [solo, setSolo] = useState<number[]>([]);
  const [speed, setSpeed] = useState<number>(1);
  const [looping, setLooping] = useState(false);
  const [countIn, setCountIn] = useState(false);
  const [click, setClick] = useState(false);
  const [tabOnly, setTabOnly] = useState(false);
  const [range, setRange] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });
  const [libraryId, setLibraryId] = useState<string | null>(TAB_LIBRARY[0]?.id ?? null);

  useEffect(() => {
    document.title = song ? `${song.title} · Tab player · Chordwise` : "Tab player · Chordwise";
  }, [song]);

  // Start the engine once. Everything it reports comes back through events.
  useEffect(() => {
    let cancelled = false;
    let api: AlphaTabApi | null = null;

    loadAlphaTab()
      .then((alphaTab) => {
        const surface = surfaceRef.current;
        if (cancelled || !surface) return;
        moduleRef.current = alphaTab;
        const paths = alphaTabPaths();
        const ink = token("--ink-hi", "#e6e8e9");
        const quiet = token("--ink", "#8f9498");
        const line = token("--line", "#3d4144");

        api = new alphaTab.AlphaTabApi(surface, {
          core: {
            scriptFile: paths.script,
            fontDirectory: paths.fontDirectory,
          },
          display: {
            scale: 0.9,
            resources: {
              mainGlyphColor: ink,
              secondaryGlyphColor: quiet,
              scoreInfoColor: ink,
              barNumberColor: quiet,
              staffLineColor: line,
              barSeparatorColor: quiet,
            },
          },
          player: {
            enablePlayer: true,
            soundFont: paths.soundFont,
            scrollElement: scrollRef.current ?? undefined,
            enableCursor: true,
            enableUserInteraction: true,
          },
        });
        apiRef.current = api;

        api.error.on((error) => {
          setMessage(
            `That file could not be read (${error.message || "unknown format"}). Guitar Pro 3 to 7 and MusicXML files are supported.`,
          );
        });
        api.scoreLoaded.on((score) => {
          const info = describeSong(score);
          const first = info.tracks.find((track) => track.tuning.length > 0) ?? info.tracks[0];
          trackRef.current = first?.index ?? 0;
          setSong(info);
          setTrackIndex(trackRef.current);
          setMuted([]);
          setSolo([]);
          setNotes([]);
          setRange({ a: null, b: null });
          setTime({ current: 0, end: 0 });
          setMessage(null);
        });
        api.playerReady.on(() => setSoundReady(true));
        api.playerStateChanged.on((event) => {
          const isPlaying = event.state === alphaTab.synth.PlayerState.Playing;
          setPlaying(isPlaying);
          if (!isPlaying) setNotes([]);
        });
        api.playerPositionChanged.on((event) => {
          setTime((previous) =>
            // The position arrives many times a second; redraw only when the shown second changes.
            Math.floor(previous.current / 250) === Math.floor(event.currentTime / 250) &&
            previous.end === event.endTime
              ? previous
              : { current: event.currentTime, end: event.endTime },
          );
        });
        api.activeBeatsChanged.on((event) => {
          const sounding: FretNote[] = [];
          for (const beat of event.activeBeats) {
            if (beat.voice.bar.staff.track.index !== trackRef.current) continue;
            for (const note of beat.notes) {
              if (!note.isTieDestination) sounding.push({ string: note.string, fret: note.fret });
            }
          }
          setNotes(sounding);
        });

        setEngine("ready");
        const first = TAB_LIBRARY[0];
        if (first) api.tex(first.tex);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setEngine("failed");
        setMessage(error instanceof Error ? error.message : "The tab player could not start.");
      });

    return () => {
      cancelled = true;
      api?.destroy();
      apiRef.current = null;
    };
  }, []);

  // The app's volume and mute settings apply to the tab player too.
  useEffect(() => {
    const api = apiRef.current;
    if (api && engine === "ready") api.masterVolume = settings.muted ? 0 : settings.volume;
  }, [settings.volume, settings.muted, engine]);

  const withApi = useCallback((action: (api: AlphaTabApi) => void) => {
    const api = apiRef.current;
    if (api) action(api);
  }, []);

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      setLibraryId(null);
      setMessage(null);
      withApi((api) => api.load(data));
    } catch {
      setMessage("That file could not be opened.");
    }
  };

  const loadTune = (id: string) => {
    const tune = TAB_LIBRARY.find((candidate) => candidate.id === id);
    if (!tune) return;
    setLibraryId(id);
    setMessage(null);
    withApi((api) => api.tex(tune.tex));
  };

  const chooseTrack = (index: number) => {
    trackRef.current = index;
    setTrackIndex(index);
    setNotes([]);
    withApi((api) => {
      const track = api.score?.tracks[index];
      if (track) api.renderTracks([track]);
    });
  };

  const toggleIn = (list: number[], index: number) =>
    list.includes(index) ? list.filter((item) => item !== index) : [...list, index];

  const toggleMute = (index: number) => {
    const next = toggleIn(muted, index);
    setMuted(next);
    withApi((api) => {
      const track = api.score?.tracks[index];
      if (track) api.changeTrackMute([track], next.includes(index));
    });
  };

  const toggleSolo = (index: number) => {
    const next = toggleIn(solo, index);
    setSolo(next);
    withApi((api) => {
      const track = api.score?.tracks[index];
      if (track) api.changeTrackSolo([track], next.includes(index));
    });
  };

  const changeSpeed = (value: number) => {
    setSpeed(value);
    withApi((api) => {
      api.playbackSpeed = value;
    });
  };

  const toggleLoop = () => {
    const next = !looping;
    setLooping(next);
    withApi((api) => {
      api.isLooping = next;
    });
  };

  const toggleCountIn = () => {
    const next = !countIn;
    setCountIn(next);
    withApi((api) => {
      api.countInVolume = next ? 1 : 0;
    });
  };

  const toggleClick = () => {
    const next = !click;
    setClick(next);
    withApi((api) => {
      api.metronomeVolume = next ? 1 : 0;
    });
  };

  const toggleTabOnly = () => {
    const next = !tabOnly;
    setTabOnly(next);
    const alphaTab = moduleRef.current;
    withApi((api) => {
      if (!alphaTab) return;
      api.settings.display.staveProfile = next
        ? alphaTab.StaveProfile.Tab
        : alphaTab.StaveProfile.Default;
      api.updateSettings();
      api.render();
    });
  };

  /** A-B practice: mark the start, mark the end, and that stretch plays (and loops if Loop is on). */
  const markRange = (edge: "a" | "b") => {
    withApi((api) => {
      const tick = api.tickPosition;
      const next = edge === "a" ? { a: tick, b: null } : { a: range.a, b: tick };
      setRange(next);
      if (next.a !== null && next.b !== null && next.b > next.a) {
        api.playbackRange = { startTick: next.a, endTick: next.b };
      } else {
        api.playbackRange = null;
      }
    });
  };

  const clearRange = () => {
    setRange({ a: null, b: null });
    withApi((api) => {
      api.playbackRange = null;
    });
  };

  const openChordSheet = () => {
    if (!song?.chordSheet) return;
    try {
      window.localStorage.setItem(SHEET_STORAGE_KEY, song.chordSheet);
    } catch {
      // Without storage the sheet cannot be handed over.
      return;
    }
    navigate("/songs");
  };

  const track = song?.tracks.find((candidate) => candidate.index === trackIndex);
  const canPlay = engine === "ready" && soundReady && song !== null;
  const rangeSet = range.a !== null && range.b !== null && range.b > range.a;

  return (
    <div className={page.page}>
      <header className={page.header}>
        <p className={ui.eyebrow}>Play a song</p>
        <h1>Tab player</h1>
        <p className={page.lead}>
          Open a Guitar Pro file or pick a tune. The tab plays with a moving cursor, and the neck
          below lights up with every note.
        </p>
        <ul className={ui.row}>
          <li>
            <Link className={ui.chipButton} to="/songs">
              Chord sheet
            </Link>
          </li>
          <li>
            <span className={ui.chipButton} aria-current="page" data-current="true">
              Tab player
            </span>
          </li>
        </ul>
      </header>

      <section className={page.panel} aria-labelledby="tab-open-title">
        <h2 id="tab-open-title">Open a song</h2>
        <div className={ui.row}>
          <button
            type="button"
            className={ui.primary}
            onClick={() => fileRef.current?.click()}
            disabled={engine !== "ready"}
          >
            Import a file
          </button>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept={FILE_TYPES}
            aria-label="Guitar Pro or MusicXML file"
            tabIndex={-1}
            onChange={(event) => {
              void openFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <p className={ui.muted}>Guitar Pro (.gp, .gp3, .gp4, .gp5, .gpx) or MusicXML.</p>
        </div>
        <div className={page.field}>
          <p className={ui.eyebrow} id="tab-library-label">
            Or play a tune from the library
          </p>
          <ul className={ui.row} aria-labelledby="tab-library-label">
            {TAB_LIBRARY.map((tune) => (
              <li key={tune.id}>
                <button
                  type="button"
                  className={ui.chipButton}
                  aria-pressed={libraryId === tune.id}
                  disabled={engine !== "ready"}
                  onClick={() => loadTune(tune.id)}
                >
                  {tune.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className={ui.muted}>
          Files you import stay on this device. The library holds public-domain tunes only.
        </p>
      </section>

      {message && (
        <p className={page.hint} role="alert">
          {message}
        </p>
      )}

      <section className={styles.player} aria-labelledby="tab-song-title">
        <div className={styles.transport}>
          <div className={styles.titles}>
            <h2 id="tab-song-title" className={styles.songTitle}>
              {song ? song.title : engine === "failed" ? "Tab player unavailable" : "Loading…"}
            </h2>
            {song && (
              <p className={ui.muted}>
                {[song.artist, `${song.tempo} BPM`, `${song.bars} bars`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
          <div className={styles.buttons}>
            <button
              type="button"
              className={ui.primary}
              disabled={!canPlay}
              onClick={() => withApi((api) => api.playPause())}
              aria-label={playing ? "Pause" : "Play"}
            >
              <Icon name={playing ? "pause" : "play"} />
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              className={ui.button}
              disabled={!canPlay}
              onClick={() => withApi((api) => api.stop())}
            >
              <Icon name="stop" />
              Stop
            </button>
            <output className={styles.time} aria-label="Position">
              {formatTime(time.current)} / {formatTime(time.end)}
            </output>
          </div>
          <input
            className={ui.range}
            type="range"
            min={0}
            max={Math.max(1, time.end)}
            value={Math.min(time.current, Math.max(1, time.end))}
            disabled={!canPlay}
            aria-label="Seek"
            onChange={(event) => {
              const value = Number(event.target.value);
              setTime((previous) => ({ ...previous, current: value }));
              withApi((api) => {
                api.timePosition = value;
              });
            }}
          />
          {engine === "ready" && !soundReady && (
            <p className={ui.muted} role="status">
              Loading the sounds…
            </p>
          )}
        </div>

        <div className={styles.controls} role="group" aria-label="Practice controls">
          <div className={styles.control}>
            <label htmlFor="tab-speed" className={ui.eyebrow}>
              Speed
            </label>
            <select
              id="tab-speed"
              className={page.select}
              value={speed}
              onChange={(event) => changeSpeed(Number(event.target.value))}
            >
              {SPEEDS.map((value) => (
                <option key={value} value={value}>
                  {Math.round(value * 100)}%
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={ui.chipButton}
            aria-pressed={looping}
            onClick={toggleLoop}
          >
            Loop
          </button>
          <button
            type="button"
            className={ui.chipButton}
            aria-pressed={countIn}
            onClick={toggleCountIn}
          >
            Count-in
          </button>
          <button
            type="button"
            className={ui.chipButton}
            aria-pressed={click}
            onClick={toggleClick}
          >
            Click
          </button>
          <button
            type="button"
            className={ui.chipButton}
            aria-pressed={tabOnly}
            onClick={toggleTabOnly}
          >
            Tab only
          </button>
          <div className={styles.control}>
            <span className={ui.eyebrow} id="tab-range-label">
              Section {rangeSet ? "(set)" : ""}
            </span>
            <div className={ui.row} role="group" aria-labelledby="tab-range-label">
              <button
                type="button"
                className={ui.chipButton}
                aria-pressed={range.a !== null}
                onClick={() => markRange("a")}
                title="Mark the start of the section at the current position"
              >
                Set A
              </button>
              <button
                type="button"
                className={ui.chipButton}
                aria-pressed={rangeSet}
                disabled={range.a === null}
                onClick={() => markRange("b")}
                title="Mark the end of the section at the current position"
              >
                Set B
              </button>
              <button
                type="button"
                className={ui.chipButton}
                disabled={range.a === null}
                onClick={clearRange}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {song && song.tracks.length > 1 && (
          <ul className={styles.tracks} aria-label="Tracks">
            {song.tracks.map((item) => (
              <li key={item.index} className={styles.track}>
                <button
                  type="button"
                  className={ui.chipButton}
                  aria-pressed={item.index === trackIndex}
                  onClick={() => chooseTrack(item.index)}
                  title="Show this track"
                >
                  {item.name}
                </button>
                <button
                  type="button"
                  className={ui.chipButton}
                  aria-pressed={muted.includes(item.index)}
                  aria-label={`Mute ${item.name}`}
                  onClick={() => toggleMute(item.index)}
                >
                  M
                </button>
                <button
                  type="button"
                  className={ui.chipButton}
                  aria-pressed={solo.includes(item.index)}
                  aria-label={`Solo ${item.name}`}
                  onClick={() => toggleSolo(item.index)}
                >
                  S
                </button>
              </li>
            ))}
          </ul>
        )}

        {song?.chordSheet && (
          <div className={ui.row}>
            <button type="button" className={ui.button} onClick={openChordSheet}>
              Open the chords on the song sheet
              <Icon name="arrow" />
            </button>
            <p className={ui.muted}>This file names its chords; see their diagrams and hands.</p>
          </div>
        )}

        <div ref={scrollRef} className={styles.scroll}>
          <div ref={surfaceRef} className={styles.surface} />
        </div>

        {track && track.tuning.length > 0 && (
          <div className={styles.neck}>
            <p className={ui.eyebrow}>Fretboard · {track.name}</p>
            <TabFretboard
              tuning={track.tuning}
              notes={notes}
              frets={Math.min(24, Math.max(12, track.maxFret))}
            />
          </div>
        )}
        <p className={ui.muted}>
          Drag across the tab to select a section, or tap a note to jump there.
        </p>
      </section>
    </div>
  );
}
