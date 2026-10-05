'use client';
// Брейкпоинт сайта 1024 (--breakpoint в tokens.css): уже 1024 — mobile. На сервере и до гидрации — desktop.
import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 1023.98px)';

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
