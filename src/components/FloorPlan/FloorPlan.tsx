import { useRef, type KeyboardEvent } from 'react';
import type { Floor, PlanPoint, Rect } from '../../types';
import { doorGap } from '../../lib/floorGeometry';
import { ru } from '../../i18n/ru';
import { usePanZoom } from './usePanZoom';
import styles from './FloorPlan.module.css';

interface Props {
  floor: Floor;
  title: string;
  route: PlanPoint[] | null;
  /** Кабинет, до которого проложен путь. */
  selected: string | null;
  /** Кабинет, на который нажали (подсвечен жёлтым). */
  picked: string | null;
  onRoomClick: (number: string) => void;
  onServiceClick: () => void;
}

export function FloorPlan(props: Props) {
  const { floor, title, route, selected, picked, onRoomClick, onServiceClick } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const pz = usePanZoom(svgRef, floor.viewBox);

  const click = (fn: () => void) => () => {
    if (!pz.wasDrag()) fn();
  };
  const key = (fn: () => void) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={pz.viewBox}
        role="group"
        aria-label={ru.floorPlanAria(title)}
        {...pz.handlers}
      >
        <polygon points={floor.outline} className={styles.outline} />
        <Compass at={floor.compassAt} />
        {floor.stairs.map((s) => (
          <Stair key={s.id} rect={s.rect} />
        ))}

        {floor.serviceRooms.map((r, i) => (
          <rect
            key={i}
            {...rectAttrs(r.rect)}
            className={styles.room}
            onClick={click(onServiceClick)}
          />
        ))}

        {floor.rooms.map((r) => {
          const on = r.number === selected;
          const pk = !on && r.number === picked;
          const [x, y, w, h] = r.rect;
          const choose = () => onRoomClick(r.number);
          return (
            <g
              key={r.number}
              className={styles.roomGroup}
              role="button"
              tabIndex={0}
              aria-label={`${r.number} — ${r.name}`}
              aria-pressed={on}
              onClick={click(choose)}
              onKeyDown={key(choose)}
            >
              <title>{`${r.number} — ${r.name}`}</title>
              <rect
                {...rectAttrs(r.rect)}
                className={`${styles.room} ${styles.numbered} ${on ? styles.selected : ''} ${pk ? styles.picked : ''}`}
              />
              {!on && (
                <rect
                  x={x + 2.5}
                  y={y + 2.5}
                  width={w - 5}
                  height={h - 5}
                  className={styles.inner}
                />
              )}
              <text
                x={x + w / 2}
                y={y + h / 2}
                className={`${styles.num} ${on ? styles.numOn : ''}`}
              >
                {r.number}
              </text>
            </g>
          );
        })}

        {[...floor.rooms, ...floor.serviceRooms].map((r, i) => {
          const [a, b] = doorGap(r.rect, r.side);
          return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={styles.gap} />;
        })}
        {floor.entrances.map((e) => (
          <line
            key={e.id}
            x1={e.door[0] - 6}
            y1={e.door[1]}
            x2={e.door[0] + 6}
            y2={e.door[1]}
            className={styles.entranceGap}
          />
        ))}

        {route && <RouteLine points={route} />}

        {floor.entrances.map((e) => (
          <g key={e.id} aria-hidden="true">
            <circle cx={e.door[0]} cy={e.door[1]} r={8} className={styles.entrance} />
            <text x={e.door[0]} y={e.door[1]} className={styles.entranceN}>
              {e.n}
            </text>
            <text
              x={e.door[0]}
              y={e.door[1] + (e.labelSide === 'above' ? -16 : 16)}
              className={styles.entranceLabel}
            >
              {ru.entranceMark(e.n)}
            </text>
          </g>
        ))}
      </svg>

      <div className={styles.zoom}>
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={pz.zoomIn}
          aria-label={ru.zoomIn}
          title={ru.zoomIn}
        >
          +
        </button>
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={pz.zoomOut}
          aria-label={ru.zoomOut}
          title={ru.zoomOut}
        >
          −
        </button>
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={pz.fit}
          aria-label={ru.zoomFit}
          title={ru.zoomFit}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function rectAttrs([x, y, width, height]: Rect) {
  return { x, y, width, height };
}

function Compass({ at: [x, y] }: { at: PlanPoint }) {
  return (
    <g aria-hidden="true">
      <path
        d={`M${x - 6} ${y + 18} L${x} ${y} L${x + 6} ${y + 18} L${x} ${y + 13} Z`}
        className={styles.compass}
      />
      <text x={x} y={y + 30} className={styles.compassText}>
        {ru.north}
      </text>
    </g>
  );
}

function Stair({ rect }: { rect: Rect }) {
  const [x, y, w, h] = rect;
  const vertical = h > w;
  const steps: number[] = [];
  for (let i = 4; i < (vertical ? h : w); i += 4) steps.push(i);
  return (
    <g aria-hidden="true">
      <rect {...rectAttrs(rect)} className={styles.stair} />
      {steps.map((i) =>
        vertical ? (
          <line key={i} x1={x + 2} y1={y + i} x2={x + w - 2} y2={y + i} className={styles.step} />
        ) : (
          <line key={i} x1={x + i} y1={y + 2} x2={x + i} y2={y + h - 2} className={styles.step} />
        ),
      )}
    </g>
  );
}

function RouteLine({ points }: { points: PlanPoint[] }) {
  const pts = points.map((p) => p.join(',')).join(' ');
  const end = points[points.length - 1];
  return (
    <g aria-hidden="true">
      <polyline points={pts} className={styles.routeUnder} />
      <polyline points={pts} className={styles.route} />
      {end && <circle cx={end[0]} cy={end[1]} r={5} className={styles.routeEnd} />}
    </g>
  );
}
