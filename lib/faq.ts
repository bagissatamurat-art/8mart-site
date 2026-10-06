// Вопросы и ответы: тексты — lib/copy.ts, цифры — из конфига и списка филиалов (одно значение — одно место).
import { BONUS_RULES, BRAND, DELIVERY, REFUND_DAYS, SHIPPING } from './config';
import { faqItems } from './copy';
import { tg } from './domain/format';
import { SNAPSHOT_CITIES } from './branches';

export const FAQ: [string, string][] = faqItems({
  fee: tg(DELIVERY.fee), freeFrom: tg(DELIVERY.freeFrom), etaMin: DELIVERY.etaMin, etaMax: DELIVERY.etaMax,
  maxPart: BONUS_RULES.maxPart, refundDays: REFUND_DAYS,
  cities: SNAPSHOT_CITIES.map(c => c.name).join(', '),
  slots: SHIPPING.courier.slots.slice(1).map(([, label]) => label.toLowerCase()).join('; '),
  phone: BRAND.phone,
});
