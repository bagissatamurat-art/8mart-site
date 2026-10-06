// Паритет с прототипом: результаты lib/domain и lib/mock совпадают с design_handoff_8mart_site/site/data.js.
// Цветы — уже не прототип, а настоящий каталог 8mart.kz (lib/flowers.ts): сверяем всё, кроме них (их проверяет flowers.test.ts).
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS-прототип без типов
import * as D from '../../design_handoff_8mart_site/site/data.js';
import * as F from './format';
import { planShipments, splitOptions, cargoFee } from './shipments';
import { bonusFor, cartItem, deliveryConditions } from './catalog';
import { PRODUCTS as ALL } from '../mock';
import * as C from '../config';
import * as T from '../copy';

const notFlower = (p: { delivery?: string }) => p.delivery !== 'flowers';
const PRODUCTS = ALL.filter(notFlower);
const D_PRODUCTS = (D.PRODUCTS as { delivery?: string }[]).filter(notFlower);
const fixPaths = <T,>(o: T): T => JSON.parse(JSON.stringify(o).replaceAll('"./assets/', '"/assets/'));

describe('мок = data.js', () => {
  it('PRODUCTS в итоговой форме (кроме цветов)', () => expect(PRODUCTS).toEqual(fixPaths(D_PRODUCTS)));
  it('конфиг', () => {
    expect(C.DELIVERY).toEqual(D.DELIVERY);
    const { slots: _slots, ...courier } = C.SHIPPING.courier;
    expect({ ...C.SHIPPING, courier }).toEqual(D.SHIPPING);
    expect(C.SORTS).toEqual(D.SORTS);
    expect(C.CAT_FILTERS).toEqual(D.CAT_FILTERS);
    expect(C.COLOR_SWATCH).toEqual(D.COLOR_SWATCH);
    expect(C.DELIVERY_TYPES).toEqual(D.DELIVERY_TYPES);
    expect(T.CTA_BLOCKED).toEqual(D.CTA_BLOCKED);
    expect(T.CART_ALERT).toEqual(D.CART_ALERT);
    expect(T.FORM_ERRORS).toMatchObject(D.FORM_ERRORS);
    expect(C.ORDER_STATUS).toEqual(D.ORDER_STATUS);
    expect(C.PAGE_SIZE).toBe(D.PAGE_SIZE);
    expect(C.STORY_DURATION).toBe(D.STORY_DURATION);
    expect(C.BONUS_RULES.maxPart).toBe(D.BONUS.maxPart);
    expect(T.PROMO_ERRORS.minSum(15000)).toBe(D.PROMO_ERRORS.minSum(15000));
  });
});

describe('функции = data.js', () => {
  it('money / plural / bonusText', () => {
    for (const n of [null, 0, 1, 7, 990, 1000, 4090, 20000, 1234567, 1999.5, -500]) expect(F.money(n)).toBe(D.money(n));
    for (let n = 0; n < 300; n++) {
      expect(F.plural(n, 'a', 'b', 'c')).toBe(D.plural(n, 'a', 'b', 'c'));
      expect(F.itemsTitle(n)).toBe(D.itemsTitle(n));
      expect(F.bonusText(n * 7)).toBe(D.bonusText(n * 7));
    }
  });
  it('formatPhone на наборах и стираниях', () => {
    const inputs = ['', ' ', '+', '7', '8', '9', '+7', '+77', '+8', '+9', '+99890', '87001339071', '7001339071', '+7 (700) 133-90-719', '+7 (700)133-90-71', '+7 700', 'abc', '+44 20 7946 0958 1234', '8 (700) 1'];
    const prevs = [undefined, '', '+7', '+7 (', '+7 (700) 133-90-71', '+7 (700'];
    for (const s of inputs) for (const p of prevs) expect([s, p, F.formatPhone(s, p)]).toEqual([s, p, D.formatPhone(s, p)]);
    // посимвольный набор и стирание с конца
    let a = '', b = '';
    for (const ch of '87001339071') { a = F.formatPhone(a + ch, a); b = D.formatPhone(b + ch, b); expect(a).toBe(b); }
    while (a) { const na = F.formatPhone(a.slice(0, -1), a), nb = D.formatPhone(b.slice(0, -1), b); expect(na).toBe(nb); if (na === a) break; a = na; b = nb; }
  });
  it('cartItem для всех ключей', () => {
    const keys = PRODUCTS.flatMap(p => p.variants ? p.variants.flatMap(v => [v.id, ...(p.colors || []).map(c => v.id + '|' + c)]) : [p.id, ...(p.colors || []).map(c => p.id + '|' + c)]);
    for (const k of [...keys, 'nope']) expect(cartItem(k, PRODUCTS)).toEqual(fixPaths(D.cartItem(k)));
  });
  it('cargoFee / deliveryConditions', () => {
    for (const kg of [0, 1, 299, 300, 301, 999, 1000, 1001, 1500, 9999]) expect(cargoFee(kg)).toBe(D.cargoFee(kg));
    for (const p of PRODUCTS) expect(deliveryConditions(p)).toEqual(D.productDetails(D.PRODUCTS.find((x: { id: string }) => x.id === p.id)).type);
  });
  it('planShipments / splitOptions / bonusFor на случайных корзинах', () => {
    let seed = 42; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const ids = PRODUCTS.flatMap(p => p.variants ? p.variants.map(v => v.id) : [p.id]);
    for (let i = 0; i < 400; i++) {
      const n = 1 + Math.floor(rnd() * 5);
      const keys = Array.from({ length: n }, () => ids[Math.floor(rnd() * ids.length)]);
      const spec = keys.map(k => ({ k, qty: 1 + Math.floor(rnd() * 30), soldOut: rnd() < 0.15 }));
      const opts = { method: rnd() < 0.3 ? 'pickup' : 'delivery', together: rnd() < 0.5, floor: String(Math.floor(rnd() * 12)), lift: rnd() < 0.5, pickupPoint: rnd() < 0.5 ? 'пр. Туран, 37' : '', ...(rnd() < 0.3 ? { goodsTotal: Math.floor(rnd() * 40000) } : {}) } as const;
      const ours = spec.map(s => ({ p: cartItem(s.k, PRODUCTS)!, qty: s.qty, soldOut: s.soldOut }));
      const theirs = spec.map(s => ({ p: D.cartItem(s.k), qty: s.qty, soldOut: s.soldOut }));
      expect(fixPaths(planShipments(ours, opts))).toEqual(fixPaths(planShipments(ours, opts)));
      expect(JSON.stringify(fixPaths(planShipments(ours, opts)))).toBe(JSON.stringify(fixPaths(D.planShipments(theirs, opts))));
      const sp = planShipments(ours, opts);
      if (sp.canSplit) expect(splitOptions(ours, opts)).toEqual(D.splitOptions(theirs, opts));
      expect(bonusFor(ours)).toBe(D.bonusFor(theirs));
    }
  });
});
