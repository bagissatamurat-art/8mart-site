// Геосервисы на сервере: DaData (подсказки и адрес по точке) + запасной Mapbox Geocoding v6.
// Логика перенесена из design_handoff_8mart_site/site/geo.js. Ключи — только из process.env (.env.local),
// во фронт не попадают. Файл импортируют только route handlers /api/geo/*.
import { getCities } from '@/lib/api';
import type { City } from '@/lib/types';

const DD = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs';
const MB = 'https://api.mapbox.com/search/geocode/v6';
/** Таймаут запроса к внешнему сервису, мс. */
const TIMEOUT = 4000;

const dadataKey = () => process.env.DADATA_API_KEY || '';
// Mapbox-токен публичный (pk.), им же пользуется карта. Отдельный серверный токен можно задать MAPBOX_TOKEN.
const mapboxToken = () => process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export const hasDadata = () => !!dadataKey();
export const hasMapbox = () => !!mapboxToken();

/** Ошибка внешнего сервиса — наружу отдаём только статус, без тела ответа поставщика. */
export class UpstreamError extends Error {}

interface DadataSuggestion {
  value: string;
  data?: Record<string, string | null | undefined>;
}

async function dd(path: string, body: unknown): Promise<DadataSuggestion[]> {
  const r = await fetch(`${DD}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Token ' + dadataKey() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT),
    cache: 'no-store',
  });
  if (!r.ok) throw new UpstreamError('dadata ' + r.status);
  const j = (await r.json()) as { suggestions?: DadataSuggestion[] };
  return j.suggestions || [];
}

interface MapboxFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    feature_type?: string;
    context?: { street?: { name?: string }; address?: { address_number?: string }; place?: { name?: string } };
  };
}

async function mb(path: string, params: Record<string, string>): Promise<MapboxFeature[]> {
  const r = await fetch(`${MB}/${path}?${new URLSearchParams({ ...params, access_token: mapboxToken() })}`, {
    signal: AbortSignal.timeout(TIMEOUT),
    cache: 'no-store',
  });
  if (!r.ok) throw new UpstreamError('mapbox ' + r.status);
  return ((await r.json()) as { features?: MapboxFeature[] }).features || [];
}

async function mapboxForward(q: string, c: City): Promise<{ lat: number; lng: number } | null> {
  if (!hasMapbox()) return null;
  const f = (await mb('forward', { q, country: 'kz', language: 'ru', limit: '1', proximity: `${c.lng},${c.lat}` }))[0];
  const xy = f?.geometry?.coordinates;
  return xy ? { lng: xy[0], lat: xy[1] } : null;
}

/** Город по id из справочника (GET /cities); неизвестный id трактуем как название города. */
export async function resolveCity(idOrName: string): Promise<City> {
  const cities = await getCities();
  return cities.find(c => c.id === idOrName || c.name === idOrName)
    ?? { id: idOrName, name: idOrName, lat: cities[0].lat, lng: cities[0].lng };
}

/** Строка ответа /api/geo/suggest. lat/lng = null, если координат нет ни у DaData, ни у Mapbox. */
export interface SuggestRow { title: string; subtitle: string; lat: number | null; lng: number | null; hasHouse: boolean }

/** Подсказки «Улица, дом» в пределах города — до 6 штук. */
export async function suggestAddress(q: string, city: City): Promise<SuggestRow[]> {
  const list = await dd('suggest/address', {
    query: q, count: 10, locations: [{ country_iso_code: 'KZ', city: city.name }], restrict_value: true, language: 'ru',
  });
  const out: SuggestRow[] = [];
  const seen = new Set<string>();
  for (const s of list) {
    const d = s.data || {};
    const street = d.street_with_type || d.street || '';
    const house = [d.house, d.block ? (d.block_type || 'корп.') + ' ' + d.block : ''].filter(Boolean).join(' ');
    const title = street ? street + (house ? ', ' + house : '') : (d.settlement_with_type || s.value);
    const subtitle = [d.city_district_with_type || d.city_district, d.city || city.name].filter(Boolean).join(' · ');
    if (!title || seen.has(title + subtitle)) continue;
    seen.add(title + subtitle);
    let lat = d.geo_lat ? +d.geo_lat : null, lng = d.geo_lon ? +d.geo_lon : null;
    if (lat == null || lng == null) {
      const g = await mapboxForward(`${city.name}, ${title}`, city).catch(() => null);
      if (g) ({ lat, lng } = g);
    }
    // Улица без дома → в поле подставится «Улица, » и курсор останется для номера дома.
    out.push({ title, subtitle, lat, lng, hasHouse: !(street && !d.house) });
    if (out.length === 6) break;
  }
  return out;
}

/** Адрес по точке → {address, city}. DaData geolocate; если пусто или ошибка — обратное геокодирование Mapbox. */
/** hasHouse — в адресе есть номер дома (иначе пин стоит на улице/в парке — доставить некуда). */
export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string; hasHouse: boolean }> {
  if (hasDadata()) {
    try {
      const s = (await dd('geolocate/address', { lat, lon: lng, count: 1, radius_meters: 100, language: 'ru' }))[0];
      const d = s?.data;
      if (d && (d.street || d.house)) {
        return { address: [d.street_with_type || d.street, d.house].filter(Boolean).join(', '), city: d.city || d.settlement || '', hasHouse: !!d.house };
      }
    } catch { /* падаем на Mapbox */ }
  }
  if (!hasMapbox()) {
    if (hasDadata()) return { address: '', city: '', hasHouse: false };
    throw new UpstreamError('no providers');
  }
  const f = (await mb('reverse', { longitude: String(lng), latitude: String(lat), language: 'ru', types: 'address,street', limit: '1' }))[0];
  if (!f) return { address: '', city: '', hasHouse: false };
  const p = f.properties || {}, ctx = p.context || {};
  const address = p.feature_type === 'address'
    ? [ctx.street?.name, ctx.address?.address_number].filter(Boolean).join(', ') || p.name
    : p.name;
  return { address: address || '', city: ctx.place?.name || '', hasHouse: p.feature_type === 'address' && !!ctx.address?.address_number };
}

/** Ответ «сервис недоступен» — UI показывает «поставьте пин». */
export const unavailable = () => Response.json({ error: 'unavailable' }, { status: 503 });
export const badRequest = (msg: string) => Response.json({ error: msg }, { status: 400 });
