import type { Gate, LngLat } from '../types';

const EARTH_RADIUS_M = 6371000;

/** Расстояние между точками [долгота, широта] по формуле haversine, в метрах. */
export function haversine(a: LngLat, b: LngLat): number {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLng = (b[0] - a[0]) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function nearestGate(point: LngLat, gates: Gate[]): { gate: Gate; distance: number } | null {
  let result: { gate: Gate; distance: number } | null = null;
  for (const gate of gates) {
    const distance = haversine(point, gate.at);
    if (!result || distance < result.distance) result = { gate, distance };
  }
  return result;
}

/**
 * Ссылка на маршрут в 2ГИС до точки `to`. Формат: /directions/points/<откуда>|<куда>,
 * каждая точка — «долгота,широта». Пустое «откуда» — 2ГИС подставит место пользователя.
 */
export function dgisDirectionsUrl(to: LngLat, from?: LngLat): string {
  const point = (p: LngLat) => encodeURIComponent(`${p[0]},${p[1]}`);
  return `https://2gis.kg/bishkek/directions/points/${from ? point(from) : ''}%7C${point(to)}`;
}

export function boundsOf(points: LngLat[]): { southWest: LngLat; northEast: LngLat } | null {
  if (points.length === 0) return null;
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return {
    southWest: [Math.min(...lngs), Math.min(...lats)],
    northEast: [Math.max(...lngs), Math.max(...lats)],
  };
}
