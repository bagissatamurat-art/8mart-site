// Отправления: один заказ может приехать несколькими доставками. Перенесено 1:1 из data.js.
// Товар с delivery 'cargo' (тяжёлый/габаритный) едет Газелью на следующий день; остальные (express, flowers) — курьером сегодня.
// Если в корзине есть оба типа — клиент выбирает: двумя доставками или всё вместе завтра Газелью.
import { DELIVERY, SHIPPING } from '../config';
import { money, itemsTitle } from './format';
import type { Method, Product, ShipmentKind } from '../types';

export interface PlanLine { p: Pick<Product, 'price' | 'delivery' | 'weightKg'> & Partial<Product>; qty: number; soldOut?: boolean }
export interface PlanOptions { method?: Method; together?: boolean; goodsTotal?: number; pickupPoint?: string; floor?: string | number; lift?: boolean }

export interface Shipment<L extends PlanLine = PlanLine> {
  id: ShipmentKind; kind: ShipmentKind; index: number; lines: L[]; qty: number; kg: number; cargoUnits: number;
  fee: number; lift: number; total: number; label: string; when: string; meta: string; where: string;
  feeLabel: string; feeText: string; feeColor: string; isCargo: boolean; isCourier: boolean;
}
export interface ShipmentPlan<L extends PlanLine = PlanLine> {
  canSplit: boolean; together: boolean; multi: boolean; list: Shipment<L>[]; fee: number; lift: number; hasCourierFee: boolean;
}
export interface SplitOption { id: 'split' | 'together'; together: boolean; title: string; sub: string; feeText: string; sel: boolean }

export function cargoFee(kg: number): number {
  const t = SHIPPING.cargo.tiers;
  return (t.find(x => kg <= x.upTo) || t[t.length - 1]).fee;
}

const fmtKg = (kg: number) => (kg >= 1000 ? (Math.round(kg / 100) / 10).toString().replace('.', ',') + ' т' : Math.round(kg) + ' кг');

/** lines: [{p, qty, soldOut}] · opts: { method, together, goodsTotal (после скидки, для порога бесплатной доставки), pickupPoint, floor, lift } */
export function planShipments<L extends PlanLine>(lines: L[], opts: PlanOptions = {}): ShipmentPlan<L> {
  const method = opts.method || 'delivery', pk = method === 'pickup';
  const isCargo = (l: L) => l.p.delivery === 'cargo';
  const heavy = lines.filter(isCargo), light = lines.filter(l => !isCargo(l));
  const act = (ls: L[]) => ls.filter(l => !l.soldOut);
  const canSplit = act(heavy).length > 0 && act(light).length > 0;
  const together = canSplit && !!opts.together;
  const groups: [ShipmentKind, L[]][] = !act(heavy).length ? [['courier', lines]] : !act(light).length ? [['cargo', lines]] : together ? [['cargo', lines]] : [['courier', light], ['cargo', heavy]];
  const n = groups.length, gt = opts.goodsTotal ?? act(lines).reduce((s, l) => s + (l.p.price || 0) * l.qty, 0);
  const list = groups.map(([kind, ls], i): Shipment<L> => {
    const a = act(ls), kg = a.reduce((s, l) => s + (l.p.weightKg || 1) * l.qty, 0), qty = a.reduce((s, l) => s + l.qty, 0);
    const cargoUnits = a.filter(isCargo).reduce((s, l) => s + l.qty, 0);
    const base = pk ? 0 : kind === 'cargo' ? cargoFee(kg) : gt >= DELIVERY.freeFrom ? 0 : DELIVERY.fee;
    const floor = parseInt(String(opts.floor), 10) || 0, lift = !pk && kind === 'cargo' && opts.lift && floor > 1 ? SHIPPING.cargo.liftFee * cargoUnits * (floor - 1) : 0;
    const label = pk ? (n > 1 ? 'Самовывоз ' + (i + 1) + ' из ' + n : 'Самовывоз') : (n > 1 ? 'Доставка ' + (i + 1) + ' из ' + n : 'Доставка');
    const when = pk ? SHIPPING[kind].pickupWhen : SHIPPING[kind].when;
    const where = pk ? (kind === 'cargo' ? SHIPPING.cargo.pickupWhere : (opts.pickupPoint || '')) : '';
    const meta = pk ? [where, kind === 'cargo' ? 'поможем погрузить' : 'храним 24 часа'].filter(Boolean).join(' · ')
      : kind === 'cargo' ? 'Газель · ' + fmtKg(kg) + ' · разгрузка у подъезда' : 'Курьер · ' + itemsTitle(qty);
    return { id: kind, kind, index: i + 1, lines: ls, qty, kg: Math.round(kg), cargoUnits, fee: base, lift, total: base + lift, label, when, meta, where,
      feeLabel: pk ? 'Самовывоз' : kind === 'cargo' ? (n > 1 ? 'Доставка завтра, Газель' : 'Доставка Газелью') : (n > 1 ? 'Доставка сегодня, курьер' : 'Доставка'),
      feeText: base === 0 ? 'Бесплатно' : money(base), feeColor: base === 0 ? '#1DA765' : '#17151A', isCargo: kind === 'cargo', isCourier: kind === 'courier' };
  });
  return { canSplit, together, multi: n > 1, list, fee: list.reduce((s, x) => s + x.fee, 0), lift: list.reduce((s, x) => s + x.lift, 0), hasCourierFee: list.some(x => x.isCourier && x.fee > 0) };
}

/** Варианты для выбора «как привезти» (показываются, только если plan.canSplit). */
export function splitOptions<L extends PlanLine>(lines: L[], opts: PlanOptions = {}): SplitOption[] {
  const pk = opts.method === 'pickup';
  const a = planShipments(lines, { ...opts, together: false }), b = planShipments(lines, { ...opts, together: true });
  const [c, g] = a.list;
  const f = (pl: ShipmentPlan<L>) => pl.fee === 0 ? 'Бесплатно' : pl.list.map(x => x.fee).filter(Boolean).map(money).join(' + ').replace(/ тг\.(?= \+)/g, '');
  return [
    { id: 'split', together: false, title: pk ? 'Забрать в два приёма' : 'Двумя доставками', sub: pk ? 'Сегодня — ' + itemsTitle(c.qty) + ' в выбранной точке, завтра — ' + itemsTitle(g.qty) + ' со склада' : 'Сегодня — ' + itemsTitle(c.qty) + ' курьером, завтра — ' + itemsTitle(g.qty) + ' Газелью', feeText: f(a), sel: !opts.together },
    { id: 'together', together: true, title: pk ? 'Всё завтра со склада' : 'Всё вместе завтра', sub: pk ? SHIPPING.cargo.pickupWhere + ', с 9:00' : 'Одной Газелью, 9:00–21:00', feeText: f(b), sel: !!opts.together },
  ];
}
