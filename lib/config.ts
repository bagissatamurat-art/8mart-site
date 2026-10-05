// Одно значение — одно место: пороги, тарифы, условия. Тексты интерфейса — lib/copy.ts.
// Источник — design_handoff_8mart_site/site/data.js. Значения — МОК, уточнить у бизнеса (см. README → открытые вопросы).
import { money } from './domain/format';
import type { DeliveryType, OrderStatus, SortId } from './types';

export const BRAND = { name: '8mart', phone: '+7 700 133 90 71', phoneRaw: '+77001339071', email: 'mail@8mart.kz', instagram: '8mart_astana', tiktok: '8mart.kz' };

export const DELIVERY = { fee: 1000, freeFrom: 20000, minOrder: 3000, etaMin: 60, etaMax: 90 };

// Telegram-бот авторизации (мок — заменить на реальный). Ссылка с одноразовым токеном сессии от бэкенда.
export const TG_BOT = { username: 'mart8_auth_bot', link: (token: string) => 'https://t.me/mart8_auth_bot?start=' + token };
// Поддержка в WhatsApp (мок номера)
export const SUPPORT_WA = '77000000000';

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

const tg = (n: number) => money(n).replace('тг.', 'тг');
// Способ доставки зависит от товара: express — курьер за 60–90 мин; cargo — тяжёлое/габаритное, грузовой машиной на следующий день; flowers — курьер, букет в коробке с водой.
export const DELIVERY_TYPES: Record<'express' | 'cargo' | 'flowers', DeliveryType> = {
  express: { tag: '', delivery: { when: 'Сегодня, за 60–90 минут', price: tg(DELIVERY.fee) + ', бесплатно от ' + tg(DELIVERY.freeFrom), note: '' },
    pickup: { when: 'Через 30 минут', where: 'В наличии в 6 из 8 точек', note: 'Храним заказ 24 часа' } },
  cargo: { tag: 'Тяжёлый товар', delivery: { when: 'Завтра, интервал 9:00–21:00', price: 'от 3 000 тг — зависит от веса заказа', note: 'Привезём грузовой машиной. Разгрузка у подъезда, подъём на этаж — 200 тг за единицу за этаж' },
    pickup: { when: 'Завтра с 9:00', where: 'Только со склада: ш. Коргалжын, 3', note: 'Погрузим в машину. Храним заказ 3 дня' } },
  flowers: { tag: '', delivery: { when: 'Сегодня, за 60–90 минут', price: tg(DELIVERY.fee) + ', бесплатно от ' + tg(DELIVERY.freeFrom), note: 'Привезём в коробке с водой, приложим открытку' },
    pickup: { when: 'Соберём за 40 минут', where: 'В 4 из 8 точек', note: 'Храним букет в холодильнике до конца дня' } },
};

// Отправления. Тарифы, окна и вес — МОК. В API: product.weightKg, order.shipments[].
export const SHIPPING = {
  courier: { name: 'Курьер', when: 'Сегодня, за 60–90 минут', pickupWhen: 'Сегодня, через 30 минут',
    /** «Когда доставить» в оформлении (03). asap — ближайшее. */
    slots: [['asap', 'Ближайшее, 60–90 мин'], ['12-15', 'Сегодня 12:00–15:00'], ['15-18', 'Сегодня 15:00–18:00'], ['tmr', 'Завтра, утро']] as [string, string][] },
  cargo: { name: 'Газель', when: 'Завтра, 9:00–21:00', pickupWhen: 'Завтра с 9:00', pickupWhere: 'Склад, ш. Коргалжын, 3',
    tiers: [{ upTo: 300, fee: 3000 }, { upTo: 1000, fee: 5000 }, { upTo: 1500, fee: 7000 }], liftFee: 200,
    days: ['Завтра, 27 сентября', 'Пн, 28 сентября', 'Вт, 29 сентября'], intervals: ['9:00–13:00', '13:00–17:00', '17:00–21:00'] },
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

