import type { Corridor, PlanPoint, Rect, RoomSide } from '../types';

type Wall = 'top' | 'bottom' | 'left' | 'right';

/** На какой стене помещения дверь (стена, обращённая к коридору). */
const DOOR_WALL: Record<RoomSide, Wall> = {
  NT: 'bottom',
  NB: 'top',
  EW: 'right',
  EE: 'left',
  SN: 'bottom',
  SS: 'top',
  W: 'right',
};

/** Дверь — посередине стены, обращённой к коридору. */
export function roomDoor([x, y, w, h]: Rect, side: RoomSide): PlanPoint {
  switch (DOOR_WALL[side]) {
    case 'top':
      return [x + w / 2, y];
    case 'bottom':
      return [x + w / 2, y + h];
    case 'left':
      return [x, y + h / 2];
    case 'right':
      return [x + w, y + h / 2];
  }
}

/** Отрезок проёма двери в стене, для отрисовки разрыва. */
export function doorGap(rect: Rect, side: RoomSide, halfWidth = 4): [PlanPoint, PlanPoint] {
  const [cx, cy] = roomDoor(rect, side);
  const wall = DOOR_WALL[side];
  return wall === 'top' || wall === 'bottom'
    ? [
        [cx - halfWidth, cy],
        [cx + halfWidth, cy],
      ]
    : [
        [cx, cy - halfWidth],
        [cx, cy + halfWidth],
      ];
}

export function pointOnCorridor(c: Corridor, t: number): PlanPoint {
  return c.axis === 'h' ? [t, c.at] : [c.at, t];
}

/** Проекция точки на ось коридора (координата вдоль оси, с ограничением концами). */
export function projectT(c: Corridor, [x, y]: PlanPoint): number {
  const t = c.axis === 'h' ? x : y;
  return Math.min(Math.max(t, c.from), c.to);
}

/** Ближайший к точке коридор. */
export function nearestCorridor(corridors: Corridor[], p: PlanPoint): Corridor | undefined {
  let best: Corridor | undefined;
  let bestD = Infinity;
  for (const c of corridors) {
    const d = distance(p, pointOnCorridor(c, projectT(c, p)));
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Точка пересечения двух коридоров, если они пересекаются. */
export function corridorCrossing(a: Corridor, b: Corridor): PlanPoint | null {
  if (a.axis === b.axis) return null;
  const [h, v] = a.axis === 'h' ? [a, b] : [b, a];
  const inH = v.at >= h.from && v.at <= h.to;
  const inV = h.at >= v.from && h.at <= v.to;
  return inH && inV ? [v.at, h.at] : null;
}

export function distance(a: PlanPoint, b: PlanPoint): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** Векторное произведение отрезков a→b и b→c в координатах SVG: > 0 — поворот направо. */
export function turnCross(a: PlanPoint, b: PlanPoint, c: PlanPoint): number {
  return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
}
