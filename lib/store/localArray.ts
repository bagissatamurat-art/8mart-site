'use client';
// Стор «массив строк в localStorage» в формате README (`string[]`), синхронный между вкладками и компонентами.
import { create } from 'zustand';

export function createLocalArrayStore(key: string, fallback: () => string[]) {
  const read = (): string[] => {
    try { const v = JSON.parse(localStorage.getItem(key) || 'null'); if (Array.isArray(v)) return v; } catch { /* приватный режим */ }
    return fallback();
  };
  const store = create<{ ids: string[]; hydrated: boolean; set: (ids: string[]) => void }>()(set => ({
    ids: fallback(), hydrated: false,
    set: ids => { try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* приватный режим */ } set({ ids }); },
  }));
  if (typeof window !== 'undefined') {
    queueMicrotask(() => store.setState({ ids: read(), hydrated: true }));
    window.addEventListener('storage', e => { if (e.key === key) store.setState({ ids: read() }); });
  }
  return store;
}
