import { describe, expect, it } from 'vitest';
import { toQuote } from './delivery';
import { planShipments } from './domain/shipments';
import { DELIVERY } from './config';

describe('зоны доставки', () => {
  it('ответ resolve-delivery → стоимость, время, филиал', () => {
    const q = toQuote({ branchId: 'b', branchName: '8MART - Сыганак 13', zoneName: 'Зона 2', deliveryCost: 3000.0, deliveryTimeMinutes: 50, kaspiIntegrated: false });
    expect(q).toEqual({ fee: 3000, eta: 50, branchId: 'b', branchName: '8MART, Сыганак 13', zone: 'Зона 2', kaspiIntegrated: false });
  });

  const lines = [{ p: { price: 5000, delivery: 'flowers' as const, weightKg: 1 }, qty: 1 }];
  it('курьер берёт стоимость и время зоны', () => {
    const c = planShipments(lines, { method: 'delivery', courierFee: 3000, courierEta: 50 }).list[0];
    expect(c.fee).toBe(3000);
    expect(c.when).toBe('Сегодня, за ~50 минут');
  });
  it('без зоны — общие условия; от порога — бесплатно', () => {
    expect(planShipments(lines, { method: 'delivery' }).list[0].fee).toBe(DELIVERY.fee);
    expect(planShipments(lines, { method: 'delivery', courierFee: 3000, goodsTotal: DELIVERY.freeFrom }).list[0].fee).toBe(0);
  });
});
