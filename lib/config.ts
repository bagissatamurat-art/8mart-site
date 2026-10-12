// Одно значение — одно место: пороги, тарифы, условия. Тексты интерфейса — lib/copy.ts.
// Источник — design_handoff_8mart_site/site/data.js. Значения — МОК, уточнить у бизнеса (см. README → открытые вопросы).
import { tg } from './domain/format';
import type { DeliveryType, OrderStatus, SortId } from './types';

export const BRAND = { name: '8mart', phone: '+7 700 133 90 71', phoneRaw: '+77001339071', email: 'mail@8mart.kz', instagram: '8mart_astana', tiktok: '8mart.kz' };

// Общие условия — пока адрес не выбран. fee — самая дешёвая зона, eta — разброс по зонам Астаны (resolve-delivery 8mart.kz, окт. 2026:
// «Зона 1» 2 000 тг / 30–45 мин, «Зона 2» 3 000 тг / 50–70 мин). С адресом — точная зона (lib/delivery). freeFrom — МОК, уточнить у бизнеса.
export const DELIVERY = { fee: 2000, freeFrom: 20000, minOrder: 3000, etaMin: 30, etaMax: 70 };
const ETA = `${DELIVERY.etaMin}–${DELIVERY.etaMax}`;

// Telegram-бот авторизации (мок — заменить на реальный). Ссылка с одноразовым токеном сессии от бэкенда.
export const TG_BOT = { username: 'mart8_auth_bot', link: (token: string) => 'https://t.me/mart8_auth_bot?start=' + token };
// Поддержка в WhatsApp (мок номера)
/** Приложение 8mart в сторах. Пусто — приложения ещё нет: значки с пометкой «Скоро», без ссылки. Вписать URL — станут ссылками. */
export const APP_LINKS = { appStore: '', googlePlay: '' };
export const SUPPORT_WA = '77001339071'; // WhatsApp поддержки — как в футере 8mart.kz

// Бонусы: 1 бонус = 1 тг, не сгорают; списать можно до maxPart% суммы товаров.
export const BONUS_RULES = { maxPart: 30 };

export const STORY_DURATION = 6000; // = --story-duration в tokens.css
export const STORIES_SEEN_KEY = '8mart.storiesSeen';
export const FAVORITES_KEY = '8mart.favorites';

export const PAGE_SIZE = 8;
export const SORTS: [SortId, string][] = [['popular', 'Сначала популярные'], ['cheap', 'Сначала дешевле'], ['expensive', 'Сначала дороже'], ['sale', 'Со скидкой'], ['bonus', 'С бонусами']];

// Фильтры по корневой категории: attr — поле товара (строка или массив). Цена от–до есть всегда.
export interface FilterDef { key: string; title: string; attr: 'pack' | 'colors' | 'sizes' }
export const CAT_FILTERS: Record<string, FilterDef[]> = {
  stroymaterialy: [{ key: 'packs', title: 'Фасовка', attr: 'pack' }],
  tsvety: [{ key: 'colors', title: 'Цвет', attr: 'colors' }],
  instrumenty: [], 'dlya-doma': [], podarki: [],
};

export const COLOR_SWATCH: Record<string, string> = { 'Розовый': '#F4A6C0', 'Красный': '#D7263D', 'Белый': '#FFFFFF', 'Голубой': '#9EC5F0', 'Жёлтый': '#F7D774', 'Микс': 'conic-gradient(#F4A6C0 0 25%,#FFFFFF 0 50%,#9EC5F0 0 75%,#F7D774 0)', 'Слоновая кость': '#F3EBD8', 'Светло-серый': '#D9DADC', 'Бежевый': '#E6D3B3' };

// Способ доставки зависит от товара: express — курьер за 30–70 мин (по зоне); cargo — тяжёлое/габаритное, грузовой машиной на следующий день; flowers — курьер, букет в коробке с водой.
export const DELIVERY_TYPES: Record<'express' | 'cargo' | 'flowers', DeliveryType> = {
  express: { tag: '', delivery: { when: `Сегодня, за ${ETA} минут`, price: 'от ' + tg(DELIVERY.fee) + ', бесплатно от ' + tg(DELIVERY.freeFrom), note: '' },
    pickup: { when: 'Через 30 минут', where: 'В наличии в 6 из 8 точек', note: 'Храним заказ 24 часа' } },
  cargo: { tag: 'Тяжёлый товар', delivery: { when: 'Завтра, интервал 9:00–21:00', price: 'от 3 000 тг — зависит от веса заказа', note: 'Привезём грузовой машиной. Разгрузка у подъезда, подъём на этаж — 200 тг за единицу за этаж' },
    pickup: { when: 'Завтра с 9:00', where: 'Только со склада: ш. Коргалжын, 3', note: 'Погрузим в машину. Храним заказ 3 дня' } },
  flowers: { tag: '', delivery: { when: `Сегодня, за ${ETA} минут`, price: 'от ' + tg(DELIVERY.fee) + ', бесплатно от ' + tg(DELIVERY.freeFrom), note: 'Привезём в коробке с водой, приложим открытку' },
    pickup: { when: 'Соберём за 40 минут', where: 'В 4 из 8 точек', note: 'Храним букет в холодильнике до конца дня' } },
};

// Отправления. Тарифы, окна и вес — МОК. В API: product.weightKg, order.shipments[].
export const SHIPPING = {
  courier: { name: 'Курьер', when: `Сегодня, за ${ETA} минут`, pickupWhen: 'Сегодня, через 30 минут',
    /** «Когда доставить» (03): «Ближайшее» сегодня + интервалы на days дней вперёд. Интервал сегодня доступен,
     *  если до его начала не меньше leadMin минут. Время — Казахстан. МОК: в проде слоты отдаёт бэкенд. */
    slots: { days: 3, leadMin: 60, intervals: ['09:00–12:00', '12:00–15:00', '15:00–18:00', '18:00–21:00'], asapUntil: '21:00' } },
  cargo: { name: 'Грузовой', when: 'Завтра, 9:00–21:00', pickupWhen: 'Завтра с 9:00', pickupWhere: 'Склад, ш. Коргалжын, 3',
    tiers: [{ upTo: 300, fee: 3000 }, { upTo: 1000, fee: 5000 }, { upTo: 1500, fee: 7000 }], liftFee: 200,
    /** Грузовой: с завтрашнего дня, days дней, интервалы. МОК: в проде — бэкенд. */
    slots: { days: 3, intervals: ['09:00–13:00', '13:00–17:00', '17:00–21:00'] } },
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; labelPickup?: string; tone: 'active' | 'ok' | 'bad' }> = {
  accepted: { label: 'Принят', tone: 'active' }, assembling: { label: 'Собираем', tone: 'active' }, onway: { label: 'Курьер в пути', tone: 'active' },
  ready: { label: 'Готов к выдаче', tone: 'active' }, done: { label: 'Доставлен', labelPickup: 'Выдан', tone: 'ok' }, cancelled: { label: 'Отменён', tone: 'bad' },
};

/** Отменить заказ можно, пока ни одно отправление не дошло до этого статуса (передано в доставку / готово к выдаче). */
export const CANCEL_BEFORE: OrderStatus[] = ['onway', 'ready', 'done', 'cancelled'];
/** Возврат денег при отмене. */
export const REFUND_DAYS = '1–3 рабочих дней';

// Промокод (мок): код, скидка %, минимальная сумма товаров
export const PROMO = { code: 'MART10', pct: 10, minSum: 15000 };

