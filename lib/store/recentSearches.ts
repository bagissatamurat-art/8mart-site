'use client';
// Недавние запросы поиска («Вы искали») — localStorage '8mart.recentSearches' (string[], свежие первыми, до 5).
import { createLocalArrayStore } from './localArray';

export const RECENT_SEARCHES_KEY = '8mart.recentSearches';
export const RECENT_SEARCHES_MAX = 5;

export const useRecentSearchesStore = createLocalArrayStore(RECENT_SEARCHES_KEY, () => []);

/** Запомнить запрос: в начало списка, без повторов (без учёта регистра), не больше RECENT_SEARCHES_MAX. */
export function addRecentSearch(q: string) {
  const v = q.trim().replace(/\s+/g, ' ');
  if (!v) return;
  const s = useRecentSearchesStore.getState();
  const rest = s.ids.filter(x => x.toLowerCase() !== v.toLowerCase());
  s.set([v, ...rest].slice(0, RECENT_SEARCHES_MAX));
}

export const clearRecentSearches = () => useRecentSearchesStore.getState().set([]);
export const useRecentSearches = () => useRecentSearchesStore(s => s.ids);
