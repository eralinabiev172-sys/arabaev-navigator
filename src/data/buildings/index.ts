import type { BuildingId, Floor } from '../../types';

/**
 * Все этажи подхватываются автоматически из файлов buildings/<корпус>/floor<N>.ts.
 * Чтобы добавить этаж, достаточно создать такой файл с `export default`.
 */
const modules = import.meta.glob<{ default: Floor }>('./*/floor*.ts', { eager: true });

export const FLOORS: Floor[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.buildingId.localeCompare(b.buildingId) || a.level - b.level);

export function floorsOf(buildingId: BuildingId): Floor[] {
  return FLOORS.filter((f) => f.buildingId === buildingId);
}

export function getFloor(buildingId: BuildingId, level: number): Floor | undefined {
  return FLOORS.find((f) => f.buildingId === buildingId && f.level === level);
}

/** Этаж, через который заходят с улицы (на нём описаны входы). */
export function groundFloor(buildingId: BuildingId): Floor | undefined {
  return floorsOf(buildingId).find((f) => f.entrances.length > 0);
}
