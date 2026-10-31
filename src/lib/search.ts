import type { Building, BuildingId, Floor } from '../types';

export type SearchItem =
  | { kind: 'building'; id: string; building: Building }
  | {
      kind: 'room';
      id: string;
      buildingId: BuildingId;
      buildingLabel: string;
      level: number;
      number: string;
      name: string;
      /** Точное место кабинета неизвестно. */
      approximate: boolean;
    };

interface IndexEntry {
  item: SearchItem;
  number: string;
  text: string;
}

export type SearchIndex = IndexEntry[];

/**
 * Приводит строку к виду для сравнения: без регистра, ё → е, кыргызские ө ү ң → о у н
 * (на телефоне их часто набирают без спецраскладки), латинская a → кириллическая а
 * (127a и 127а — один кабинет), без знаков препинания.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/ө/g, 'о')
    .replace(/ү/g, 'у')
    .replace(/ң/g, 'н')
    .replace(/a/g, 'а')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Индекс: университетские здания и кабинеты со всех этажей. «Чужие» здания не ищутся. */
export function buildSearchIndex(buildings: Building[], floors: Floor[]): IndexEntry[] {
  const entries: IndexEntry[] = buildings
    .filter((b) => b.kind !== 'foreign')
    .map((b) => ({
      item: { kind: 'building', id: b.id, building: b },
      number: '',
      text: normalize(b.label),
    }));

  for (const floor of floors) {
    const building = buildings.find((b) => b.id === floor.buildingId);
    const buildingLabel = building?.label ?? floor.buildingId;
    const rooms = [
      ...floor.rooms.map((r) => ({ ...r, approximate: false })),
      ...(floor.unplacedRooms ?? []).map((r) => ({ ...r, approximate: true })),
    ];
    for (const r of rooms) {
      entries.push({
        item: {
          kind: 'room',
          id: `${floor.buildingId}-${r.number}`,
          buildingId: floor.buildingId,
          buildingLabel,
          level: floor.level,
          number: r.number,
          name: r.name,
          approximate: r.approximate,
        },
        number: normalize(r.number),
        text: normalize(`${r.number} ${r.name}`),
      });
    }
  }
  return entries;
}

function score(entry: IndexEntry, q: string, words: string[]): number {
  if (entry.number && entry.number === q) return 100;
  if (!words.every((w) => entry.text.includes(w))) return 0;
  if (entry.number && entry.number.startsWith(q)) return 80;
  if (entry.text.startsWith(q)) return 60;
  if (words.every((w) => entry.text.split(' ').some((t) => t.startsWith(w)))) return 40;
  return 20;
}

/** Подсказки по запросу: номер, название (рус./кырг.) или здание. Пустой запрос — пусто. */
export function search(index: IndexEntry[], query: string, limit = 8): SearchItem[] {
  const q = normalize(query);
  if (!q) return [];
  const words = q.split(' ');
  return index
    .map((entry, order) => ({ entry, order, s: score(entry, q, words) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.order - b.order)
    .slice(0, limit)
    .map((x) => x.entry.item);
}
