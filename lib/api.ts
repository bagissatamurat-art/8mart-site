// Слой данных — единственная точка связи экранов с бэкендом. Контракт — BACKEND_HANDOFF.md, типы — lib/types.ts.
// Каждая функция — endpoint(имя, настоящий запрос, мок): пока NEXT_PUBLIC_API_URL пуст или функция перечислена
// в NEXT_PUBLIC_API_MOCK, отвечает мок (lib/mock.ts) в той же форме (см. lib/http.ts). Сигнатуры не менять — на них экраны.
import { cache } from 'react';
import { ApiError, apiFetch, endpoint } from './http';
import * as M from './mock';
import { CANCEL_BEFORE, CAT_FILTERS, DELIVERY, PAGE_SIZE, PROMO } from './config';
import { cargoSlots, cartItem, courierSlots, orderTotals, planShipments, slotEta, type PlanOptions, type ShipmentPlan, type SlotDay } from './domain';
import { FLOWER_COMPOSITION } from './flowers';
import { fetchLiveStories } from './stories';
import type { QuoteResult } from './delivery';
import type {
  Address, Banner, Bonus, Card, CartProduct, Category, City, Order, OrderDraft, PickupPoint, Product, ProductDetail,
  ProductQuery, PromoCheck, Story, User, UserPromo,
} from './types';

/** Задержка мока, чтобы экраны проходили через состояние загрузки. */
/** Задержка мока только в браузере (видны состояния загрузки); на сервере — без задержки. */
const LATENCY = typeof window === 'undefined' ? 0 : 250;
const reply = <T,>(data: T, ms = LATENCY): Promise<T> =>
  new Promise(res => setTimeout(() => res(structuredClone(data)), ms));

export { ApiError };

/** Кэш публичных GET на сервере Next, с. */
const PUBLIC = 60;

// ── Каталог ──

/** GET /categories. cache — на сервере один запрос на рендер страницы (зовут и макет, и страница, и метаданные). */
export const getCategories = cache((): Promise<Category[]> =>
  endpoint('getCategories', () => apiFetch('/categories', { revalidate: PUBLIC }), () => reply(M.CATEGORIES)));

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
  const { attrs, ...rest } = q;
  return endpoint('getProducts',
    () => apiFetch('/products', { query: { ...rest, ...attrs }, revalidate: PUBLIC }),
    () => {
      const all = selectProducts(q), page = Math.max(1, q.page || 1);
      return reply({ items: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: all.length });
    });
}

