import { useEffect, useMemo, useState } from "react";
import { GLOSSARY } from "../data/glossary";
import ui from "../styles/ui.module.css";
import styles from "./Glossary.module.css";
import page from "./Page.module.css";

const slug = (term: string) => `term-${term.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
const KNOWN_TERMS = new Set(GLOSSARY.map((entry) => entry.term));

export default function Glossary() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "Glossary · Chordwise";
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return GLOSSARY;
    return GLOSSARY.filter(
      (entry) =>
        entry.term.toLowerCase().includes(needle) ||
        entry.definition.toLowerCase().includes(needle),
    );
  }, [query]);

  return (
    <div className={page.page}>
      <header className={page.header}>
        <p className={ui.eyebrow}>Reference</p>
        <h1>Glossary</h1>
        <p className={page.lead}>Every guitar word used in the lessons, in plain English.</p>
      </header>

      <div className={page.toolbar}>
        <div className={page.field}>
          <label htmlFor="glossary-search" className={ui.eyebrow}>
            Search the glossary
          </label>
          <input
            id="glossary-search"
            className={ui.input}
            type="search"
            placeholder="Try: fret, barre, BPM"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <p className={ui.muted} role="status">
          {visible.length} of {GLOSSARY.length} terms
        </p>
      </div>

      {visible.length === 0 ? (
        <p className={page.empty}>No terms match “{query}”.</p>
      ) : (
        <dl className={styles.list}>
          {visible.map((entry) => (
            <div key={entry.term} id={slug(entry.term)} className={styles.entry}>
              <dt className={styles.term}>{entry.term}</dt>
              <dd className={styles.definition}>
                <p>{entry.definition}</p>
                {entry.seeAlso && entry.seeAlso.length > 0 && (
                  <p className={styles.seeAlso}>
                    See also:{" "}
                    {entry.seeAlso.map((term, index) => (
                      <span key={term}>
                        {index > 0 && ", "}
                        {KNOWN_TERMS.has(term) ? (
                          <a href={`#${slug(term)}`} onClick={() => setQuery("")}>
                            {term}
                          </a>
                        ) : (
                          term
                        )}
                      </span>
                    ))}
                  </p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
