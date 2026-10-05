// Итоги заказа: корзина и оформление считают одинаково (02, 03). Сервер пересчитывает то же в /cart/validate и /orders.
import { DELIVERY } from '../config';
import { bonusFor } from './catalog';
import { money } from './format';
import { planShipments, type PlanLine, type PlanOptions, type ShipmentPlan } from './shipments';

export interface TotalsInput<L extends PlanLine> {
  lines: L[];
  plan?: PlanOptions;
  /** Скидка промокода, %; 0 — нет. */
  promoPct?: number;
  /** Списать бонусы (до maxPart% суммы товаров после скидки, не больше баланса). */
  useBonus?: boolean;
  balance?: number;
  maxPart?: number;
}

export interface Totals<L extends PlanLine> {
  /** Количество и сумма без распроданного. */
  count: number; goods: number; discount: number; afterDiscount: number;
  plan: ShipmentPlan<L>;
  /** Доставка + подъём на этаж. */
  fee: number;
  spendMax: number; spend: number; earn: number; total: number;
  hasSoldOut: boolean;
  /** Строки стоимости доставки для итогов (самовывоз — одна строка «Бесплатно»). */
  fees: { label: string; text: string; free: boolean; amount: number }[];
  /** Прогресс до бесплатной доставки курьером; null — не показываем. */
  progress: { pct: number; left: number; label: string } | null;
}

export function orderTotals<L extends PlanLine>({ lines, plan: opts = {}, promoPct = 0, useBonus = false, balance = 0, maxPart = 0 }: TotalsInput<L>): Totals<L> {
  const active = lines.filter(l => !l.soldOut);
  const goods = active.reduce((s, l) => s + (l.p.price || 0) * l.qty, 0);
  const count = active.reduce((s, l) => s + l.qty, 0);
  const discount = promoPct ? Math.round(goods * promoPct / 100) : 0;
  const afterDiscount = goods - discount;
  const plan = planShipments(lines, { ...opts, goodsTotal: afterDiscount });
  const fee = plan.fee + plan.lift;
  const spendMax = Math.min(balance, Math.floor(afterDiscount * maxPart / 100));
  const spend = useBonus ? spendMax : 0;
  const earn = bonusFor(active);
  const pickup = opts.method === 'pickup';
  const fees = pickup
    ? [{ label: 'Самовывоз', text: 'Бесплатно', free: true, amount: 0 }]
    : [...plan.list.map(x => ({ label: x.feeLabel, text: x.feeText, free: x.fee === 0, amount: x.fee })),
       ...(plan.lift > 0 ? [{ label: 'Подъём на этаж', text: money(plan.lift), free: false, amount: plan.lift }] : [])];
  const progress = !pickup && plan.hasCourierFee && afterDiscount > 0
    ? { pct: Math.min(100, Math.round(afterDiscount / DELIVERY.freeFrom * 100)), left: Math.max(0, DELIVERY.freeFrom - afterDiscount),
        label: plan.multi ? 'До бесплатной доставки курьером' : 'До бесплатной доставки' }
    : null;
  return { count, goods, discount, afterDiscount, plan, fee, spendMax, spend, earn, total: afterDiscount - spend + fee, hasSoldOut: lines.some(l => l.soldOut), fees, progress };
}
