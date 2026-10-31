import { useId } from 'react';
import type { Gate, GateId } from '../../types';
import { ru } from '../../i18n/ru';
import styles from './GatePicker.module.css';

interface Props {
  gates: Gate[];
  value: GateId | null;
  onChange: (id: GateId) => void;
  onLocate: () => void;
  locating: boolean;
}

/** Выбор ворот вручную и кнопка «Где я?». */
export function GatePicker({ gates, value, onChange, onLocate, locating }: Props) {
  const labelId = useId();
  return (
    <div>
      <p className={styles.label} id={labelId}>
        {ru.gatesLabel}
      </p>
      <div className={styles.row} role="group" aria-labelledby={labelId}>
        {gates.map((g) => (
          <button
            key={g.id}
            type="button"
            className={styles.btn}
            aria-pressed={g.id === value}
            onClick={() => onChange(g.id)}
          >
            {g.short}
          </button>
        ))}
      </div>
      <button type="button" className={styles.locate} onClick={onLocate} disabled={locating}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 1v3M12 20v3M1 12h3M20 12h3" stroke="currentColor" strokeWidth="2" />
        </svg>
        {locating ? ru.locating : ru.locate}
      </button>
    </div>
  );
}
