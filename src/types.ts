/** Географическая точка в формате [долгота, широта]. */
export type LngLat = [number, number];

/** Точка на плане этажа в координатах SVG (ось y вниз). */
export type PlanPoint = [number, number];

/** Прямоугольник на плане: [x, y, ширина, высота]. */
export type Rect = [number, number, number, number];

/* ───────────── Территория ───────────── */

export type BuildingKind = 'korpus' | 'library' | 'food' | 'foreign';

export type BuildingId = string;

export interface Building {
  id: BuildingId;
  label: string;
  kind: BuildingKind;
  /** Координата метки над зданием. */
  labelAt: LngLat;
  /** Узлы-двери из графа дорожек, к которым можно проложить маршрут. Пусто у «чужих» зданий. */
  doorIds: string[];
  /**
   * true — дверь выбирает студент (через входы плана этажа), а не алгоритм.
   * Иначе маршрут ведёт к ближайшей из doorIds.
   */
  doorChosenByUser?: boolean;
}

export interface Door {
  /** id узла графа дорожек (совпадает с ключом в PATH_NODES). */
  id: string;
  buildingId: BuildingId;
  at: LngLat;
  note?: string;
  /** Дверь показывается серой и не участвует в маршрутах (например, спортзал). */
  inactive?: boolean;
}

export type GateId = 'N' | 'W' | 'E';

export interface Gate {
  id: GateId;
  /** Короткое имя для кнопки. */
  short: string;
  name: string;
  at: LngLat;
}

/** Узел графа дорожек. */
export interface PathNode {
  id: string;
  at: LngLat;
}

/* ───────────── Этажи ───────────── */

/**
 * Сторона кабинета относительно коридора:
 * NT — верхний ряд северного блока, дверь снизу; NB — нижний ряд, дверь сверху;
 * EW / EE — западная / восточная сторона восточного крыла;
 * SN / SS — северная / южная сторона южного крыла;
 * W — помещение в западном торце, дверь на восточной стене.
 */
export type RoomSide = 'NT' | 'NB' | 'EW' | 'EE' | 'SN' | 'SS' | 'W';

export interface Room {
  number: string;
  name: string;
  side: RoomSide;
  rect: Rect;
}

/** Кабинет, который есть в поиске, но точное место которого неизвестно. */
export interface UnplacedRoom {
  number: string;
  name: string;
  /** Номер кабинета, к которому ведёт маршрут. */
  near: string;
}

/** Служебное помещение без номера: рисуется, в поиске не участвует. */
export interface ServiceRoom {
  side: RoomSide;
  rect: Rect;
}

/** Коридор задаётся осью: горизонтальной (y = at, x от from до to) или вертикальной. */
export interface Corridor {
  id: string;
  axis: 'h' | 'v';
  at: number;
  from: number;
  to: number;
}

export interface Entrance {
  id: string;
  /** Номер входа, как он подписан на плане. */
  n: string;
  label: string;
  /** Дверь на плане. */
  door: PlanPoint;
  corridorId: string;
  /** Дверь на карте территории (узел графа дорожек), с которой связан этот вход. */
  campusDoorId: string;
  /** Положение подписи «Вход N»: над или под точкой. */
  labelSide: 'above' | 'below';
  isDefault?: boolean;
}

export interface Stair {
  /** Общий для всех этажей корпуса id, по нему строятся переходы между этажами. */
  id: string;
  rect: Rect;
}

export interface Floor {
  buildingId: BuildingId;
  level: number;
  viewBox: [number, number, number, number];
  /** Сколько метров в одной единице плана. */
  metersPerUnit: number;
  /** Точки контура для <polygon points>. */
  outline: string;
  corridors: Corridor[];
  /** Входы с улицы. Есть только на этаже, куда заходят снаружи. */
  entrances: Entrance[];
  stairs: Stair[];
  rooms: Room[];
  unplacedRooms?: UnplacedRoom[];
  serviceRooms: ServiceRoom[];
  /** Где рисовать стрелку «С». */
  compassAt: PlanPoint;
}
