import type { Entrance } from '../../types';
import { ru } from '../../i18n/ru';
import styles from './EntrancePicker.module.css';

interface Props {
  entrances: Entrance[];
  value: string;
  onChange: (id: string) => void;
}

/** Переключатель входа в корпус. Меняет и маршрут на карте, и маршрут внутри. */
export function EntrancePicker({ entrances, value, onChange }: Props) {
  if (entrances.length < 2) return null;
  return (
    <div className={styles.row} role="group" aria-label={ru.entranceLabel}>
      {entrances.map((e) => (
        <button
          key={e.id}
          type="button"
          className={styles.btn}
          aria-pressed={e.id === value}
          onClick={() => onChange(e.id)}
        >
          {e.label}
        </button>
      ))}
    </div>
  );
}
