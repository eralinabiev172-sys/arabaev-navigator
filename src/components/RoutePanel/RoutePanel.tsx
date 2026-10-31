import { ru } from '../../i18n/ru';
import styles from './RoutePanel.module.css';

interface Props {
  from: string | null;
  to: string;
  meters: number | null;
  minutes: number | null;
  onClear: () => void;
}

/** Карточка маршрута по территории: откуда → куда, метры и минуты. */
export function RoutePanel({ from, to, meters, minutes, onClear }: Props) {
  return (
    <section className={styles.card} aria-live="polite">
      <div className={styles.head}>
        <div className={styles.places}>
          {from && (
            <span className={styles.from}>
              {ru.routeFrom}: {from}
            </span>
          )}
          <span className={styles.to}>
            <span className="visually-hidden">{ru.routeTo}: </span>
            {to}
          </span>
        </div>
        <button
          type="button"
          className={styles.clear}
          onClick={onClear}
          aria-label={ru.changeTarget}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" />
          </svg>
        </button>
      </div>
      {meters !== null && minutes !== null ? (
        <p className={styles.summary}>{ru.routeSummary(meters, minutes)}</p>
      ) : (
        <p className={styles.hint}>{from ? ru.routeNotFound : ru.chooseGate}</p>
      )}
    </section>
  );
}
