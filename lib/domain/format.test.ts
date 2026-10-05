import { describe, expect, it } from 'vitest';
import { bonusText, formatPhone, itemsTitle, money, phoneComplete, plural, tg } from './format';

describe('tg', () => {
  it('сумма внутри фразы — без точки', () => {
    expect(tg(20000)).toBe('20 000 тг');
  });
});

describe('money', () => {
  it('формат «4 090 тг.» с обычным пробелом', () => {
    expect(money(4090)).toBe('4 090 тг.');
    expect(money(1234567)).toBe('1 234 567 тг.');
    expect(money(0)).toBe('0 тг.');
    expect(money(990)).toBe('990 тг.');
    expect(money(4090)).not.toMatch(/ /);
  });
  it('округляет', () => {
    expect(money(1999.5)).toBe('2 000 тг.');
    expect(money(2087.4)).toBe('2 087 тг.');
  });
  it('нет цены → «Цена уточняется»', () => {
    expect(money(null)).toBe('Цена уточняется');
    expect(money(undefined)).toBe('Цена уточняется');
  });
});

describe('plural / itemsTitle', () => {
  const cases: [number, string][] = [[0, 'товаров'], [1, 'товар'], [2, 'товара'], [4, 'товара'], [5, 'товаров'], [11, 'товаров'], [12, 'товаров'], [14, 'товаров'], [21, 'товар'], [22, 'товара'], [25, 'товаров'], [101, 'товар'], [111, 'товаров'], [112, 'товаров'], [1001, 'товар']];
  it.each(cases)('%i → %s', (n, w) => expect(plural(n, 'товар', 'товара', 'товаров')).toBe(w));
  it('itemsTitle', () => {
    expect(itemsTitle(3)).toBe('3 товара');
    expect(itemsTitle(11)).toBe('11 товаров');
  });
  it('bonusText', () => {
    expect(bonusText(1)).toBe('+1 бонус');
    expect(bonusText(87)).toBe('+87 бонусов');
    expect(bonusText(1240)).toBe('+1 240 бонусов');
    expect(bonusText(3)).toBe('+3 бонуса');
  });
});

/** Печатаем строку посимвольно, как пользователь. */
const type = (s: string, from = '') => [...s].reduce((v, ch) => formatPhone(v + ch, v), from);

describe('formatPhone', () => {
  it('маска +7 (999) 999-99-99 при наборе', () => {
    expect(type('77001339071')).toBe('+7 (700) 133-90-71');
    // «+» сразу дописывает 7
    expect(type('+7001339071')).toBe('+7 (700) 133-90-71');
    // вставка целиком / автозаполнение
    expect(formatPhone('+77001339071')).toBe('+7 (700) 133-90-71');
    // первая набранная 7 — код страны
    expect(type('7001339071')).toBe('+7 (001) 339-07-1');
  });
  it('ведущая 8 → +7', () => {
    expect(type('87001339071')).toBe('+7 (700) 133-90-71');
    expect(formatPhone('8')).toBe('+7');
    expect(formatPhone('8 700 133 90 71')).toBe('+7 (700) 133-90-71');
  });
  it('лишние цифры обрезаются', () => {
    expect(formatPhone('+7 (700) 133-90-719')).toBe('+7 (700) 133-90-71');
  });
  it('промежуточные состояния', () => {
    expect(formatPhone('7')).toBe('+7');
    expect(formatPhone('+7 (70')).toBe('+7 (70');
    expect(formatPhone('+7 (700) 1')).toBe('+7 (700) 1');
    expect(formatPhone('+7 (700) 133-9')).toBe('+7 (700) 133-9');
  });
  it('иной код после + — свободный международный формат', () => {
    expect(formatPhone('+998 90 123-45-67')).toBe('+998 90 1234567');
    expect(formatPhone('+44 20 7946 0958 1234')).toBe('+44 20 7946 0958');
    expect(formatPhone('+')).toBe('+7');
  });
  it('Backspace по символу маски стирает соседнюю цифру', () => {
    // курсор после «) » — стёрли пробел
    expect(formatPhone('+7 (700)133-90-71', '+7 (700) 133-90-71')).toBe('+7 (701) 339-07-1');
    // стёрли дефис
    expect(formatPhone('+7 (700) 13390-71', '+7 (700) 133-90-71')).toBe('+7 (700) 139-07-1');
    // стёрли «(»: слева только префикс +7 — его не трогаем, маска восстанавливается
    expect(formatPhone('+7 700', '+7 (700')).toBe('+7 (700');
  });
  it('пустое поле — действительно пустое', () => {
    expect(formatPhone('')).toBe('');
    expect(formatPhone('   ')).toBe('');
    expect(formatPhone('+', '+7')).toBe('');
    expect(formatPhone('+7', '+7 (')).toBe('');
  });
  it('phoneComplete', () => {
    expect(phoneComplete('+7 (700) 133-90-71')).toBe(true);
    expect(phoneComplete('+7 (700) 133-90-7')).toBe(false);
    expect(phoneComplete('+998 90 1234567')).toBe(false);
  });
});
