import type { Corridor, Entrance, Floor, PlanPoint, Room, UnplacedRoom } from '../types';
import { roundMeters } from './campusRoute';
import {
  corridorCrossing,
  distance,
  nearestCorridor,
  pointOnCorridor,
  projectT,
  roomDoor,
  turnCross,
} from './floorGeometry';
import { addEdge, shortestPath, type Graph } from './graph';

export type Side = 'right' | 'left';

export type FloorStep =
  | { kind: 'enter'; entranceN: string }
  | { kind: 'turn'; direction: Side | 'straight'; meters: number }
  | { kind: 'arrive'; room: string; side: Side };

export interface FloorRoute {
  /** Ломаная без лишних точек: дверь входа → коридор → … → дверь кабинета. */
  points: PlanPoint[];
  meters: number;
  steps: FloorStep[];
}

export interface ResolvedRoom {
  room: Room;
  /** Если искали кабинет без точного места — он здесь, а room — ближайший известный. */
  unplaced?: UnplacedRoom;
}

/** Находит кабинет по номеру; для кабинетов без места возвращает соседний. */
export function resolveRoom(floor: Floor, number: string): ResolvedRoom | null {
  const room = floor.rooms.find((r) => r.number === number);
  if (room) return { room };
  const unplaced = floor.unplacedRooms?.find((r) => r.number === number);
  const near = unplaced && floor.rooms.find((r) => r.number === unplaced.near);
  return unplaced && near ? { room: near, unplaced } : null;
}

const key = ([x, y]: PlanPoint): string => `${x},${y}`;

/**
 * Граф коридоров этажа: точки на осях (концы, стыки, проекции входов и дверей кабинетов),
 * соседние точки одного коридора соединены рёбрами длиной по оси.
 */
export function buildFloorGraph(floor: Floor): { graph: Graph; points: Map<string, PlanPoint> } {
  const graph: Graph = new Map();
  const points = new Map<string, PlanPoint>();
  const doors: { door: PlanPoint; corridor: Corridor | undefined }[] = [
    ...floor.entrances.map((e) => ({ door: e.door, corridor: entranceCorridor(floor, e) })),
    ...floor.rooms.map((r) => {
      const door = roomDoor(r.rect, r.side);
      return { door, corridor: nearestCorridor(floor.corridors, door) };
    }),
  ];

  for (const c of floor.corridors) {
    const ts = new Set<number>([c.from, c.to]);
    for (const other of floor.corridors) {
      const cross = corridorCrossing(c, other);
      if (cross) ts.add(projectT(c, cross));
    }
    for (const d of doors) {
      if (d.corridor === c) ts.add(projectT(c, d.door));
    }
    const sorted = [...ts].sort((a, b) => a - b);
    sorted.forEach((t) => {
      const p = pointOnCorridor(c, t);
      points.set(key(p), p);
    });
    for (let i = 1; i < sorted.length; i++) {
      const a = pointOnCorridor(c, sorted[i - 1] as number);
      const b = pointOnCorridor(c, sorted[i] as number);
      addEdge(graph, key(a), key(b), distance(a, b));
    }
  }
  return { graph, points };
}

/** Коридор входа задан в данных явно: ближайший по геометрии не всегда тот, куда ведёт дверь. */
function entranceCorridor(floor: Floor, e: Entrance): Corridor | undefined {
  return floor.corridors.find((c) => c.id === e.corridorId);
}

/** Точка на оси коридора, куда выходит дверь. */
function corridorPoint(c: Corridor | undefined, door: PlanPoint): PlanPoint | null {
  return c ? pointOnCorridor(c, projectT(c, door)) : null;
}

/** Убирает повторяющиеся точки и точки посреди прямого отрезка. */
export function simplifyPath(points: PlanPoint[]): PlanPoint[] {
  const unique = points.filter((p, i) => {
    const prev = points[i - 1];
    return !prev || distance(prev, p) > 0.01;
  });
  return unique.filter((p, i) => {
    const a = unique[i - 1];
    const c = unique[i + 1];
    return !a || !c || Math.abs(turnCross(a, p, c)) > 1e-6 || dot(a, p, c) < 0;
  });
}

function dot(a: PlanPoint, b: PlanPoint, c: PlanPoint): number {
  return (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]);
}

const sideOf = (cross: number): Side => (cross > 0 ? 'right' : 'left');

/**
 * Пошаговые подсказки: вход, затем на каждом повороте направление и длина следующего
 * отрезка (метры с округлением до 5, минимум 5), в конце — с какой стороны кабинет.
 */
export function buildSteps(
  points: PlanPoint[],
  entranceN: string,
  roomNumber: string,
  metersPerUnit: number,
): FloorStep[] {
  const steps: FloorStep[] = [{ kind: 'enter', entranceN }];
  // Точки: [дверь входа, …углы в коридоре…, дверь кабинета]. Повороты — во внутренних
  // точках, кроме последней: там не поворот, а дверь кабинета сбоку.
  for (let i = 1; i < points.length - 2; i++) {
    const [a, b, c] = [points[i - 1], points[i], points[i + 1]] as [
      PlanPoint,
      PlanPoint,
      PlanPoint,
    ];
    const cross = turnCross(a, b, c);
    steps.push({
      kind: 'turn',
      direction: Math.abs(cross) < 1e-6 ? 'straight' : sideOf(cross),
      meters: Math.max(5, roundMeters(distance(b, c) * metersPerUnit)),
    });
  }
  const n = points.length;
  if (n >= 3) {
    const [a, b, c] = [points[n - 3], points[n - 2], points[n - 1]] as [
      PlanPoint,
      PlanPoint,
      PlanPoint,
    ];
    steps.push({ kind: 'arrive', room: roomNumber, side: sideOf(turnCross(a, b, c)) });
  }
  return steps;
}

/**
 * Маршрут по этажу от входа до двери кабинета. label — как назвать кабинет в подсказке.
 * TODO(этажи 2+): когда появятся планы верхних этажей, объединить графы этажей ребром
 * между одинаковыми Stair.id на соседних этажах (вес 15 м за этаж) и добавить шаг
 * «Поднимись по лестнице на N этаж». См. README, «Как добавить этаж».
 */
export function floorRoute(
  floor: Floor,
  entranceId: string,
  room: Room,
  label: string = room.number,
): FloorRoute | null {
  const entrance = floor.entrances.find((e) => e.id === entranceId);
  if (!entrance) return null;
  const door = roomDoor(room.rect, room.side);
  const start = corridorPoint(entranceCorridor(floor, entrance), entrance.door);
  const goal = corridorPoint(nearestCorridor(floor.corridors, door), door);
  if (!start || !goal) return null;

  const { graph, points } = buildFloorGraph(floor);
  const result = shortestPath(graph, key(start), [key(goal)]);
  if (!result) return null;

  const raw: PlanPoint[] = [
    entrance.door,
    ...result.nodes.map((k) => points.get(k) as PlanPoint),
    door,
  ];
  const units = result.length + distance(entrance.door, start) + distance(goal, door);
  const path = simplifyPath(raw);
  return {
    points: path,
    meters: Math.max(5, roundMeters(units * floor.metersPerUnit)),
    steps: buildSteps(path, entrance.n, label, floor.metersPerUnit),
  };
}
