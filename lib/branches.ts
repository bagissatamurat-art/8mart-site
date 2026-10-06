// Филиалы 8mart.kz → города и точки самовывоза сайта. Одно место перевода для снимка (branches.snapshot.json,
// scripts/import-branches.mjs) и живых данных (app/api/branches — тот же API, кэш 60 с).
import type { City, PickupPoint } from './types';
import snapshot from './branches.snapshot.json';

/** Ответ GET /api/v1/public/branches. Графика работы в API нет — есть живые isOpen / isAcceptingOrders. */
export interface RawBranch {
  id: string; name: string; city: string; address: string; latitude: number; longitude: number;
  isOpen: boolean; isAcceptingOrders: boolean; estimatedDeliveryTime?: number; statusMessage?: string; kaspiIntegrated?: boolean;
}

export const BRANCHES_API = 'https://dukenfy-api.8mart.kz/api/v1/public/branches';

/** Город из API → id и название на сайте; центр карты города (без филиала в центре — среднее по филиалам). */
const CITY: Record<string, { id: string; name: string; lat: number; lng: number }> = {
  'Астана': { id: 'astana', name: 'Астана', lat: 51.1282, lng: 71.4307 },
  'Актобе': { id: 'aktobe', name: 'Актобе', lat: 50.2839, lng: 57.167 },
  'Кокшетау Г.А.': { id: 'kokshetau', name: 'Кокшетау', lat: 53.2833, lng: 69.3964 },
  'Костанай': { id: 'kostanay', name: 'Костанай', lat: 53.2144, lng: 63.6246 },
  'Уральск': { id: 'uralsk', name: 'Уральск', lat: 51.2333, lng: 51.3667 },
};
const cityOf = (raw: string) => CITY[raw] ?? { id: raw.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-'), name: raw.replace(/\s+Г\.А\.$/, ''), lat: NaN, lng: NaN };

/** «проспект Абылай Хана 32» → «пр. Абылай хана, 32». */
export function shortAddress(a: string): string {
  return a.trim()
    .replace(/^проспект\s+/i, 'пр. ').replace(/^улица\s+/i, 'ул. ').replace(/^шоссе\s+/i, 'ш. ').replace(/^микрорайон\s+/i, 'мкр. ')
    .replace(/\s+Хана(?=[\s,]|$)/gu, ' хана') // \b не видит кириллицу — граница слова явно
    .replace(/\s+(\d[\p{L}\d/-]*)$/u, ', $1');
}

export function toPickupPoint(b: RawBranch): PickupPoint {
  const brand = b.name.split(/\s+-\s+/)[0].trim();
  return {
    id: b.id, city: cityOf(b.city).id, name: shortAddress(b.address), lat: b.latitude, lng: b.longitude,
    isOpen: b.isOpen, acceptingOrders: b.isAcceptingOrders, kaspiIntegrated: b.kaspiIntegrated,
    ...(brand && brand.toUpperCase() !== '8MART' ? { brand } : {}),
  };
}

export function citiesFrom(branches: RawBranch[]): City[] {
  const out = new Map<string, City>();
  for (const b of branches) {
    const c = cityOf(b.city);
    if (out.has(c.id)) continue;
    const own = branches.filter(x => x.city === b.city);
    out.set(c.id, Number.isFinite(c.lat) ? { id: c.id, name: c.name, lat: c.lat, lng: c.lng }
      : { id: c.id, name: c.name, lat: own.reduce((s, x) => s + x.latitude, 0) / own.length, lng: own.reduce((s, x) => s + x.longitude, 0) / own.length });
  }
  // Астана — первой (основной город), остальные по алфавиту.
  return [...out.values()].sort((a, b) => (a.id === 'astana' ? -1 : b.id === 'astana' ? 1 : a.name.localeCompare(b.name, 'ru')));
}

const RAW = snapshot.branches as RawBranch[];
export const BRANCHES_SNAPSHOT_DATE = snapshot.date;
export const SNAPSHOT_POINTS: PickupPoint[] = RAW.map(toPickupPoint);
export const SNAPSHOT_CITIES: City[] = citiesFrom(RAW);
