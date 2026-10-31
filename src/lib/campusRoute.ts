import { PATH_EDGES, PATH_NODES } from '../data/paths';
import { WALK_SPEED_M_PER_MIN } from '../data/campus';
import type { Building, GateId, LngLat } from '../types';
import { addEdge, shortestPath, type Graph } from './graph';
import { haversine } from './geo';

export interface CampusRoute {
  path: LngLat[];
  length: number;
  doorId: string;
}

function buildCampusGraph(): Graph {
  const graph: Graph = new Map();
  for (const [a, b] of PATH_EDGES) {
    const pa = PATH_NODES[a];
    const pb = PATH_NODES[b];
    if (!pa || !pb) throw new Error(`Ребро ${a}–${b} ссылается на неизвестный узел`);
    addEdge(graph, a, b, haversine(pa, pb));
  }
  return graph;
}

const CAMPUS_GRAPH = buildCampusGraph();

/** Маршрут от ворот к ближайшей из указанных дверей. */
export function routeToDoors(gate: GateId, doorIds: string[]): CampusRoute | null {
  const result = shortestPath(CAMPUS_GRAPH, gate, doorIds);
  if (!result) return null;
  return {
    path: result.nodes.map((id) => PATH_NODES[id] as LngLat),
    length: result.length,
    doorId: result.target,
  };
}

/**
 * Двери, к которым ведём в здание. Если дверь выбирает студент (корпус 1),
 * берётся только выбранная, иначе — все двери здания.
 */
export function targetDoors(building: Building, chosenDoorId?: string): string[] {
  if (building.doorChosenByUser && chosenDoorId && building.doorIds.includes(chosenDoorId)) {
    return [chosenDoorId];
  }
  return building.doorIds;
}

export function roundMeters(m: number): number {
  return Math.round(m / 5) * 5;
}

export function walkMinutes(m: number): number {
  return Math.max(1, Math.round(m / WALK_SPEED_M_PER_MIN));
}
