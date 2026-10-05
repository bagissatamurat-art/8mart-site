'use client';
// Подсказки поиска с debounce 200 мс. undefined при непустом запросе — загрузка.
import { useEffect, useState } from 'react';
import { searchSuggest } from '@/lib/api';
import type { SearchSuggest } from '@/components/MartSearch';

export function useSuggest(q: string): SearchSuggest | undefined {
  const [res, setRes] = useState<{ q: string; data: SearchSuggest } | null>(null);
  useEffect(() => {
    const query = q.trim();
    if (!query) return;
    let live = true;
    const t = setTimeout(() => searchSuggest(query).then(data => { if (live) setRes({ q: query, data }); }), 200);
    return () => { live = false; clearTimeout(t); };
  }, [q]);
  if (!q.trim()) return { categories: [], products: [], total: 0 };
  return res && res.q === q.trim() ? res.data : undefined;
}
