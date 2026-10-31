import type { Entrance, Floor, Room } from '../types';
import type { FloorRoute, ResolvedRoom } from '../lib/floorRoute';
import { FloorPlan } from '../components/FloorPlan/FloorPlan';
import { EntrancePicker } from '../components/EntrancePicker/EntrancePicker';
import { StepList } from '../components/StepList/StepList';
import { ru } from '../i18n/ru';
import styles from './FloorScreen.module.css';

export type FloorInfo =
  | { kind: 'hint' }
  | { kind: 'service' }
  | { kind: 'picked'; room: Room }
  | { kind: 'route'; resolved: ResolvedRoom; route: FloorRoute };

interface Props {
  floor: Floor;
  title: string;
  entranceId: string;
  info: FloorInfo;
  selectedRoom: string | null;
  pickedRoom: string | null;
  onEntrance: (id: string) => void;
  onRoomClick: (number: string) => void;
  onServiceClick: () => void;
  onRouteHere: (number: string) => void;
  onBack: () => void;
}

/** Экран плана этажа: план на весь экран, переключатель входа и подсказки. */
export function FloorScreen(props: Props) {
  const { floor, title, entranceId, info, selectedRoom, pickedRoom } = props;
  const route = info.kind === 'route' ? info.route.points : null;
  const entrances: Entrance[] = floor.entrances;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <button type="button" className={styles.back} onClick={props.onBack}>
          {ru.backToMap}
        </button>
      </header>
      <div className={styles.plan}>
        <FloorPlan
          floor={floor}
          title={title}
          route={route}
          selected={selectedRoom}
          picked={pickedRoom}
          onRoomClick={props.onRoomClick}
          onServiceClick={props.onServiceClick}
        />
      </div>
      <aside className={styles.side}>
        <EntrancePicker entrances={entrances} value={entranceId} onChange={props.onEntrance} />
        <section className={styles.info} aria-live="polite">
          <Info info={info} onRouteHere={props.onRouteHere} />
        </section>
      </aside>
    </div>
  );
}

function Info({ info, onRouteHere }: { info: FloorInfo; onRouteHere: (n: string) => void }) {
  switch (info.kind) {
    case 'hint':
      return <p className={styles.muted}>{ru.floorHint}</p>;
    case 'service':
      return <p className={styles.muted}>{ru.serviceRoom}</p>;
    case 'picked':
      return (
        <>
          <p className={styles.roomName}>
            <b>{info.room.number}</b> — {info.room.name}
          </p>
          <button type="button" className={styles.go} onClick={() => onRouteHere(info.room.number)}>
            {ru.routeHere}
          </button>
        </>
      );
    case 'route': {
      const { resolved, route } = info;
      const number = resolved.unplaced?.number ?? resolved.room.number;
      const name = resolved.unplaced?.name ?? resolved.room.name;
      return (
        <>
          <p className={styles.roomName}>
            <b>{number}</b> — {name}{' '}
            <span className={styles.muted}>{ru.roomMeters(route.meters)}</span>
          </p>
          {resolved.unplaced && (
            <p className={styles.note}>
              {ru.approximateNote(resolved.unplaced.number, resolved.room.number)}
            </p>
          )}
          <StepList steps={route.steps} />
        </>
      );
    }
  }
}
