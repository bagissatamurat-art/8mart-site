// Слоты доставки для оформления (03): дни и интервалы от текущего времени Казахстана.
// В проде их отдаёт бэкенд (GET /delivery/slots) — здесь мок той же формы, его зовёт lib/api.getDeliverySlots.
import { SHIPPING } from '../config';
import { KZ_UTC_OFFSET_MIN } from './hours';

export interface Slot {
  /** 'asap' или «YYYY-MM-DD|09:00–12:00». */
  id: string;
  /** «12:00–15:00» / «Ближайшее» */
  label: string;
  /** «~30 мин» — только у ближайшего. */
  sub?: string;
}
export interface SlotDay {
  /** YYYY-MM-DD */
  id: string;
  /** «Сегодня» / «Завтра» / «Чт» */
  title: string;
  /** «16 окт» */
  date: string;
  slots: Slot[];
}

const WEEK = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MON_FULL = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

/** Дата Казахстана через UTC-геттеры: смещаем время на +5 ч. */
const kz = (now: Date, plusDays = 0) => new Date(now.getTime() + KZ_UTC_OFFSET_MIN * 60000 + plusDays * 864e5);
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const minOf = (hhmm: string) => { const [h, m] = hhmm.slice(0, 5).split(':').map(Number); return h * 60 + m; };

function day(now: Date, plus: number, slots: Slot[]): SlotDay {
  const d = kz(now, plus);
  return { id: ymd(d), title: plus === 0 ? 'Сегодня' : plus === 1 ? 'Завтра' : WEEK[d.getUTCDay()], date: `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`, slots };
}
const interval = (dayId: string, label: string): Slot => ({ id: `${dayId}|${label}`, label });

/** Курьер: сегодня — «Ближайшее» (пока не поздно) и интервалы, до начала которых ≥ leadMin; дальше — все интервалы. */
export function courierSlots(now: Date, eta: string): SlotDay[] {
  const cfg = SHIPPING.courier.slots;
  const nowMin = kz(now).getUTCHours() * 60 + kz(now).getUTCMinutes();
  const out: SlotDay[] = [];
  for (let i = 0; i < cfg.days; i++) {
    const id = ymd(kz(now, i));
    const list = cfg.intervals.filter(x => i > 0 || minOf(x) - nowMin >= cfg.leadMin).map(x => interval(id, x));
    if (i === 0 && nowMin < minOf(cfg.asapUntil) && nowMin >= minOf(cfg.intervals[0]) - cfg.leadMin) list.unshift({ id: 'asap', label: 'Ближайшее', sub: eta });
    if (list.length) out.push(day(now, i, list));
  }
  return out;
}

/** Грузовой: с завтрашнего дня, все интервалы. */
export function cargoSlots(now: Date): SlotDay[] {
  const cfg = SHIPPING.cargo.slots;
  return Array.from({ length: cfg.days }, (_, k) => { const i = k + 1, id = ymd(kz(now, i)); return day(now, i, cfg.intervals.map(x => interval(id, x))); });
}

/** Подпись выбранного слота для шапки отправления: «Сегодня, 15:00–18:00», «Чт, 16 окт, 09:00–13:00». */
export function slotTitle(days: SlotDay[], id: string): string | null {
  for (const d of days) {
    const s = d.slots.find(x => x.id === id);
    if (!s) continue;
    if (s.id === 'asap') return null; // «Сегодня, за ~30 минут» — из planShipments
    return `${d.title}${d.title === 'Сегодня' || d.title === 'Завтра' ? '' : ', ' + d.date}, ${s.label}`;
  }
  return null;
}

/** Срок в заказе (мок): «16 октября, 09:00–13:00» из id слота. */
export function slotEta(id: string): string | null {
  const [date, label] = id.split('|');
  if (!label) return null;
  const [, m, d] = date.split('-').map(Number);
  return `${d} ${MON_FULL[m - 1]}, ${label}`;
}
