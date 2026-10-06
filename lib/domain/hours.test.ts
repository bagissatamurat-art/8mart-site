import { describe, expect, it } from 'vitest';
import { hhmm, kzWeekMinute, openState, parseHours } from './hours';

// 7 октября 2026 — среда. Время Казахстана = UTC+5: «ср 12:00 KZ» = 07:00 UTC.
const kz = (day: string, time: string) => {
  const dates: Record<string, string> = { пн: '2026-10-05', вт: '2026-10-06', ср: '2026-10-07', чт: '2026-10-08', пт: '2026-10-09', сб: '2026-10-10', вс: '2026-10-11' };
  const [h, m] = time.split(':').map(Number);
  return new Date(Date.parse(`${dates[day]}T00:00:00Z`) + ((h - 5) * 60 + m) * 60000);
};

describe('parseHours', () => {
  it('ежедневно, дни через тире, перечисление, круглосуточно', () => {
    expect(parseHours('Ежедневно 08:00–23:00')).toHaveLength(7);
    expect(parseHours('Пн–Сб 09:00–21:00')).toHaveLength(6);
    expect(parseHours('Пн–Пт 09:00–18:00, Сб 10:00–16:00')).toHaveLength(6);
    expect(parseHours('Круглосуточно')).toEqual([{ from: 0, to: 7 * 24 * 60 }]);
  });
  it('нераспознанный формат — null', () => {
    expect(parseHours('По записи')).toBeNull();
  });
});

describe('kzWeekMinute', () => {
  it('время Казахстана, а не браузера', () => {
    expect(hhmm(kzWeekMinute(kz('ср', '12:00')))).toBe('12:00');
  });
});

describe('openState', () => {
  const H = 'Ежедневно 09:00–22:00';
  it('открыто — до какого времени и сколько осталось', () => {
    expect(openState(H, kz('ср', '12:00'))).toMatchObject({ kind: 'open', inMin: 600 });
    expect(openState(H, kz('ср', '21:50'))).toMatchObject({ kind: 'open', inMin: 10 });
  });
  it('закрыто — когда откроется (сегодня / завтра)', () => {
    expect(openState(H, kz('ср', '08:50'))).toMatchObject({ kind: 'closed', inMin: 10, days: 0 });
    expect(openState(H, kz('ср', '23:00'))).toMatchObject({ kind: 'closed', inMin: 600, days: 1 });
  });
  it('выходной: «Пн–Сб» в воскресенье — до понедельника', () => {
    const s = openState('Пн–Сб 09:00–21:00', kz('сб', '22:00'));
    expect(s).toMatchObject({ kind: 'closed', days: 2 });
    expect(s && s.kind === 'closed' && hhmm(s.openAt)).toBe('09:00');
  });
  it('через полночь: «22:00–02:00» в 01:00 — открыто до 02:00', () => {
    const s = openState('Ежедневно 22:00–02:00', kz('ср', '01:00'));
    expect(s).toMatchObject({ kind: 'open', inMin: 60 });
  });
  it('круглосуточно и нераспознанный график', () => {
    expect(openState('Круглосуточно', kz('ср', '03:00'))).toEqual({ kind: 'always' });
    expect(openState('По записи', kz('ср', '03:00'))).toBeNull();
  });
});
