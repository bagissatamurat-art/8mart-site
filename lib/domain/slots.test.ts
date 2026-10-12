import { describe, expect, it } from 'vitest';
import { cargoSlots, courierSlots, slotEta, slotTitle } from './slots';

// Время Казахстана = UTC+5: 07:00Z = 12:00 KZ.
const at = (iso: string) => new Date(iso);

describe('слоты доставки', () => {
  it('сегодня: «Ближайшее» и интервалы, до которых ≥ часа', () => {
    const days = courierSlots(at('2026-10-13T07:30:00Z'), '~30 мин'); // 12:30, вторник
    expect(days.map(d => [d.title, d.date])).toEqual([['Сегодня', '13 окт'], ['Завтра', '14 окт'], ['Чт', '15 окт']]);
    expect(days[0].slots.map(s => s.label)).toEqual(['Ближайшее', '15:00–18:00', '18:00–21:00']);
    expect(days[0].slots[0]).toMatchObject({ id: 'asap', sub: '~30 мин' });
    expect(days[1].slots).toHaveLength(4);
  });
  it('поздно вечером сегодня нет — первый день «Завтра»', () => {
    const days = courierSlots(at('2026-10-13T16:30:00Z'), '~30 мин'); // 21:30
    expect(days[0].title).toBe('Завтра');
    expect(days).toHaveLength(2);
  });
  it('день по времени Казахстана, а не UTC', () => {
    const night = courierSlots(at('2026-10-13T19:30:00Z'), ''); // по UTC ещё 13-е, в Казахстане уже 14-е 00:30
    expect(night[0]).toMatchObject({ title: 'Сегодня', date: '14 окт' });
    expect(night[0].slots[0].id).not.toBe('asap'); // ночью «Ближайшего» нет — только интервалы с 09:00
  });
  it('грузовой — с завтра; подписи', () => {
    const days = cargoSlots(at('2026-10-13T07:30:00Z'));
    expect(days[0]).toMatchObject({ title: 'Завтра', id: '2026-10-14' });
    expect(slotTitle(days, '2026-10-14|09:00–13:00')).toBe('Завтра, 09:00–13:00');
    expect(slotTitle(days, '2026-10-16|13:00–17:00')).toBe('Пт, 16 окт, 13:00–17:00');
    expect(slotEta('2026-10-16|13:00–17:00')).toBe('16 октября, 13:00–17:00');
  });
});
