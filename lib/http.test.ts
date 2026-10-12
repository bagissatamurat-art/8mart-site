import { afterEach, describe, expect, it, vi } from 'vitest';

// lib/http.ts читает env при загрузке модуля — каждый сценарий грузит его заново.
async function load(env: { url?: string; mock?: string }) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_API_URL', env.url ?? '');
  vi.stubEnv('NEXT_PUBLIC_API_MOCK', env.mock ?? '');
  return import('./http');
}
const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('переключатель мок / API', () => {
  it('без NEXT_PUBLIC_API_URL — всё на моке', async () => {
    const h = await load({});
    expect(h.isMocked('getProducts')).toBe(true);
    expect(await h.endpoint('getProducts', () => Promise.resolve('api'), () => Promise.resolve('mock'))).toBe('mock');
  });

  it('с адресом — настоящий запрос, кроме перечисленных в NEXT_PUBLIC_API_MOCK', async () => {
    const h = await load({ url: 'https://api.test/v1/', mock: 'getOrders, getBonus' });
    expect(h.API_URL).toBe('https://api.test/v1');
    expect(h.isMocked('getProducts')).toBe(false);
    expect(h.isMocked('getOrders')).toBe(true);
    expect(h.isMocked('getBonus')).toBe(true);
  });

  it('«*» — все на моке', async () => {
    const h = await load({ url: 'https://api.test', mock: '*' });
    expect(h.isMocked('getProducts')).toBe(true);
  });
});

describe('apiFetch', () => {
  it('query, JSON-тело и Bearer-токен', async () => {
    const h = await load({ url: 'https://api.test' });
    const fetchMock = vi.fn(async () => json(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    h.setAuthTokenProvider(() => 'tok');
    await h.apiFetch('/orders', { method: 'POST', body: { a: 1 }, query: { colors: ['Белый', 'Розовый'], page: 2, sale: false, q: '' } });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe('https://api.test/orders?colors=%D0%91%D0%B5%D0%BB%D1%8B%D0%B9&colors=%D0%A0%D0%BE%D0%B7%D0%BE%D0%B2%D1%8B%D0%B9&page=2');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"a":1}');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.credentials).toBe('include');
  });

  it('ошибка — ApiError со статусом и сообщением сервера', async () => {
    const h = await load({ url: 'https://api.test' });
    vi.stubGlobal('fetch', vi.fn(async () => json(409, { error: { message: 'Корзина изменилась' } })));
    await expect(h.apiFetch('/orders', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 409, message: 'Корзина изменилась' });
  });

  it('нет сети — ApiError(0); 204 — undefined', async () => {
    const h = await load({ url: 'https://api.test' });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(h.apiFetch('/me')).rejects.toMatchObject({ status: 0 });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })));
    expect(await h.apiFetch('/me', { method: 'DELETE' })).toBeUndefined();
  });
});

describe('lib/api.ts через переключатель', () => {
  it('с адресом getProducts идёт в GET /products, а функция из NEXT_PUBLIC_API_MOCK — в мок', async () => {
    await load({ url: 'https://api.test', mock: 'getCities' });
    const api = await import('./api');
    const fetchMock = vi.fn(async () => json(200, { items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await api.getProducts({ category: 'flowers', page: 2, attrs: { colors: ['Белый'] } })).toEqual({ items: [], total: 0 });
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe('https://api.test/products?category=flowers&page=2&colors=%D0%91%D0%B5%D0%BB%D1%8B%D0%B9');
    expect((await api.getCities()).length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
