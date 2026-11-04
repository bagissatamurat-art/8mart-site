// Плавающая миниатюра видео: место по сохранённому положению, магнит к краю, перетаскивание в пределах, фиксированное
// место при прокрутке карточки на компьютере.
import { describe, expect, it } from 'vitest';
import { FLOAT_START, floatClamp, floatFits, floatPlace, floatSnap, parseFloatPos, type FloatRect } from './videoFloat';

// Телефон 390×844: шапка 56 сверху, кнопка «В корзину» — нижние 96.
const zone: FloatRect = { left: 0, top: 56, right: 390, bottom: 748 };
const size = { w: 96, h: 171 };
const gap = 12;

describe('плавающая миниатюра видео', () => {
  it('по умолчанию — справа сверху, с отступом от края и шапки', () => {
    expect(floatPlace(FLOAT_START, { zone }, size, gap)).toEqual({ x: 390 - 12 - 96, y: 56 + 12 });
  });

  it('низ пути — над кнопкой «В корзину», а не на ней', () => {
    const p = floatPlace({ side: 'left', t: 1 }, { zone }, size, gap);
    expect(p).toEqual({ x: 12, y: 748 - 12 - 171 });
    expect(p.y + size.h).toBeLessThanOrEqual(zone.bottom - gap);
  });

  it('отпустили левее середины — к левому краю, правее — к правому; по вертикали — где отпустили', () => {
    expect(floatSnap({ x: 100, y: 300 }, { zone }, size, gap)).toMatchObject({ side: 'left' });
    expect(floatSnap({ x: 200, y: 300 }, { zone }, size, gap)).toMatchObject({ side: 'right' });
    const pos = floatSnap({ x: 40, y: 300 }, { zone }, size, gap);
    expect(floatPlace(pos, { zone }, size, gap).y).toBeCloseTo(300, 0);
  });

  it('за шапку и за нижнюю кнопку не утащить', () => {
    expect(floatClamp({ x: -50, y: 0 }, zone, size, gap)).toEqual({ x: 12, y: 68 });
    expect(floatClamp({ x: 999, y: 999 }, zone, size, gap)).toEqual({ x: 282, y: 565 });
    expect(floatSnap({ x: 999, y: 999 }, { zone }, size, gap)).toEqual({ side: 'right', t: 1 });
    expect(floatSnap({ x: -999, y: -999 }, { zone }, size, gap)).toEqual({ side: 'left', t: 0 });
  });

  it('положение — доля пути: после поворота экрана миниатюра у того же края на той же высоте пути', () => {
    const pos = floatSnap({ x: 282, y: 316 }, { zone }, size, gap);
    const landscape: FloatRect = { left: 0, top: 56, right: 844, bottom: 330 };
    const p = floatPlace(pos, { zone: landscape }, size, gap);
    expect(p.x).toBe(844 - 12 - 96);
    expect(p.y).toBeCloseTo(56 + 12 + (330 - 12 - 171 - 68) * pos.t, 5);
  });

  it('компьютер: при прокрутке стоит на месте экрана, край карточки только подталкивает', () => {
    const desk: FloatRect = { left: 40, top: 0, right: 520, bottom: 900 }; // колонка галереи на всю высоту окна
    const pos = { side: 'right' as const, t: 0.5 };
    const mid = floatPlace(pos, { zone: desk }, size, gap);
    // Карточка видна целиком ниже шапки — миниатюра на том же месте
    expect(floatPlace(pos, { zone: desk, clip: { left: 40, top: 150, right: 520, bottom: 2000 } }, size, gap)).toEqual(mid);
    // Конец карточки поднялся выше миниатюры — она прижимается к нему снизу
    const end = floatPlace(pos, { zone: desk, clip: { left: 40, top: -800, right: 520, bottom: 400 } }, size, gap);
    expect(end).toEqual({ x: mid.x, y: 400 - 12 - 171 });
  });

  it('не помещается (карточка ушла с экрана, окно низкое) — не показываем', () => {
    expect(floatFits(zone, size, gap)).toBe(true);
    expect(floatFits({ left: 0, top: 0, right: 390, bottom: 150 }, size, gap)).toBe(false);
    expect(floatFits(null, size, gap)).toBe(false);
  });

  it('сохранённое положение: мусор и чужие значения — null, доля зажата в 0…1', () => {
    expect(parseFloatPos('{"side":"left","t":0.4}')).toEqual({ side: 'left', t: 0.4 });
    expect(parseFloatPos('{"side":"left","t":7}')).toEqual({ side: 'left', t: 1 });
    expect(parseFloatPos('{"side":"top","t":0.4}')).toBeNull();
    expect(parseFloatPos('{"side":"left"}')).toBeNull();
    expect(parseFloatPos('не json')).toBeNull();
    expect(parseFloatPos(null)).toBeNull();
  });
});
