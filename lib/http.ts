// HTTP-клиент к бэкенду 8mart и переключатель «мок / настоящий API» для lib/api.ts.
//
//   NEXT_PUBLIC_API_URL  — адрес API (https://api.8mart.kz/v1). Пусто — весь сайт на моке (lib/mock.ts).
//   NEXT_PUBLIC_API_MOCK — функции lib/api.ts, которые пока остаются на моке, через запятую: getOrders,getBonus
//                          («*» — все). Так бэкенд подключается по одному эндпоинту, не ломая остальные экраны.
//
// Токен входа: клиент регистрирует его источник (setAuthTokenProvider в components/site/SiteOverlays.tsx);
// на сервере (RSC, метаданные, sitemap) запросы идут без токена — там только публичные данные.

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const MOCKED = new Set((process.env.NEXT_PUBLIC_API_MOCK || '').split(',').map(s => s.trim()).filter(Boolean));

/** Функция lib/api.ts отвечает моком: API не задан, она в NEXT_PUBLIC_API_MOCK или там «*». */
export const isMocked = (name: string) => !API_URL || MOCKED.has('*') || MOCKED.has(name);

let tokenOf: () => string | null = () => null;
/** Откуда брать accessToken (клиент): () => useAuth.getState().accessToken. */
export function setAuthTokenProvider(fn: () => string | null) { tokenOf = fn; }

type Query = Record<string, string | number | boolean | (string | number)[] | null | undefined>;
export interface ApiInit {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
  /** Кэш на сервере Next (с): публичные данные каталога. Без него — без кэша. */
  revalidate?: number;
}

/** Параметры запроса: массивы — повторяющимся ключом (?colors=Белый&colors=Розовый), пустые — не пишем. */
export function toQuery(q: Query = {}): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v == null || v === '' || v === false) continue;
    (Array.isArray(v) ? v : [v]).forEach(x => p.append(k, String(x)));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Запрос к API: JSON туда и обратно, Bearer-токен, ошибки — ApiError(status, message из {error:{message}} | {message}). 204 — undefined. */
export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { method = 'GET', query, body, signal, revalidate } = init;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenOf();
  if (token) headers.Authorization = `Bearer ${token}`;
  let r: Response;
  try {
    r = await fetch(API_URL + path + toQuery(query), {
      method, headers, signal, credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(revalidate != null ? { next: { revalidate } } : { cache: 'no-store' as const }),
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ApiError(0, 'Нет связи с сервером');
  }
  if (r.status === 204) return undefined as T;
  const data = await r.json().catch(() => null) as unknown;
  if (!r.ok) {
    const d = data as { error?: { message?: string }; message?: string } | null;
    throw new ApiError(r.status, d?.error?.message || d?.message || r.statusText || 'Ошибка сервера');
  }
  return data as T;
}

/** Одна функция lib/api.ts: настоящий запрос или мок (см. isMocked). */
export function endpoint<T>(name: string, real: () => Promise<T>, mock: () => Promise<T>): Promise<T> {
  return isMocked(name) ? mock() : real();
}
