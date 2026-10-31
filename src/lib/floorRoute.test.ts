import { describe, expect, it } from 'vitest';
import floor from '../data/buildings/k1/floor1';
import { stepText } from '../i18n/ru';
import { floorRoute, resolveRoom, simplifyPath } from './floorRoute';

function routeTo(entrance: string, number: string) {
  const resolved = resolveRoom(floor, number);
  if (!resolved) throw new Error(number);
  const route = floorRoute(floor, entrance, resolved.room);
  if (!route) throw new Error(`${entrance} → ${number}`);
  return route;
}

describe('floorRoute: эталоны из ТЗ', () => {
  it('вход 1 → 117: направо, около 10 м, справа', () => {
    expect(routeTo('main', '117').steps).toEqual([
      { kind: 'enter', entranceN: '1' },
      { kind: 'turn', direction: 'right', meters: 10 },
      { kind: 'arrive', room: '117', side: 'right' },
    ]);
  });

  it('вход 1 → 134: налево 30 м, налево 30 м, справа', () => {
    expect(routeTo('main', '134').steps).toEqual([
      { kind: 'enter', entranceN: '1' },
      { kind: 'turn', direction: 'left', meters: 30 },
      { kind: 'turn', direction: 'left', meters: 30 },
      { kind: 'arrive', room: '134', side: 'right' },
    ]);
  });

  it('текст подсказок для 117 совпадает с примером из ТЗ', () => {
    expect(routeTo('main', '117').steps.map(stepText)).toEqual([
      'Зайди через вход 1 и пройди к коридору.',
      'Поверни направо и пройди около 10 м.',
      'Кабинет 117 будет справа.',
    ]);
  });

  it('путь начинается у двери входа и кончается у двери кабинета', () => {
    const { points } = routeTo('main', '117');
    expect(points[0]).toEqual([270, 372]);
    expect(points.at(-1)).toEqual([180, 414]);
  });
});

describe('floorRoute: стороны поворотов', () => {
  it('вход 1 → 124: направо, кабинет слева (южная сторона, идём на запад)', () => {
    const steps = routeTo('main', '124').steps;
    expect(steps[1]).toEqual({ kind: 'turn', direction: 'right', meters: 5 });
    expect(steps.at(-1)).toEqual({ kind: 'arrive', room: '124', side: 'left' });
  });

  it('вход 2 → 100: идём на север, направо, кабинет слева (северная сторона)', () => {
    const steps = routeTo('north', '100').steps;
    expect(steps[1]).toMatchObject({ kind: 'turn', direction: 'right' });
    expect(steps.at(-1)).toEqual({ kind: 'arrive', room: '100', side: 'left' });
  });

  it('вход 2 выходит в северный коридор, а не в ближайший по геометрии восточный', () => {
    expect(routeTo('north', '100').points[1]).toEqual([452, 89]);
  });

  it('вход 2 → 117 идёт через восточный и южный коридоры', () => {
    const steps = routeTo('north', '117').steps;
    expect(steps.filter((s) => s.kind === 'turn')).toHaveLength(3);
  });

  it('у каждого кабинета есть путь от обоих входов', () => {
    for (const room of floor.rooms) {
      for (const e of floor.entrances) {
        const route = floorRoute(floor, e.id, room);
        expect(route?.steps.at(-1)).toMatchObject({ kind: 'arrive', room: room.number });
      }
    }
  });
});

describe('resolveRoom', () => {
  it('121А без точного места ведёт к 121', () => {
    const r = resolveRoom(floor, '121А');
    expect(r?.room.number).toBe('121');
    expect(r?.unplaced?.number).toBe('121А');
  });

  it('несуществующий кабинет — null', () => {
    expect(resolveRoom(floor, '999')).toBeNull();
  });
});

describe('simplifyPath', () => {
  it('убирает дубли и точки на прямой', () => {
    expect(
      simplifyPath([
        [0, 0],
        [0, 0],
        [5, 0],
        [10, 0],
        [10, 5],
      ]),
    ).toEqual([
      [0, 0],
      [10, 0],
      [10, 5],
    ]);
  });
});
