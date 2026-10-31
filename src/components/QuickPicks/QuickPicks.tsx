import type { Building } from '../../types';
import { ru } from '../../i18n/ru';
import styles from './QuickPicks.module.css';

interface Props {
  buildings: Building[];
  onBuilding: (id: string) => void;
  onLibraries: () => void;
}

/** Быстрые кнопки главного экрана: корпуса, библиотеки, столовая. */
export function QuickPicks({ buildings, onBuilding, onLibraries }: Props) {
  const korpuses = buildings.filter((b) => b.kind === 'korpus');
  const food = buildings.filter((b) => b.kind === 'food');
  const hasLibraries = buildings.some((b) => b.kind === 'library');
  return (
    <section aria-label={ru.quickTitle}>
      <p className={styles.label}>{ru.quickTitle}</p>
      <div className={styles.grid}>
        {korpuses.map((b) => (
          <button key={b.id} type="button" className={styles.btn} onClick={() => onBuilding(b.id)}>
            {b.label}
          </button>
        ))}
        {hasLibraries && (
          <button type="button" className={styles.btn} onClick={onLibraries}>
            {ru.quickLibraries}
          </button>
        )}
        {food.map((b) => (
          <button key={b.id} type="button" className={styles.btn} onClick={() => onBuilding(b.id)}>
            {b.label}
          </button>
        ))}
      </div>
    </section>
  );
}
