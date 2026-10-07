// Слой данных. Сейчас отвечает моком (lib/mock.ts) в форме API-контракта из README.
// Чтобы перейти на бэкенд, замените тело функций на fetch(`${API_URL}/...`) — сигнатуры и формы ответов не меняются.
import * as M from './mock';
import { CANCEL_BEFORE, CAT_FILTERS, PAGE_SIZE, PROMO, SHIPPING } from './config';
import { cartItem, orderTotals, planShipments, type PlanOptions, type ShipmentPlan } from './domain';
import { FLOWER_COMPOSITION } from './flowers';
import { fetchLiveStories } from './stories';
import type {
  Address, Banner, Bonus, Card, CartProduct, Category, City, Order, OrderDraft, PickupPoint, Product, ProductDetail,
  ProductQuery, PromoCheck, Story, User, UserPromo,
} from './types';

/** Задержка мока, чтобы экраны проходили через состояние загрузки. */
/** Задержка мока только в браузере (видны состояния загрузки); на сервере — без задержки. */
const LATENCY = typeof window === 'undefined' ? 0 : 250;
const reply = <T,>(data: T, ms = LATENCY): Promise<T> =>
  new Promise(res => setTimeout(() => res(structuredClone(data)), ms));

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// ── Каталог ──

/** GET /categories */
export const getCategories = (): Promise<Category[]> => reply(M.CATEGORIES);

const attrValues = (p: Product, attr: string): string[] => {
  const v = (p as unknown as Record<string, unknown>)[attr];
  return Array.isArray(v) ? v as string[] : v ? [String(v)] : [];
};
const discount = (x: Product) => (x.oldPrice && x.price ? 1 - x.price / x.oldPrice : 0);

