import { describe, expect, it } from 'vitest';
import * as api from './api';
import { PAGE_SIZE } from './config';

describe('lib/api (мок в форме контракта)', () => {
  it('GET /products: категория, пагинация, total', async () => {
    const r = await api.getProducts({ category: 'stroymaterialy' });
    expect(r.total).toBe(12);
    expect(r.items).toHaveLength(PAGE_SIZE);
    const p2 = await api.getProducts({ category: 'stroymaterialy', page: 2 });
    expect(p2.items).toHaveLength(4);
  });
  it('GET /products: сортировки и фильтры', async () => {
    const cheap = (await api.getProducts({ category: 'stroymaterialy', sort: 'cheap' })).items.map(p => p.price);
    expect(cheap).toEqual([...cheap].sort((a, b) => a! - b!));
    const sale = await api.getProducts({ category: 'stroymaterialy', sale: true });
    expect(sale.items.every(p => p.oldPrice)).toBe(true);
    const packs = await api.getProducts({ category: 'stroymaterialy', attrs: { packs: ['25 кг'] } });
    expect(packs.items.map(p => p.id).sort()).toEqual(['b10', 'b6', 'b9']);
    const range = await api.getProducts({ category: 'stroymaterialy', min: 2000, max: 3000 });
    expect(range.items.every(p => p.price! >= 2000 && p.price! <= 3000)).toBe(true);
  });
  it('GET /products/{id}: детали, images без плейсхолдеров', async () => {
    const b1 = await api.getProduct('b1');
    expect(b1.specs.length).toBe(14);
    expect(b1.images).toEqual(['/assets/b-cement.png']);
    const f1 = await api.getProduct('f1');
    expect(f1.images.length).toBe(2);
    await expect(api.getProduct('nope')).rejects.toThrow();
  });
  it('GET /search/suggest', async () => {
    const r = await api.searchSuggest('цемент');
    expect(r.total).toBe(4); // включая «Цементно-песчаная смесь»
    expect(r.categories).toEqual([]);
    expect((await api.searchSuggest('розы')).categories[0]).toMatchObject({ slug: 'rozy', parent: 'Цветы' });
  });
  it('POST /promo/check', async () => {
    expect(await api.checkPromo('mart10', 20000)).toEqual({ ok: true, pct: 10 });
    expect(await api.checkPromo('MART10', 1000)).toEqual({ error: 'minSum', minSum: 15000 });
    expect(await api.checkPromo('SPRING', 20000)).toEqual({ error: 'expired' });
    expect(await api.checkPromo('XXX', 20000)).toEqual({ error: 'notFound' });
  });
  it('POST /cart/validate пересчитывает отправления', async () => {
    const r = await api.validateCart({ b1: 2, b6: 1, 'f2|Розовый': 1 });
    expect(r.lines.map(l => l.id)).toEqual(['b1', 'b6', 'f2|Розовый']);
    expect(r.plan.multi).toBe(true);
  });
  it('GET /orders: форма контракта', async () => {
    const [o] = await api.getOrders();
    expect(Object.keys(o)).toEqual(expect.arrayContaining(['id', 'date', 'method', 'status', 'shipments', 'items', 'total', 'bonus']));
  });
});

describe('бонусы в моке', () => {
  it('начисления = bonusFor(состав), баланс = сумма истории', async () => {
    const b = await api.getBonus();
    const orders = await api.getOrders();
    expect(b.history[0].amount).toBe(orders.find(o => o.id === '8M-10311')!.bonus);
    expect(b.history[0].amount).toBe(536);
    expect(b.balance).toBe(b.history.reduce((s, h) => s + h.amount, 0));
  });
});

describe('заказ: оформление → статус → отмена', () => {
  const draft = {
    cart: { b1: 2, b6: 1 }, method: 'delivery' as const, city: 'astana', address: 'Кабанбай батыра, 11', pickupPointId: null,
    recipient: { name: 'Айгерим', phone: '+7 (700) 133-90-71' }, together: false, courierSlot: 'asap', cargoDay: 1, cargoInterval: 2,
    lift: false, useBonus: false, payment: 'kaspi' as const,
  };
  it('создаёт заказ с отправлениями и итогами', async () => {
    const { id } = await api.createOrder(draft);
    const o = await api.getOrder(id);
    expect(o).toMatchObject({ status: 'accepted', address: 'Астана, Кабанбай батыра, 11', total: 7970 + 1000 + 3000 });
    expect(o.shipments.map(s => s.kind)).toEqual(['courier', 'cargo']);
    expect(o.shipments[1].eta).toBe('28 сентября, 17:00–21:00');
    expect((await api.getOrders())[0].id).toBe(id);
    await api.cancelOrder(id);
    expect((await api.getOrder(id)).status).toBe('cancelled');
  });
  it('распроданное в корзине — 409', async () => {
    await expect(api.createOrder({ ...draft, cart: { b3: 1 } })).rejects.toThrow();
  });
  it('отменить переданный в доставку нельзя', async () => {
    await expect(api.cancelOrder('8M-10482')).rejects.toThrow('передан');
  });
  it('/cart/validate помечает распроданное в филиале', async () => {
    const r = await api.validateCart({ b3: 1, b1: 1 });
    expect(r.lines.find(l => l.id === 'b3')?.soldOut).toBe(true);
  });
});
