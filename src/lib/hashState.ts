import type { BuildingId, GateId } from '../types';

/** Состояние маршрута, которое живёт в адресе страницы: #k1-117?from=W&in=north&view=floor */
export interface NavState {
  buildingId: BuildingId | null;
  room: string | null;
  gate: GateId | null;
  entrance: string | null;
  view: 'map' | 'floor';
}

export const EMPTY_STATE: NavState = {
  buildingId: null,
  room: null,
  gate: null,
  entrance: null,
  view: 'map',
};

const GATE_IDS: GateId[] = ['N', 'W', 'E'];

export function parseHash(hash: string): NavState {
  const raw = hash.replace(/^#/, '');
  if (!raw) return EMPTY_STATE;
  const [target = '', query = ''] = raw.split('?');
  const params = new URLSearchParams(query);
  const decoded = safeDecode(target);
  const dash = decoded.indexOf('-');
  const from = params.get('from');
  return {
    buildingId: (dash === -1 ? decoded : decoded.slice(0, dash)) || null,
    room: dash === -1 ? null : decoded.slice(dash + 1) || null,
    gate: GATE_IDS.find((g) => g === from) ?? null,
    entrance: params.get('in'),
    view: params.get('view') === 'floor' ? 'floor' : 'map',
  };
}

export function formatHash(s: NavState): string {
  if (!s.buildingId) return '';
  const target = encodeURIComponent(s.room ? `${s.buildingId}-${s.room}` : s.buildingId);
  const params = new URLSearchParams();
  if (s.gate) params.set('from', s.gate);
  if (s.entrance) params.set('in', s.entrance);
  if (s.view === 'floor') params.set('view', 'floor');
  const query = params.toString();
  return `#${target}${query ? `?${query}` : ''}`;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
