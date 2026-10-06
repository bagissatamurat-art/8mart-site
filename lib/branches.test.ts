// Филиалы 8mart.kz → города и точки самовывоза (lib/branches.ts).
import { describe, expect, it } from 'vitest';
import { citiesFrom, shortAddress, SNAPSHOT_CITIES, SNAPSHOT_POINTS, toPickupPoint, type RawBranch } from './branches';
import { isPointClosed } from './domain/hours';

const raw = (o: Partial<RawBranch>): RawBranch => ({
  id: 'x', name: '8MART - Тест 1', city: 'Астана', address: 'улица Тест 1', latitude: 51, longitude: 71, isOpen: true, isAcceptingOrders: true, ...o,
});

describe('филиалы 8mart.kz', () => {
  it('адрес коротко: «пр. Абылай хана, 32», «ул. Сыганак, 13»', () => {
    expect(shortAddress('проспект Абылай Хана 32')).toBe('пр. Абылай хана, 32');
    expect(shortAddress('улица Сыганак 13')).toBe('ул. Сыганак, 13');
    expect(shortAddress('проспект Абулхаир хана 1/3')).toBe('пр. Абулхаир хана, 1/3');
    expect(shortAddress('проспект Мангилик Ел 45кG')).toBe('пр. Мангилик Ел, 45кG');
    expect(shortAddress('проспект Абилкайыр Хана 65')).toBe('пр. Абилкайыр хана, 65');
  });
  it('вывеска — только если не 8MART; город — id сайта', () => {
    expect(toPickupPoint(raw({ name: 'ROMANTIC - Мангилик Ел 45' }))).toMatchObject({ brand: 'ROMANTIC', city: 'astana' });
    expect(toPickupPoint(raw({})).brand).toBeUndefined();
    expect(toPickupPoint(raw({ city: 'Кокшетау Г.А.' })).city).toBe('kokshetau');
  });
  it('города — те, где есть филиалы; Астана первой; неизвестный город — центр по филиалам', () => {
    expect(SNAPSHOT_CITIES[0].id).toBe('astana');
    for (const p of SNAPSHOT_POINTS) expect(SNAPSHOT_CITIES.map(c => c.id)).toContain(p.city);
    const [c] = citiesFrom([raw({ city: 'Новый', latitude: 50, longitude: 60 }), raw({ city: 'Новый', latitude: 52, longitude: 62 })]);
    expect(c).toMatchObject({ name: 'Новый', lat: 51, lng: 61 });
  });
  it('без графика закрытость — по живому isOpen', () => {
    expect(isPointClosed({ isOpen: false }, new Date())).toBe(true);
    expect(isPointClosed({ isOpen: true }, new Date())).toBe(false);
    expect(isPointClosed({}, new Date())).toBe(false);
  });
});
