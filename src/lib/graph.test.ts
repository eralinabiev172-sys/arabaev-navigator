import { describe, expect, it } from 'vitest';
import { BUILDINGS } from '../data/campus';
import type { GateId } from '../types';
import { routeToDoors, targetDoors } from './campusRoute';
import { addEdge, shortestPath, type Graph } from './graph';

describe('shortestPath', () => {
  const g: Graph = new Map();
  addEdge(g, 'a', 'b', 1);
  addEdge(g, 'b', 'c', 1);
  addEdge(g, 'a', 'c', 5);
  addEdge(g, 'c', 'd', 1);

  it('находит кратчайший путь, а не прямое ребро', () => {
    expect(shortestPath(g, 'a', ['c'])).toEqual({ nodes: ['a', 'b', 'c'], length: 2, target: 'c' });
  });

  it('из нескольких целей выбирает ближайшую', () => {
    expect(shortestPath(g, 'a', ['d', 'b'])?.target).toBe('b');
  });

  it('возвращает null для недостижимой цели и неизвестного старта', () => {
    addEdge(g, 'x', 'y', 1);
    expect(shortestPath(g, 'a', ['y'])).toBeNull();
    expect(shortestPath(g, 'nope', ['a'])).toBeNull();
  });
});

/** Эталонные длины из ТЗ, м: [Киевская, Раззакова, Бульвар]. */
const ACCEPTANCE: [string, string, string | undefined, [number, number, number]][] = [
  ['Корпус 1, вход 1', 'k1', 'd1m', [143, 132, 143]],
  ['Корпус 1, вход 2', 'k1', 'd1b', [150, 171, 183]],
  ['Корпус 2', 'k2', undefined, [144, 33, 111]],
  ['Корпус 3', 'k3', undefined, [228, 143, 30]],
  ['Корпус 4', 'k4', undefined, [36, 113, 165]],
  ['Корпус 5', 'k5', undefined, [155, 70, 80]],
  ['Новая библиотека', 'lib', undefined, [255, 170, 118]],
  ['Старая библиотека', 'lib1', undefined, [77, 112, 164]],
  ['Столовая', 'food', undefined, [49, 126, 177]],
];
const GATE_ORDER: GateId[] = ['N', 'W', 'E'];

describe('маршруты по территории совпадают с таблицей приёмки (±3 м)', () => {
  for (const [title, buildingId, door, expected] of ACCEPTANCE) {
    GATE_ORDER.forEach((gate, i) => {
      it(`${title} от ${gate}: ${expected[i]} м`, () => {
        const building = BUILDINGS.find((b) => b.id === buildingId);
        if (!building) throw new Error(buildingId);
        const route = routeToDoors(gate, targetDoors(building, door));
        expect(route).not.toBeNull();
        expect(Math.abs((route?.length ?? 0) - (expected[i] as number))).toBeLessThanOrEqual(3);
      });
    });
  }

  it('корпус 4 — к ближайшей двери, от Киевской это d4a', () => {
    const k4 = BUILDINGS.find((b) => b.id === 'k4');
    if (!k4) throw new Error('k4');
    expect(routeToDoors('N', targetDoors(k4))?.doorId).toBe('d4a');
  });

  it('дверь спортзала d1a не участвует в маршрутах', () => {
    expect(routeToDoors('E', ['d1a'])).toBeNull();
  });
});
