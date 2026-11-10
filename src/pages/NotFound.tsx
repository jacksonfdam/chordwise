import { Link } from "react-router-dom";
import ui from "../styles/ui.module.css";
import styles from "./NotFound.module.css";

export default function NotFound() {
  return (
    <section className={styles.wrap} aria-labelledby="not-found-title">
      <p className={ui.eyebrow}>Error 404</p>
      <h1 id="not-found-title">This fret is off the neck</h1>
      <p>The page you asked for does not exist. It may have moved, or the link was mistyped.</p>
      <div className={ui.row}>
        <Link className={ui.primary} to="/">
          Back to home
        </Link>
        <Link className={ui.button} to="/lessons">
          See the lessons
        </Link>
      </div>
    </section>
  );
}
