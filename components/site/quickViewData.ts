'use client';
// Данные и код быстрого просмотра: кэш по id и предзагрузка по намерению (наведение, касание, фокус на карточке).
// Повторное открытие — мгновенно; при наведении товар и чанк модалки начинают грузиться до клика.
import { getGroup, getProduct } from '@/lib/api';
import type { Product, ProductDetail } from '@/lib/types';
import type { MartProductView } from '@/components/MartProductView';

export interface QuickViewData { product: ProductDetail; group: Product[] }

const cache = new Map<string, Promise<QuickViewData>>();
const done = new Map<string, QuickViewData>();
let view: typeof MartProductView | null = null;
let viewLoad: Promise<typeof MartProductView> | null = null;

export function loadQuickView(id: string): Promise<QuickViewData> {
  let p = cache.get(id);
  if (!p) {
    p = getProduct(id).then(async product => {
      const data = { product, group: product.group ? await getGroup(product.group) : [] };
      done.set(id, data);
      return data;
    });
    p.catch(() => cache.delete(id)); // ошибка — следующая попытка запросит заново
    cache.set(id, p);
  }
  return p;
}

/** Уже загруженные данные — синхронно (без скелетона). */
export const peekQuickView = (id: string) => done.get(id) ?? null;

export function loadQuickViewComponent(): Promise<typeof MartProductView> {
  viewLoad ??= import('@/components/MartProductView').then(m => (view = m.MartProductView));
  return viewLoad;
}
export const peekQuickViewComponent = () => view;

export function preloadQuickView(id: string) {
  loadQuickView(id).catch(() => {});
  loadQuickViewComponent().catch(() => {});
}
