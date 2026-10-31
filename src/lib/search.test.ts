import { describe, expect, it } from 'vitest';
import { BUILDINGS } from '../data/campus';
import { FLOORS } from '../data/buildings';
import { buildSearchIndex, normalize, search } from './search';

const index = buildSearchIndex(BUILDINGS, FLOORS);
const numbers = (q: string) =>
  search(index, q, 50).map((i) => (i.kind === 'room' ? i.number : i.building.id));

describe('search: запросы из приёмки', () => {
  it('«117» — первым кабинет 117', () => {
    expect(numbers('117')[0]).toBe('117');
  });

  it('«бухгалтер» находит 124, 127 и 127А', () => {
    expect(numbers('бухгалтер')).toEqual(expect.arrayContaining(['124', '127', '127А']));
  });

  it('«компьютерный класс» находит 111–113', () => {
    expect(numbers('компьютерный класс')).toEqual(['111', '112', '113']);
  });

  it('«Музей» находит 100 без учёта регистра', () => {
    expect(numbers('МУЗЕЙ')).toEqual(['100']);
  });
});

describe('search: здания и язык', () => {
  it('«Корпус 3» — здание', () => {
    expect(numbers('Корпус 3')[0]).toBe('k3');
  });

  it('«столовая» — университетская, чужая не показывается', () => {
    expect(numbers('столовая')).toEqual(['food']);
  });

  it('«склад» и «стройка» не ищутся', () => {
    expect(numbers('склад')).toEqual([]);
    expect(numbers('стройка')).toEqual([]);
  });

  it('по-кыргызски, в том числе без ө/ү', () => {
    expect(numbers('кабылдама')).toEqual(['110']);
    expect(numbers('бөлүмү')).toEqual(numbers('болуму'));
    expect(numbers('болуму').length).toBeGreaterThan(3);
  });

  it('127a латиницей = 127А', () => {
    expect(numbers('127a')[0]).toBe('127А');
  });

  it('121А есть в поиске с пометкой о неточном месте', () => {
    const item = search(index, '121а')[0];
    expect(item).toMatchObject({ kind: 'room', number: '121А', approximate: true });
  });

  it('пустой запрос — пусто', () => {
    expect(search(index, '   ')).toEqual([]);
  });

  it('normalize', () => {
    expect(normalize('  Ёлка — ӨҮҢ ')).toBe('елка оун');
  });
});