/** Фасеты для MartFilters: значения атрибутов в текущей выборке со счётчиками. */
export function getFacets(q: Pick<ProductQuery, 'category' | 'sub'>): Promise<{ key: string; title: string; items: [string, number][] }[]> {
  return endpoint('getFacets', () => apiFetch('/products/facets', { query: { category: q.category, sub: q.sub }, revalidate: PUBLIC }), () => mockFacets(q));
}
function mockFacets(q: Pick<ProductQuery, 'category' | 'sub'>) {
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
  return endpoint('getProduct', () => apiFetch(`/products/${encodeURIComponent(id)}`, { revalidate: PUBLIC }), () => mockProduct(id));
}
function mockProduct(id: string): Promise<ProductDetail> {
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
export const getAllProductIds = (): Promise<string[]> =>
  endpoint('getAllProductIds', () => apiFetch('/products/ids', { revalidate: PUBLIC }), () => reply(M.PRODUCTS.map(p => p.id), 0));

/** GET /products?ids=… — избранное в кабинете. */
export const getProductsByIds = (ids: string[]): Promise<Product[]> => endpoint('getProductsByIds',
  () => (ids.length ? apiFetch<Product[]>('/products', { query: { ids: ids.join(',') } }) : Promise.resolve([])),
  () => reply(ids.map(id => M.PRODUCTS.find(p => p.id === id)).filter((p): p is Product => !!p)));

/** GET /products?group= — товары одной группы (фасовки) — для переключателя в карточке. */
export const getGroup = (group: string): Promise<Product[]> =>
  endpoint('getGroup', () => apiFetch('/products', { query: { group }, revalidate: PUBLIC }), () => reply(M.PRODUCTS.filter(p => p.group === group), 0));

/** GET /search/suggest?q */
export function searchSuggest(q: string): Promise<{ categories: { slug: string; name: string; parent: string; count: number }[]; products: Product[]; total: number }> {
  return endpoint('searchSuggest', () => apiFetch('/search/suggest', { query: { q: q.trim() } }), () => mockSuggest(q));
}
function mockSuggest(q: string) {
  const ql = q.trim().toLowerCase();
  if (!ql) return reply({ categories: [], products: [], total: 0 }, 0);
  const cats = M.CATEGORIES.flatMap(c => c.sub.map(s => ({ ...s, parent: c.name })));
  const categories = cats.filter(c => c.name.toLowerCase().includes(ql)).map(c => ({ ...c, count: M.PRODUCTS.filter(x => x.cat === c.slug).length }));
  const hits = M.PRODUCTS.filter(x => x.name.toLowerCase().includes(ql));
  return reply({ categories, products: hits.slice(0, 6), total: hits.length }, 150);
}

/** GET /stories. Мок — настоящие сторис 8mart.kz (видео, TEMP-ADAPTER lib/stories.ts, только на сервере) первыми, затем сторис сайта. */
export const getStories = (): Promise<Story[]> => endpoint('getStories', () => apiFetch('/stories', { revalidate: 300 }),
  () => (typeof window === 'undefined' ? fetchLiveStories().then(live => [...live, ...M.STORIES]) : reply(M.STORIES)));
/** GET /banners */
export const getBanners = (): Promise<Banner[]> => endpoint('getBanners', () => apiFetch('/banners', { revalidate: PUBLIC }), () => reply(M.BANNERS));

// ── Корзина ──

/** Синхронный разбор ключа корзины по моку — для клиентских сторов до ответа /cart/validate.
 *  С бэкендом: каталог для этого разбора должен приходить с сервера (вопрос в BACKEND_HANDOFF.md, раздел 7). */
export const resolveCartItem = (key: string): CartProduct | null => cartItem(key, M.PRODUCTS);

/** Мок наличия в филиале: распроданные позиции (сервер вернёт soldOut в /cart/validate). Ключ цветов — по id варианта. */
const isSoldOut = (key: string) => M.SOLD_OUT_IN_BRANCH.includes(key.split('|')[0]);

/** POST /cart/validate — сервер пересчитывает цены, наличие и отправления. */
export function validateCart(cart: Record<string, number>, opts: PlanOptions = {}): Promise<{
  lines: { id: string; qty: number; soldOut: boolean; price: number | null }[];
  plan: ShipmentPlan<{ p: CartProduct; qty: number; soldOut: boolean }>;
}> {
  return endpoint('validateCart', () => apiFetch('/cart/validate', { method: 'POST', body: { cart, ...opts } }), () => mockValidate(cart, opts));
}
function mockValidate(cart: Record<string, number>, opts: PlanOptions) {
  const resolved = Object.entries(cart).map(([id, qty]) => ({ p: resolveCartItem(id), qty, soldOut: isSoldOut(id) }))
    .filter((l): l is { p: CartProduct; qty: number; soldOut: boolean } => !!l.p);
  const plan = planShipments(resolved, opts);
  return reply({ lines: resolved.map(l => ({ id: l.p.id, qty: l.qty, soldOut: l.soldOut, price: l.p.price })), plan });
}

/** «Не забыть» в корзине (02): сопутствующие товары, которых ещё нет в корзине. В проде — рекомендации бэкенда. */
/** «Не забыть» в корзине — к букету: открытка, шары, упаковка. */
const UPSELL = ['g3', 'g4', 'g5', 'g1', 'g2'];
export const getUpsell = (cartKeys: string[]): Promise<Product[]> => endpoint('getUpsell',
  () => apiFetch('/cart/upsell', { query: { ids: cartKeys.join(',') } }),
  () => reply(UPSELL.filter(id => !cartKeys.includes(id)).map(id => M.PRODUCTS.find(p => p.id === id)!).filter(Boolean).slice(0, 5), 0));

// ── Способ получения ──

/** GET /cities */
export const getCities = (): Promise<City[]> => endpoint('getCities', () => apiFetch('/cities', { revalidate: PUBLIC }), () => reply(M.CITIES, 0));
/** GET /pickup-points?city. Мок — настоящие филиалы 8mart.kz: в браузере живой статус через TEMP-ADAPTER /api/branches
 *  (кэш 60 с), на сервере и при сбое — снимок (lib/branches.snapshot.json). */
let live: { at: number; points: Promise<PickupPoint[]> } | null = null;
export function getPickupPoints(city: string): Promise<PickupPoint[]> {
  return endpoint('getPickupPoints', () => apiFetch('/pickup-points', { query: { city } }), () => mockPickupPoints(city));
}
function mockPickupPoints(city: string): Promise<PickupPoint[]> {
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
/** GET /geo/suggest?q&city. Мок — TEMP-ADAPTER: прокси DaData на нашем сервере (app/api/geo/suggest), ключ только на сервере. */
export function geoSuggest(q: string, city: string, signal?: AbortSignal): Promise<GeoSuggestion[]> {
  return endpoint('geoSuggest', () => apiFetch('/geo/suggest', { query: { q, city }, signal }), async () => {
  const r = await fetch(`/api/geo/suggest?${new URLSearchParams({ q, city })}`, { signal });
  if (!r.ok) throw new ApiError(r.status, 'Сервис подсказок недоступен');
  return r.json();
  });
}
/** GET /geo/reverse?lat&lng. Мок — TEMP-ADAPTER app/api/geo/reverse. */
export function geoReverse(lat: number, lng: number): Promise<{ address: string; city: string; hasHouse?: boolean } | null> {
  return endpoint('geoReverse', () => apiFetch('/geo/reverse', { query: { lat, lng } }), async () => {
  const r = await fetch(`/api/geo/reverse?${new URLSearchParams({ lat: String(lat), lng: String(lng) })}`);
  if (!r.ok) throw new ApiError(r.status, 'Сервис геокодирования недоступен');
  return r.json();
  });
}

/** GET /delivery/quote?lat&lng — зона доставки для точки: стоимость, время, филиал. Сбой — {status:'unavailable'}.
 *  Мок — TEMP-ADAPTER app/api/delivery/quote (зоны 8mart.kz). */
export function quoteDelivery(lat: number, lng: number, signal?: AbortSignal): Promise<QuoteResult> {
  return endpoint('quoteDelivery',
    () => apiFetch<QuoteResult>('/delivery/quote', { query: { lat: lat.toFixed(4), lng: lng.toFixed(4) }, signal })
      .catch((e: unknown): QuoteResult => { if (signal?.aborted) throw e; return { status: 'unavailable' }; }),
    async () => {
  const r = await fetch(`/api/delivery/quote?${new URLSearchParams({ lat: lat.toFixed(4), lng: lng.toFixed(4) })}`, { signal });
  if (!r.ok) return { status: 'unavailable' as const };
  return r.json();
    });
}

// ── Промокод ──

/** POST /promo/check {code, goodsTotal} */
export function checkPromo(code: string, goodsTotal: number): Promise<PromoCheck> {
  return endpoint('checkPromo', () => apiFetch('/promo/check', { method: 'POST', body: { code: code.trim(), goodsTotal } }), () => mockPromo(code, goodsTotal));
}
function mockPromo(code: string, goodsTotal: number): Promise<PromoCheck> {
  const c = code.trim().toUpperCase();
  const promo = M.USER_PROMOS.find(p => p.code === c);
  if (promo?.status === 'expired') return reply({ error: 'expired' });
  if (c !== PROMO.code) return reply({ error: 'notFound' });
  if (goodsTotal < PROMO.minSum) return reply({ error: 'minSum', minSum: PROMO.minSum });
  return reply({ ok: true, pct: PROMO.pct });
}

// ── Авторизация ── (мок: код 1234 верный, остальные — неверный)

/** POST /auth/code {phone, channel:'whatsapp'} */
export const authCode = (phone: string): Promise<{ ok: true }> =>
  endpoint('authCode', () => apiFetch('/auth/code', { method: 'POST', body: { phone, channel: 'whatsapp' } }), () => reply({ ok: true as const }));
/** POST /auth/verify {phone, code}. Неверный код — 400 (экран показывает ошибку кода на любой 400). */
export function authVerify(phone: string, code: string): Promise<{ accessToken: string; user: { name?: string } }> {
  return endpoint('authVerify', () => apiFetch('/auth/verify', { method: 'POST', body: { phone, code } }), () => {
    if (code !== '1234') return Promise.reject(new ApiError(400, 'code'));
    return reply({ accessToken: 'mock-token', user: phone === M.USER.phone ? { name: M.USER.name } : {} });
  });
}
/** POST /auth/tg → {token} */
export const authTg = (): Promise<{ token: string }> =>
  endpoint('authTg', () => apiFetch('/auth/tg', { method: 'POST' }), () => reply({ token: Math.random().toString(36).slice(2, 10) }));
/** GET /auth/tg/{token} */
// Мок: бот «подтверждает» номер на третьем опросе.
const tgPolls = new Map<string, number>();
export function authTgStatus(token: string): Promise<{ status: 'pending' | 'ok'; phone?: string }> {
  return endpoint('authTgStatus', () => apiFetch(`/auth/tg/${encodeURIComponent(token)}`), () => mockTgStatus(token));
}
function mockTgStatus(token: string): Promise<{ status: 'pending' | 'ok'; phone?: string }> {
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
  return endpoint('createOrder', () => apiFetch('/orders', { method: 'POST', body: d }), () => mockCreateOrder(d));
}
function mockCreateOrder(d: OrderDraft): Promise<{ id: string; payUrl?: string }> {
  const lines = Object.entries(d.cart).map(([k, qty]) => ({ p: resolveCartItem(k)!, qty, soldOut: isSoldOut(k) })).filter(l => l.p);
  if (!lines.length || lines.some(l => l.soldOut)) return Promise.reject(new ApiError(409, 'Корзина изменилась'));
  const t = orderTotals({ lines, plan: { method: d.method, together: d.together, pickupPoint: d.address, floor: d.floor, lift: d.lift, courierFee: d.courierFee, courierEta: d.courierEta },
    promoPct: d.promo ? PROMO.pct : 0, useBonus: d.useBonus, balance: M.BONUS.balance, maxPart: M.BONUS.maxPart });
  const now = new Date(), m = readMock();
  const id = '8M-' + (10500 + m.placed.length);
  const city = M.CITIES.find(c => c.id === d.city)?.name;
  const pk = d.method === 'pickup';
  const order: Order = {
    id, date: `${now.getDate()} ${MONTHS[now.getMonth()]}, ${hhmm(now)}`, method: d.method, status: 'accepted',
    address: pk ? d.address : [city, d.address].filter(Boolean).join(', '), payment: d.payment, promo: d.promo, promoPct: d.promo ? PROMO.pct : undefined,
    items: Object.entries(d.cart).map(([id, qty]) => ({ id, qty })),
    shipments: t.plan.list.map(x => ({
      kind: x.kind, status: 'accepted' as const, times: [hhmm(now)],
      eta: x.isCargo
        ? (pk ? 'завтра с 9:00' : slotEta(d.cargoSlot) ?? 'завтра, 09:00–13:00')
        : pk ? hhmm(plusMin(now, 40)) : slotEta(d.courierSlot) ?? `${hhmm(plusMin(now, d.courierEta ?? DELIVERY.etaMin))}–${hhmm(plusMin(now, (d.courierEta ?? DELIVERY.etaMax) + 30))}`,
    })),
    recipient: d.recipient, leaveAtDoor: d.method === 'delivery' ? d.leaveAtDoor : undefined, kaspiPhone: d.payment === 'kaspi' ? d.kaspiPhone : undefined,
    goods: t.goods, discount: t.discount, fees: t.fees.map(f => ({ label: f.label, amount: f.amount })),
    spend: t.spend, total: t.total, bonus: t.earn,
  };
  writeMock({ ...m, placed: [order, ...m.placed] });
  return reply({ id }, 900);
}
/** GET /orders */
export const getOrders = (): Promise<Order[]> => endpoint('getOrders', () => apiFetch('/orders'), () => reply(allOrders()));
/** GET /orders/{id} */
export function getOrder(id: string): Promise<Order> {
  return endpoint('getOrder', () => apiFetch(`/orders/${encodeURIComponent(id)}`), () => {
    const o = allOrders().find(x => x.id === id);
    return o ? reply(o) : Promise.reject(new ApiError(404, 'Заказ не найден'));
  });
}
/** POST /orders/{id}/cancel — пока ни одно отправление не передано в доставку. */
export function cancelOrder(id: string): Promise<{ refund: { amount: number; to: string }; bonusReturned: number }> {
  return endpoint('cancelOrder', () => apiFetch(`/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' }), () => mockCancel(id));
}
function mockCancel(id: string): Promise<{ refund: { amount: number; to: string }; bonusReturned: number }> {
  const o = allOrders().find(x => x.id === id);
  if (!o) return Promise.reject(new ApiError(404, 'Заказ не найден'));
  if (o.shipments.some(sh => CANCEL_BEFORE.includes(sh.status))) return Promise.reject(new ApiError(409, 'Заказ уже передан в доставку'));
  const m = readMock(); writeMock({ ...m, cancelled: { ...m.cancelled, [id]: hhmm(new Date()) } });
  return reply({ refund: { amount: o.total, to: o.payment === 'kaspi' ? 'Kaspi' : 'карту' }, bonusReturned: o.spend ?? 0 }, 700);
}

// ── Профиль ── (запросы с Bearer-токеном, см. setAuthTokenProvider)

/** GET /me */
export const getMe = (): Promise<User> => endpoint('getMe', () => apiFetch('/me'), () => reply(M.USER));
/** GET /me/addresses */
export const getAddresses = (): Promise<Address[]> => endpoint('getAddresses', () => apiFetch('/me/addresses'), () => reply(M.ADDRESSES));
/** POST /me/addresses */
export const createAddress = (a: Omit<Address, 'id'>): Promise<Address> =>
  endpoint('createAddress', () => apiFetch('/me/addresses', { method: 'POST', body: a }), () => reply({ ...a, id: 'a' + Date.now() }));
/** PUT /me/addresses/{id} */
export const updateAddress = (a: Address): Promise<Address> =>
  endpoint('updateAddress', () => apiFetch(`/me/addresses/${encodeURIComponent(a.id)}`, { method: 'PUT', body: a }), () => reply(a));
/** DELETE /me/addresses/{id} */
export const deleteAddress = (id: string): Promise<{ ok: true }> =>
  endpoint('deleteAddress', () => apiFetch(`/me/addresses/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(() => ({ ok: true as const })), () => reply({ ok: true as const }));
/** GET /me/cards */
export const getCards = (): Promise<Card[]> => endpoint('getCards', () => apiFetch('/me/cards'), () => reply(M.CARDS));
/** DELETE /me/cards/{id} */
export const deleteCard = (id: string): Promise<{ ok: true }> =>
  endpoint('deleteCard', () => apiFetch(`/me/cards/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(() => ({ ok: true as const })), () => reply({ ok: true as const }));
/** GET /me/promos */
export const getUserPromos = (): Promise<UserPromo[]> => endpoint('getUserPromos', () => apiFetch('/me/promos'), () => reply(M.USER_PROMOS));
/** GET /me/bonus */
export const getBonus = (): Promise<Bonus> => endpoint('getBonus', () => apiFetch('/me/bonus'), () => reply(M.BONUS));
/** PATCH /me {name} */
export const updateMe = (patch: { name: string }): Promise<User> =>
  endpoint('updateMe', () => apiFetch('/me', { method: 'PATCH', body: patch }), () => reply({ ...M.USER, ...patch }));
/** POST /me/phone {phone} → POST /me/phone/verify {phone, code} */
export const changePhone = (phone: string): Promise<{ ok: true }> =>
  endpoint('changePhone', () => apiFetch('/me/phone', { method: 'POST', body: { phone } }), () => reply({ ok: true as const }));
export const verifyPhone = (phone: string, code: string): Promise<User> =>
  endpoint('verifyPhone', () => apiFetch('/me/phone/verify', { method: 'POST', body: { phone, code } }),
    () => (code === '1234' ? reply({ ...M.USER, phone }) : Promise.reject(new ApiError(400, 'code'))));
/** DELETE /me */
export const deleteMe = (): Promise<{ ok: true }> =>
  endpoint('deleteMe', () => apiFetch('/me', { method: 'DELETE' }).then(() => ({ ok: true as const })), () => reply({ ok: true as const }));

/** GET /favorites (для вошедших; гость — localStorage) */
export const getFavorites = (): Promise<string[]> => endpoint('getFavorites', () => apiFetch('/favorites'), () => reply(M.FAVORITES, 0));
/** PUT /favorites {ids} */
export const putFavorites = (ids: string[]): Promise<string[]> =>
  endpoint('putFavorites', () => apiFetch('/favorites', { method: 'PUT', body: { ids } }), () => reply(ids, 0));

/** GET /delivery/slots?kind — дни и интервалы доставки для оформления. eta — подпись «Ближайшего» (по зоне адреса). */
export const getDeliverySlots = (kind: 'courier' | 'cargo', eta = ''): Promise<SlotDay[]> =>
  endpoint('getDeliverySlots', () => apiFetch('/delivery/slots', { query: { kind } }),
    () => reply(kind === 'courier' ? courierSlots(new Date(), eta) : cargoSlots(new Date()), 0));
