import { describe, expect, it } from 'vitest';
import { cargoFee, planShipments, splitOptions } from './shipments';
import { bonusFor, cartItem } from './catalog';
import { PRODUCTS } from '../mock';

const line = (key: string, qty: number, soldOut = false) => ({ p: cartItem(key, PRODUCTS)!, qty, soldOut });

describe('cargoFee', () => {
  it('тариф по весу', () => {
    expect(cargoFee(1)).toBe(3000);
    expect(cargoFee(300)).toBe(3000);
    expect(cargoFee(301)).toBe(5000);
    expect(cargoFee(1000)).toBe(5000);
    expect(cargoFee(1500)).toBe(7000);
    expect(cargoFee(5000)).toBe(7000);
  });
});

describe('planShipments', () => {
  it('только курьер: платная доставка ниже порога', () => {
    const plan = planShipments([line('b6', 1)]); // клей 2 190
    expect(plan.multi).toBe(false);
    expect(plan.list).toHaveLength(1);
    expect(plan.list[0]).toMatchObject({ kind: 'courier', label: 'Доставка', fee: 1000, feeText: '1 000 тг.', feeLabel: 'Доставка', meta: 'Курьер · 1 товар' });
    expect(plan.hasCourierFee).toBe(true);
  });
  it('курьер бесплатно от порога (по goodsTotal после скидки)', () => {
    expect(planShipments([line('t4', 1)]).list[0].feeText).toBe('Бесплатно'); // 32 900
    expect(planShipments([line('t4', 1)], { goodsTotal: 19999 }).fee).toBe(1000);
  });
  it('только Газель: тариф по весу, порог не действует', () => {
    const plan = planShipments([line('b1', 10)]); // 500 кг
    expect(plan.list[0]).toMatchObject({ kind: 'cargo', fee: 5000, kg: 500, label: 'Доставка', feeLabel: 'Доставка Газелью', meta: 'Газель · 500 кг · разгрузка у подъезда' });
    expect(plan.hasCourierFee).toBe(false);
  });
  it('вес в тоннах', () => {
    expect(planShipments([line('b1', 25)]).list[0].meta).toBe('Газель · 1,3 т · разгрузка у подъезда');
  });
  it('смешанная корзина: две доставки по умолчанию', () => {
    // 20 870 тг. товаров, после промокода −10% — 18 783: ниже порога, курьер платный
    const plan = planShipments([line('b1', 2), line('b6', 1), line('b4', 1)], { goodsTotal: 18783 });
    expect(plan.canSplit).toBe(true);
    expect(plan.multi).toBe(true);
    expect(plan.list.map(x => [x.kind, x.label, x.feeLabel, x.fee])).toEqual([
      ['courier', 'Доставка 1 из 2', 'Доставка сегодня, курьер', 1000],
      ['cargo', 'Доставка 2 из 2', 'Доставка завтра, Газель', 3000],
    ]);
    expect(plan.fee).toBe(4000);
  });
  it('«Всё вместе завтра» — одна Газель на всё', () => {
    const plan = planShipments([line('b1', 2), line('b6', 1)], { together: true });
    expect(plan.list).toHaveLength(1);
    expect(plan.list[0]).toMatchObject({ kind: 'cargo', qty: 3, kg: 125 });
  });
  it('распроданное не считается в сумме, весе и количестве', () => {
    const plan = planShipments([line('b1', 2, true), line('b6', 1)]);
    expect(plan.canSplit).toBe(false);
    expect(plan.list).toHaveLength(1);
    expect(plan.list[0]).toMatchObject({ kind: 'courier', qty: 1, fee: 1000 });
  });
  it('самовывоз: бесплатно, тяжёлое со склада', () => {
    const plan = planShipments([line('b1', 2), line('b6', 1)], { method: 'pickup', pickupPoint: 'ул. Кабанбай батыра, 11' });
    expect(plan.fee).toBe(0);
    expect(plan.list.map(x => [x.label, x.meta, x.feeText])).toEqual([
      ['Самовывоз 1 из 2', 'ул. Кабанбай батыра, 11 · храним 24 часа', 'Бесплатно'],
      ['Самовывоз 2 из 2', 'Склад, ш. Коргалжын, 3 · поможем погрузить', 'Бесплатно'],
    ]);
  });
  it('подъём на этаж: liftFee × шт × (этаж − 1), только Газель', () => {
    const plan = planShipments([line('b1', 3), line('b6', 2)], { floor: '5', lift: true });
    const cargo = plan.list.find(x => x.isCargo)!;
    expect(cargo.lift).toBe(200 * 3 * 4);
    expect(cargo.total).toBe(cargo.fee + 2400);
    expect(plan.list.find(x => x.isCourier)!.lift).toBe(0);
    expect(planShipments([line('b1', 3)], { floor: '1', lift: true }).lift).toBe(0);
    expect(planShipments([line('b1', 3)], { floor: '5', lift: true, method: 'pickup' }).lift).toBe(0);
  });
});

describe('splitOptions', () => {
  const lines = [line('b1', 2), line('b6', 1), line('b4', 1)];
  it('доставка', () => {
    expect(splitOptions(lines, { goodsTotal: 18783 })).toEqual([
      { id: 'split', together: false, title: 'Двумя доставками', sub: 'Сегодня — 2 товара курьером, завтра — 2 товара Газелью', feeText: '1 000 + 3 000 тг.', sel: true },
      { id: 'together', together: true, title: 'Всё вместе завтра', sub: 'Одной Газелью, 9:00–21:00', feeText: '3 000 тг.', sel: false },
    ]);
  });
  it('курьер бесплатно от порога', () => {
    expect(splitOptions(lines)[0].feeText).toBe('3 000 тг.');
  });
  it('самовывоз', () => {
    const o = splitOptions(lines, { method: 'pickup', together: true });
    expect(o.map(x => [x.title, x.feeText, x.sel])).toEqual([['Забрать в два приёма', 'Бесплатно', false], ['Всё завтра со склада', 'Бесплатно', true]]);
    expect(o[1].sub).toBe('Склад, ш. Коргалжын, 3, с 9:00');
  });
});

describe('bonusFor / cartItem', () => {
  it('bonusFor считает product.bonus × qty', () => {
    expect(bonusFor([line('b1', 2), line('b6', 1), line('b4', 1)])).toBe(87 * 2 + 45 + 390);
    expect(bonusFor([line('t1', 3)])).toBe(0);
    expect(bonusFor([{ bonus: 10 }, { bonus: 5, qty: 2 }])).toBe(20);
  });
  it('cartItem: вариант букета и цвет товара', () => {
    const roses = PRODUCTS.find(p => p.id === 'f1')!;
    const m = roses.variants!.find(v => v.size === 'M')!;
    expect(cartItem(m.id, PRODUCTS)).toMatchObject({ id: m.id, name: 'Розы Мандала, M', price: m.price, variant: 'M' });
    expect(cartItem('b4|Бежевый', PRODUCTS)).toMatchObject({ id: 'b4|Бежевый', name: 'Краска интерьерная белая, 10 л, бежевый' });
    expect(cartItem('nope', PRODUCTS)).toBeNull();
  });
});
