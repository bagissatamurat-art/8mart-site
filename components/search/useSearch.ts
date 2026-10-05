'use client';
// Данные экрана результатов поиска (05 Поиск, 5c / 5d). Всё — через lib/api.ts → getProducts({ q, … }).
import { useCallback, useEffect, useRef, useState } from 'react';
import { getProducts } from '@/lib/api';
import { PAGE_SIZE } from '@/lib/config';
import type { Product, ProductQuery } from '@/lib/types';

/**
 * Все совпадения по запросу без фильтров — для «Нашли в категориях» (счётчики по подкатегориям) и фасетов.
 * В README нет эндпоинта фасетов поиска, поэтому выбираем все страницы getProducts({ q }).
 * TODO: заменить на GET /search/facets?q (см. DESIGN_NOTES → «Этап 4: поиск»).
 */
export function useSearchIndex(q: string): Product[] | undefined {
  const [res, setRes] = useState<{ q: string; items: Product[] } | null>(null);
  useEffect(() => {
    if (!q) return;
    let live = true;
    (async () => {
      const first = await getProducts({ q, page: 1 });
      const pages = Math.ceil(first.total / PAGE_SIZE);
      const rest = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, i) => getProducts({ q, page: i + 2 })));
      if (live) setRes({ q, items: first.items.concat(...rest.map(r => r.items)) });
    })().catch(() => { if (live) setRes({ q, items: [] }); });
    return () => { live = false; };
  }, [q]);
  return res && res.q === q ? res.items : undefined;
}

export interface SearchPage {
  /** undefined — первая страница ещё грузится. */
  items: Product[] | undefined;
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
}

/** Лента результатов с подгрузкой по PAGE_SIZE. Смена параметров — заново с первой страницы. */
export function useSearchPages(query: Omit<ProductQuery, 'page'>, enabled = true): SearchPage {
  const key = JSON.stringify(query);
  const [st, setSt] = useState<{ key: string; items: Product[]; total: number; page: number } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    busy.current = false;
    setLoadingMore(false);
    getProducts({ ...(JSON.parse(key) as ProductQuery), page: 1 })
      .then(r => { if (live) setSt({ key, items: r.items, total: r.total, page: 1 }); })
      .catch(() => { if (live) setSt({ key, items: [], total: 0, page: 1 }); });
    return () => { live = false; };
  }, [key, enabled]);

  const cur = st && st.key === key ? st : null;
  const hasMore = !!cur && cur.items.length < cur.total;

  const loadMore = useCallback(() => {
    if (!cur || busy.current || cur.items.length >= cur.total) return;
    busy.current = true;
    setLoadingMore(true);
    const page = cur.page + 1;
    getProducts({ ...(JSON.parse(key) as ProductQuery), page })
      .then(r => setSt(prev => (prev && prev.key === key && prev.page === page - 1 ? { ...prev, items: prev.items.concat(r.items), total: r.total, page } : prev)))
      .finally(() => { busy.current = false; setLoadingMore(false); });
  }, [cur, key]);

  return { items: cur?.items, total: cur?.total ?? 0, hasMore, loadingMore, loadMore };
}

/** Колбэк-реф для «стража» в конце ленты: видим (с запасом 120, как в 07 Каталог) — подгружаем. */
export function useSentinel(onVisible: () => void) {
  const cb = useRef(onVisible);
  useEffect(() => { cb.current = onVisible; });
  const io = useRef<IntersectionObserver | null>(null);
  return useCallback((el: HTMLElement | null) => {
    io.current?.disconnect();
    io.current = null;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    io.current = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) cb.current(); }, { rootMargin: '120px' });
    io.current.observe(el);
  }, []);
}
