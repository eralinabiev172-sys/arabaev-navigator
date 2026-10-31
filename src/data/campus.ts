import type { Building, Door, Gate, LngLat } from '../types';

/** Начальный вид карты. */
export const MAP_VIEW = {
  center: [74.60515, 42.87365] as LngLat,
  zoom: 18.2,
  pitch: 50,
  rotation: 0,
};

/** Скорость пешехода, м/мин. */
export const WALK_SPEED_M_PER_MIN = 70;

/** Дальше этого расстояния до ворот студент считается «в городе», а не у универа. */
export const NEAR_CAMPUS_RADIUS_M = 250;

export const GATES: Gate[] = [
  { id: 'N', short: 'Киевская', name: 'Киевская (у корпуса 4)', at: [74.60491, 42.87455] },
  { id: 'W', short: 'Раззакова', name: 'Раззакова', at: [74.60443, 42.8735] },
  { id: 'E', short: 'Бульвар', name: 'Бульвар Эркиндик', at: [74.60596, 42.87341] },
];

export const BUILDINGS: Building[] = [
  {
    id: 'k1',
    label: 'Корпус 1',
    kind: 'korpus',
    labelAt: [74.605444, 42.873591],
    doorIds: ['d1m', 'd1b'],
    doorChosenByUser: true,
  },
  { id: 'k2', label: 'Корпус 2', kind: 'korpus', labelAt: [74.60455, 42.8731], doorIds: ['d2'] },
  {
    id: 'k3',
    label: 'Корпус 3',
    kind: 'korpus',
    labelAt: [74.605713, 42.873066],
    doorIds: ['d3'],
  },
  {
    id: 'k4',
    label: 'Корпус 4',
    kind: 'korpus',
    labelAt: [74.604668, 42.874364],
    doorIds: ['d4a', 'd4b', 'd4c'],
  },
  { id: 'k5', label: 'Корпус 5', kind: 'korpus', labelAt: [74.605, 42.87325], doorIds: ['d5'] },
  {
    id: 'lib',
    label: 'Новая библиотека',
    kind: 'library',
    labelAt: [74.6049, 42.87282],
    doorIds: ['dL'],
  },
  {
    id: 'lib1',
    label: 'Старая библиотека',
    kind: 'library',
    labelAt: [74.605156, 42.87395],
    doorIds: ['dL1'],
  },
  { id: 'food', label: 'Столовая', kind: 'food', labelAt: [74.604986, 42.87427], doorIds: ['dF'] },
  {
    id: 'sklad',
    label: 'Склад (не университет)',
    kind: 'foreign',
    labelAt: [74.6053, 42.8729],
    doorIds: [],
  },
  {
    id: 'food2',
    label: 'Столовая (не университет)',
    kind: 'foreign',
    labelAt: [74.605127, 42.874502],
    doorIds: [],
  },
  { id: 'site', label: 'Стройка', kind: 'foreign', labelAt: [74.605441, 42.874049], doorIds: [] },
];

export const DOORS: Door[] = [
  { id: 'd1m', buildingId: 'k1', at: [74.60548, 42.87368], note: 'Вход 1, главный, со двора' },
  { id: 'd1b', buildingId: 'k1', at: [74.605737, 42.873969], note: 'Вход 2, северный' },
  {
    id: 'd1a',
    buildingId: 'k1',
    at: [74.60526, 42.873574],
    note: 'Спортзал, не для маршрутов',
    inactive: true,
  },
  { id: 'd2', buildingId: 'k2', at: [74.604737, 42.873418] },
  { id: 'd3', buildingId: 'k3', at: [74.605863, 42.873181] },
  { id: 'd4a', buildingId: 'k4', at: [74.604808, 42.874294] },
  { id: 'd4b', buildingId: 'k4', at: [74.604787, 42.874121] },
  { id: 'd4c', buildingId: 'k4', at: [74.604689, 42.873924] },
  { id: 'd5', buildingId: 'k5', at: [74.605101, 42.87333] },
  { id: 'dL', buildingId: 'lib', at: [74.605036, 42.873009] },
  { id: 'dL1', buildingId: 'lib1', at: [74.605009, 42.873957] },
  { id: 'dF', buildingId: 'food', at: [74.604937, 42.874141] },
];

export function getBuilding(id: string): Building | undefined {
  return BUILDINGS.find((b) => b.id === id);
}

export function getGate(id: string): Gate | undefined {
  return GATES.find((g) => g.id === id);
}
