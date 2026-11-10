import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { SettingsMenu } from "../Settings/SettingsMenu";
import styles from "./Layout.module.css";

const NAV_ITEMS = [
  { to: "/lessons", label: "Lessons" },
  { to: "/chords", label: "Chords" },
  { to: "/tools", label: "Tools" },
  { to: "/glossary", label: "Glossary" },
] as const;

export function PageFallback() {
  return (
    <p className={styles.fallback} role="status">
      Loading…
    </p>
  );
}

export function Layout() {
  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label="Chordwise home">
          <span className={styles.brandDot} aria-hidden="true" />
          Chordwise
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.actions}>
          <SettingsMenu />
        </div>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className={styles.footer}>
        <p>Chordwise · practice a little every day</p>
      </footer>
    </div>
  );
}
