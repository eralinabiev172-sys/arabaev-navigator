import type { FloorStep } from '../../lib/floorRoute';
import { stepText } from '../../i18n/ru';
import styles from './StepList.module.css';

export function StepList({ steps }: { steps: FloorStep[] }) {
  return (
    <ol className={styles.list}>
      {steps.map((s, i) => (
        <li key={i} className={styles.item}>
          <span className={styles.n} aria-hidden="true">
            {i + 1}
          </span>
          <span>{stepText(s)}</span>
        </li>
      ))}
    </ol>
  );
}