/** Товары без пагинации — общая выборка для /products и подсчёта фасетов. Логика — из 07 Каталог.dc.html. */
function selectProducts(q: ProductQuery): Product[] {
  const P = M.PRODUCTS;
  const root = q.category ? M.CATEGORIES.find(c => c.slug === q.category) : undefined;
  let list = P.filter(x =>
    (!root || root.sub.some(s => s.slug === x.cat)) &&
    (!q.sub || x.cat === q.sub) &&
    (!q.q || x.name.toLowerCase().includes(q.q.trim().toLowerCase())));
  const defs = root ? CAT_FILTERS[root.slug] || [] : [];
  const A = q.attrs || {};
  list = list.filter(x =>
    (!q.min || (x.price != null && x.price >= q.min)) &&
    (!q.max || (x.price != null && x.price <= q.max)) &&
    (!q.sale || !!x.oldPrice) &&
    defs.every(g => !(A[g.key] || []).length || attrValues(x, g.attr).some(v => A[g.key].includes(v))));
  // inStock: в моке распроданных в каталоге нет — фильтр ничего не убирает.
  const pr = (x: Product) => (x.price == null ? Infinity : x.price);
  if (q.sort === 'cheap') list = [...list].sort((a, b) => pr(a) - pr(b));
  if (q.sort === 'expensive') list = [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  if (q.sort === 'sale') list = [...list].sort((a, b) => discount(b) - discount(a));
  if (q.sort === 'bonus') list = [...list].sort((a, b) => (b.bonus || 0) - (a.bonus || 0));
  return list;
}

/** GET /products?category&sub&q&sort&page&min&max&sale&inStock&<attr>. page — с 1, размер страницы PAGE_SIZE. */
export function getProducts(q: ProductQuery = {}): Promise<{ items: Product[]; total: number }> {
  const all = selectProducts(q), page = Math.max(1, q.page || 1);
  return reply({ items: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: all.length });
}

/** Фасеты для MartFilters: значения атрибутов в текущей выборке со счётчиками. */
export function getFacets(q: Pick<ProductQuery, 'category' | 'sub'>): Promise<{ key: string; title: string; items: [string, number][] }[]> {
  const defs = q.category ? CAT_FILTERS[q.category] || [] : [];
  const scope = selectProducts({ category: q.category, sub: q.sub });
  return reply(defs.map(g => {
    const cnt: Record<string, number> = {};
    scope.forEach(x => attrValues(x, g.attr).forEach(v => { cnt[v] = (cnt[v] || 0) + 1; }));
    return { key: g.key, title: g.title, items: Object.entries(cnt) };
  }), 0);
}

/** GET /products/{id} → Product + description, specs, images, conditions. */
export function getProduct(id: string): Promise<ProductDetail> {
  const p = M.PRODUCTS.find(x => x.id === id);
  if (!p) return Promise.reject(new ApiError(404, 'Товар не найден'));
  const det = M.PRODUCT_DETAILS[p.id];
  const images = p.variants
    ? [...new Set([p.img, ...p.variants.map(v => v.img)].filter((s): s is string => !!s))]
    : p.img ? [p.img] : [];
  const description = det?.description ?? (p.variants ? M.FLOWER_DESC : M.DEFAULT_DESC);
  // Букет: состав по размерам — из каталога 8mart.kz (lib/flowers.ts).
  const specs = det?.specs ?? (FLOWER_COMPOSITION[p.id]?.length ? FLOWER_COMPOSITION[p.id].map(([size, c]) => [`Размер ${size}`, c] as [string, string]) : ([['Фасовка', p.pack || p.weight], ['Производитель', 'Уточняется']] as [string, string][]).filter(r => r[1]));
  return reply({ ...p, images, description, specs });
}

/** Все id товаров — для статической сборки страниц /product/[id] (в проде — sitemap бэкенда). */
export const getAllProductIds = (): Promise<string[]> => reply(M.PRODUCTS.map(p => p.id), 0);

/** GET /products?ids=… — избранное в кабинете. */
export const getProductsByIds = (ids: string[]): Promise<Product[]> =>
  reply(ids.map(id => M.PRODUCTS.find(p => p.id === id)).filter((p): p is Product => !!p));

/** Товары одной группы (фасовки) — для переключателя в карточке. */
export const getGroup = (group: string): Promise<Product[]> => reply(M.PRODUCTS.filter(p => p.group === group), 0);

/** GET /search/suggest?q */
export function searchSuggest(q: string): Promise<{ categories: { slug: string; name: string; parent: string; count: number }[]; products: Product[]; total: number }> {
  const ql = q.trim().toLowerCase();
  if (!ql) return reply({ categories: [], products: [], total: 0 }, 0);
  const cats = M.CATEGORIES.flatMap(c => c.sub.map(s => ({ ...s, parent: c.name })));
  const categories = cats.filter(c => c.name.toLowerCase().includes(ql)).map(c => ({ ...c, count: M.PRODUCTS.filter(x => x.cat === c.slug).length }));
  const hits = M.PRODUCTS.filter(x => x.name.toLowerCase().includes(ql));
  return reply({ categories, products: hits.slice(0, 6), total: hits.length }, 150);
}

/** GET /stories */
/** GET /stories — настоящие сторис 8mart.kz (видео) первыми, затем сторис сайта. Настоящие — только на сервере (кэш 5 мин). */
export const getStories = (): Promise<Story[]> =>
  typeof window === 'undefined' ? fetchLiveStories().then(live => [...live, ...M.STORIES]) : reply(M.STORIES);
/** GET /banners */
export const getBanners = (): Promise<Banner[]> => reply(M.BANNERS);

// ── Корзина ──

/** Синхронный разбор ключа корзины по моку — для клиентских сторов до ответа /cart/validate. */
export const resolveCartItem = (key: string): CartProduct | null => cartItem(key, M.PRODUCTS);

/** Мок наличия в филиале: распроданные позиции (сервер вернёт soldOut в /cart/validate). Ключ цветов — по id варианта. */
const isSoldOut = (key: string) => M.SOLD_OUT_IN_BRANCH.includes(key.split('|')[0]);

/** POST /cart/validate — сервер пересчитывает цены, наличие и отправления. */
export function validateCart(cart: Record<string, number>, opts: PlanOptions = {}): Promise<{
  lines: { id: string; qty: number; soldOut: boolean; price: number | null }[];
  plan: ShipmentPlan<{ p: CartProduct; qty: number; soldOut: boolean }>;
}> {
  const resolved = Object.entries(cart).map(([id, qty]) => ({ p: resolveCartItem(id), qty, soldOut: isSoldOut(id) }))
    .filter((l): l is { p: CartProduct; qty: number; soldOut: boolean } => !!l.p);
  const plan = planShipments(resolved, opts);
  return reply({ lines: resolved.map(l => ({ id: l.p.id, qty: l.qty, soldOut: l.soldOut, price: l.p.price })), plan });
}

/** «Не забыть» в корзине (02): сопутствующие товары, которых ещё нет в корзине. В проде — рекомендации бэкенда. */
/** «Не забыть» в корзине — к букету: открытка, шары, упаковка. */
const UPSELL = ['g3', 'g4', 'g5', 'g1', 'g2'];
export const getUpsell = (cartKeys: string[]): Promise<Product[]> =>
  reply(UPSELL.filter(id => !cartKeys.includes(id)).map(id => M.PRODUCTS.find(p => p.id === id)!).filter(Boolean).slice(0, 5), 0);

// ── Способ получения ──

/** GET /cities */
export const getCities = (): Promise<City[]> => reply(M.CITIES, 0);
/** GET /pickup-points?city */
/** GET /pickup-points?city — настоящие филиалы 8mart.kz. В браузере — живой статус через /api/branches (кэш 60 с),
 *  на сервере и при сбое — снимок (lib/branches.snapshot.json). */
let live: { at: number; points: Promise<PickupPoint[]> } | null = null;
export function getPickupPoints(city: string): Promise<PickupPoint[]> {
  const inCity = (ps: PickupPoint[]) => ps.filter(p => p.city === city);
  if (typeof window === 'undefined') return reply(inCity(M.PICKUP_POINTS), 0);
  if (!live || Date.now() - live.at > 60_000) {
    live = {
      at: Date.now(),
      points: fetch('/api/branches').then(r => (r.ok ? r.json() : Promise.reject(r.status))).then((d: { points: PickupPoint[] }) => d.points)
        .catch(() => { live = null; return M.PICKUP_POINTS; }),
    };
  }
  return live.points.then(inCity);
}

/** lat/lng могут отсутствовать (у DaData координаты есть не у всех подсказок). */
export interface GeoSuggestion { title: string; subtitle: string; lat: number | null; lng: number | null; hasHouse: boolean }
/** GET /geo/suggest?q&city — прокси DaData на нашем сервере (app/api/geo/suggest). Ключ — только на сервере. */
export async function geoSuggest(q: string, city: string, signal?: AbortSignal): Promise<GeoSuggestion[]> {
  const r = await fetch(`/api/geo/suggest?${new URLSearchParams({ q, city })}`, { signal });
  if (!r.ok) throw new ApiError(r.status, 'Сервис подсказок недоступен');
  return r.json();
}
/** GET /geo/reverse?lat&lng */
export async function geoReverse(lat: number, lng: number): Promise<{ address: string; city: string; hasHouse?: boolean } | null> {
  const r = await fetch(`/api/geo/reverse?${new URLSearchParams({ lat: String(lat), lng: String(lng) })}`);
  if (!r.ok) throw new ApiError(r.status, 'Сервис геокодирования недоступен');
  return r.json();
}

// ── Промокод ──

/** POST /promo/check {code, goodsTotal} */
export function checkPromo(code: string, goodsTotal: number): Promise<PromoCheck> {
  const c = code.trim().toUpperCase();
  const promo = M.USER_PROMOS.find(p => p.code === c);
  if (promo?.status === 'expired') return reply({ error: 'expired' });
  if (c !== PROMO.code) return reply({ error: 'notFound' });
  if (goodsTotal < PROMO.minSum) return reply({ error: 'minSum', minSum: PROMO.minSum });
  return reply({ ok: true, pct: PROMO.pct });
}

// ── Авторизация ── (мок: код 1234 верный, остальные — неверный)

/** POST /auth/code {phone, channel:'whatsapp'} */
export const authCode = (_phone: string): Promise<{ ok: true }> => reply({ ok: true });
/** POST /auth/verify {phone, code} */
export function authVerify(phone: string, code: string): Promise<{ accessToken: string; user: { name?: string } }> {
  if (code !== '1234') return Promise.reject(new ApiError(400, 'code'));
  return reply({ accessToken: 'mock-token', user: phone === M.USER.phone ? { name: M.USER.name } : {} });
}
/** POST /auth/tg → {token} */
export const authTg = (): Promise<{ token: string }> => reply({ token: Math.random().toString(36).slice(2, 10) });
/** GET /auth/tg/{token} */
// Мок: бот «подтверждает» номер на третьем опросе.
const tgPolls = new Map<string, number>();
export function authTgStatus(token: string): Promise<{ status: 'pending' | 'ok'; phone?: string }> {
  const n = (tgPolls.get(token) || 0) + 1; tgPolls.set(token, n);
  return reply(n >= 3 ? { status: 'ok', phone: M.USER.phone } : { status: 'pending' });
}

// ── Заказы ──
// Мок: созданные на сайте заказы и отмены живут в localStorage '8mart.mockOrders' (в проде — бэкенд).

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const MOCK_ORDERS_KEY = '8mart.mockOrders';
type MockOrders = { placed: Order[]; cancelled: Record<string, string> };
const readMock = (): MockOrders => {
  // На сервере хранилища нет (обращение к localStorage в Node даёт предупреждение); в тестах его подставляет vitest.setup.
  const ls = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  if (typeof window === 'undefined' && !(ls && 'value' in ls)) return { placed: [], cancelled: {} };
  try { const v = JSON.parse(globalThis.localStorage?.getItem(MOCK_ORDERS_KEY) || 'null'); if (v?.placed && !Array.isArray(v.cancelled)) return v; } catch { /* нет хранилища */ }
  return { placed: [], cancelled: {} };
};
const writeMock = (m: MockOrders) => { if (typeof window === 'undefined' && !('value' in (Object.getOwnPropertyDescriptor(globalThis, 'localStorage') ?? {}))) return; try { globalThis.localStorage?.setItem(MOCK_ORDERS_KEY, JSON.stringify(m)); } catch { /* нет хранилища */ } };
const allOrders = (): Order[] => {
  const m = readMock();
  return [...m.placed, ...M.ORDERS].map(o => (m.cancelled[o.id]
    ? { ...o, status: 'cancelled' as const, shipments: o.shipments.map(sh => ({ ...sh, status: 'cancelled' as const, times: [sh.times?.[0] ?? '', m.cancelled[o.id]] })) } : o));
};

const plusMin = (d: Date, m: number) => { const x = new Date(d.getTime() + m * 60000); x.setMinutes(Math.ceil(x.getMinutes() / 5) * 5); return x; };

/** POST /orders → {id, payUrl?}. Мок: считает итоги, кладёт заказ в «Мои заказы». */
export function createOrder(d: OrderDraft): Promise<{ id: string; payUrl?: string }> {
  const lines = Object.entries(d.cart).map(([k, qty]) => ({ p: resolveCartItem(k)!, qty, soldOut: isSoldOut(k) })).filter(l => l.p);
  if (!lines.length || lines.some(l => l.soldOut)) return Promise.reject(new ApiError(409, 'Корзина изменилась'));
  const t = orderTotals({ lines, plan: { method: d.method, together: d.together, pickupPoint: d.address, floor: d.floor, lift: d.lift },
    promoPct: d.promo ? PROMO.pct : 0, useBonus: d.useBonus, balance: M.BONUS.balance, maxPart: M.BONUS.maxPart });
  const now = new Date(), m = readMock();
  const id = '8M-' + (10500 + m.placed.length);
  const city = M.CITIES.find(c => c.id === d.city)?.name;
  const slot = SHIPPING.courier.slots.find(s => s[0] === d.courierSlot);
  const pk = d.method === 'pickup';
  const order: Order = {
    id, date: `${now.getDate()} ${MONTHS[now.getMonth()]}, ${hhmm(now)}`, method: d.method, status: 'accepted',
    address: pk ? d.address : [city, d.address].filter(Boolean).join(', '), payment: d.payment, promo: d.promo, promoPct: d.promo ? PROMO.pct : undefined,
    items: Object.entries(d.cart).map(([id, qty]) => ({ id, qty })),
    shipments: t.plan.list.map(x => ({
      kind: x.kind, status: 'accepted' as const, times: [hhmm(now)],
      eta: x.isCargo
        ? (pk ? 'завтра с 9:00' : `${SHIPPING.cargo.days[d.cargoDay].replace(/^[^,]+, /, '')}, ${SHIPPING.cargo.intervals[d.cargoInterval]}`)
        : pk ? hhmm(plusMin(now, 40)) : !slot || slot[0] === 'asap' ? `${hhmm(plusMin(now, 60))}–${hhmm(plusMin(now, 90))}` : slot[1],
    })),
    recipient: d.recipient, leaveAtDoor: d.method === 'delivery' ? d.leaveAtDoor : undefined, kaspiPhone: d.payment === 'kaspi' ? d.kaspiPhone : undefined,
    goods: t.goods, discount: t.discount, fees: t.fees.map(f => ({ label: f.label, amount: f.amount })),
    spend: t.spend, total: t.total, bonus: t.earn,
  };
  writeMock({ ...m, placed: [order, ...m.placed] });
  return reply({ id }, 900);
}
/** GET /orders */
export const getOrders = (): Promise<Order[]> => reply(allOrders());
/** GET /orders/{id} */
export function getOrder(id: string): Promise<Order> {
  const o = allOrders().find(x => x.id === id);
  return o ? reply(o) : Promise.reject(new ApiError(404, 'Заказ не найден'));
}
/** POST /orders/{id}/cancel — пока ни одно отправление не передано в доставку. */
export function cancelOrder(id: string): Promise<{ refund: { amount: number; to: string }; bonusReturned: number }> {
  const o = allOrders().find(x => x.id === id);
  if (!o) return Promise.reject(new ApiError(404, 'Заказ не найден'));
  if (o.shipments.some(sh => CANCEL_BEFORE.includes(sh.status))) return Promise.reject(new ApiError(409, 'Заказ уже передан в доставку'));
  const m = readMock(); writeMock({ ...m, cancelled: { ...m.cancelled, [id]: hhmm(new Date()) } });
  return reply({ refund: { amount: o.total, to: o.payment === 'kaspi' ? 'Kaspi' : 'карту' }, bonusReturned: o.spend ?? 0 }, 700);
}

// ── Профиль ──

export const getMe = (): Promise<User> => reply(M.USER);
/** GET /me/addresses */
export const getAddresses = (): Promise<Address[]> => reply(M.ADDRESSES);
/** POST /me/addresses */
export const createAddress = (a: Omit<Address, 'id'>): Promise<Address> => reply({ ...a, id: 'a' + Date.now() });
/** PUT /me/addresses/{id} */
export const updateAddress = (a: Address): Promise<Address> => reply(a);
/** DELETE /me/addresses/{id} */
export const deleteAddress = (_id: string): Promise<{ ok: true }> => reply({ ok: true });
/** GET /me/cards */
export const getCards = (): Promise<Card[]> => reply(M.CARDS);
/** DELETE /me/cards/{id} */
export const deleteCard = (_id: string): Promise<{ ok: true }> => reply({ ok: true });
/** GET /me/promos */
export const getUserPromos = (): Promise<UserPromo[]> => reply(M.USER_PROMOS);
/** GET /me/bonus */
export const getBonus = (): Promise<Bonus> => reply(M.BONUS);
/** PATCH /me {name} */
export const updateMe = (patch: { name: string }): Promise<User> => reply({ ...M.USER, ...patch });
/** POST /me/phone → /me/phone/verify */
export const changePhone = (_phone: string): Promise<{ ok: true }> => reply({ ok: true });
export const verifyPhone = (phone: string, code: string): Promise<User> =>
  code === '1234' ? reply({ ...M.USER, phone }) : Promise.reject(new ApiError(400, 'code'));
/** DELETE /me */
export const deleteMe = (): Promise<{ ok: true }> => reply({ ok: true });

/** GET /favorites (для вошедших; гость — localStorage) */
export const getFavorites = (): Promise<string[]> => reply(M.FAVORITES, 0);
/** PUT /favorites */
export const putFavorites = (ids: string[]): Promise<string[]> => reply(ids, 0);

/** Окна доставки Газели для оформления (часть ответа /cart/validate в проде). */
export const getCargoSlots = () => reply({ days: SHIPPING.cargo.days, intervals: SHIPPING.cargo.intervals }, 0);
