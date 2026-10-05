import { describe, expect, it } from 'vitest';
import { orderTotals } from './order';
import { cartItem } from './catalog';
import { PRODUCTS } from '../mock';

const line = (key: string, qty: number, soldOut = false) => ({ p: cartItem(key, PRODUCTS)!, qty, soldOut });

describe('orderTotals (02, 03)', () => {
  it('корзина 02: распроданное не в сумме и количестве, CTA блокируется', () => {
    const t = orderTotals({ lines: [line('b1', 2), line('b6', 1), line('b4', 1), line('b3', 1, true)], plan: { method: 'delivery' } });
    expect(t.count).toBe(4);
    expect(t.goods).toBe(20870);
    expect(t.hasSoldOut).toBe(true);
    expect(t.fees.map(f => f.text)).toEqual(['Бесплатно', '3 000 тг.']);
    expect(t.total).toBe(23870);
  });
  it('промокод −10%: порог бесплатной доставки считается после скидки', () => {
    const t = orderTotals({ lines: [line('b1', 2), line('b6', 1), line('b4', 1)], plan: { method: 'delivery' }, promoPct: 10 });
    expect(t.discount).toBe(2087);
    expect(t.fee).toBe(4000);
    expect(t.total).toBe(22783);
    expect(t.progress).toEqual({ pct: 94, left: 1217, label: 'До бесплатной доставки курьером' });
  });
  it('бонусы: списать до maxPart% суммы после скидки, не больше баланса; начисление по товарам', () => {
    const lines = [line('b1', 2), line('b6', 1), line('b4', 1)];
    const t = orderTotals({ lines, plan: { method: 'delivery' }, promoPct: 10, useBonus: true, balance: 1236, maxPart: 30 });
    expect(t.spendMax).toBe(1236);
    expect(t.spend).toBe(1236);
    expect(t.earn).toBe(87 * 2 + 45 + 390);
    const small = orderTotals({ lines: [line('h3', 1)], useBonus: true, balance: 1236, maxPart: 30 });
    expect(small.spendMax).toBe(207);
    expect(orderTotals({ lines, useBonus: false, balance: 1236, maxPart: 30 }).spend).toBe(0);
  });
  it('подъём на этаж — отдельной строкой', () => {
    const t = orderTotals({ lines: [line('b1', 2), line('b6', 1)], plan: { method: 'delivery', floor: '7', lift: true } });
    expect(t.fees.at(-1)).toEqual({ label: 'Подъём на этаж', text: '2 400 тг.', free: false, amount: 2400 });
  });
  it('самовывоз — одна строка «Бесплатно», без прогресса', () => {
    const t = orderTotals({ lines: [line('b6', 1)], plan: { method: 'pickup' } });
    expect(t.fees).toEqual([{ label: 'Самовывоз', text: 'Бесплатно', free: true, amount: 0 }]);
    expect(t.progress).toBeNull();
  });
});
