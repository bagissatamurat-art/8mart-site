'use client';
// Список каталога с бесконечной прокруткой: первая страница при смене запроса, следующие — когда сентинел у края экрана (rootMargin 120, как в 07).
import { useCallback, useEffect, useRef, useState } from 'react';
import { getProducts } from '@/lib/api';
import type { Product, ProductQuery } from '@/lib/types';

export interface CatalogList {
  items: Product[];
  total: number;
  /** Первая страница грузится (скелетоны вместо сетки). */
  loading: boolean;
  /** Догружается следующая страница. */
  loadingMore: boolean;
  error: boolean;
  hasMore: boolean;
  retry: () => void;
  /** ref для сентинела под сеткой. */
  sentinel: (el: HTMLElement | null) => void;
}

/** initial — первая страница, отрендеренная на сервере (SEO и без вспышки скелетонов); используется для стартового запроса. */
export function useCatalogList(query: Omit<ProductQuery, 'page'> | null, initial?: { items: Product[]; total: number } | null): CatalogList {
  const key = query ? JSON.stringify(query) : '';
  const [st, setSt] = useState(() => initial && key
    ? { key, items: initial.items, total: initial.total, page: 1, loading: false, loadingMore: false, error: false }
    : { key: '', items: [] as Product[], total: 0, page: 0, loading: true, loadingMore: false, error: false });
  const [attempt, setAttempt] = useState(0);
  const req = useRef(0);
  const stRef = useRef(st);
  const busy = useRef(false);
  useEffect(() => { stRef.current = st; }, [st]);

  useEffect(() => {
    if (!key) return;
    if (attempt === 0 && stRef.current.key === key && stRef.current.page > 0) return; // уже есть с сервера
    const id = ++req.current;
    busy.current = false;
    setSt({ key, items: [], total: 0, page: 0, loading: true, loadingMore: false, error: false });
    getProducts({ ...JSON.parse(key), page: 1 })
      .then(r => { if (id === req.current) setSt({ key, items: r.items, total: r.total, page: 1, loading: false, loadingMore: false, error: false }); })
      .catch(() => { if (id === req.current) setSt(x => ({ ...x, loading: false, error: true })); });
  }, [key, attempt]);

  const more = useCallback(() => {
    const cur = stRef.current;
    if (busy.current || !cur.key || cur.loading || cur.error || cur.items.length >= cur.total) return;
    const id = req.current;
    busy.current = true;
    setSt(x => ({ ...x, loadingMore: true }));
    getProducts({ ...JSON.parse(cur.key), page: cur.page + 1 })
      .then(r => { if (id === req.current) setSt(x => ({ ...x, items: x.items.concat(r.items), total: r.total, page: x.page + 1, loadingMore: false })); })
      .catch(() => { if (id === req.current) setSt(x => ({ ...x, loadingMore: false })); })
      .finally(() => { busy.current = false; });
  }, []);

  // Сентинел: наблюдатель пересоздаётся при смене элемента; после догрузки сентинел остаётся в DOM — перепроверяем видимость.
  const io = useRef<IntersectionObserver | null>(null);
  const el = useRef<HTMLElement | null>(null);
  const sentinel = useCallback((node: HTMLElement | null) => {
    io.current?.disconnect();
    el.current = node;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    io.current = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) more(); }, { rootMargin: '120px' });
    io.current.observe(node);
  }, [more]);
  useEffect(() => {
    if (st.loadingMore || !el.current || !io.current) return;
    // Сентинел всё ещё в зоне видимости (короткая страница) — переподписка вызовет колбэк заново.
    io.current.unobserve(el.current); io.current.observe(el.current);
  }, [st.loadingMore, st.page]);
  useEffect(() => () => io.current?.disconnect(), []);

  const fresh = st.key === key;
  return {
    items: fresh ? st.items : [], total: fresh ? st.total : 0,
    loading: !fresh || st.loading, loadingMore: fresh && st.loadingMore, error: fresh && st.error,
    hasMore: fresh && !st.loading && !st.error && st.items.length < st.total,
    retry: () => setAttempt(a => a + 1), sentinel,
  };
}
