'use client';
// Можно ли крутить беззвучное превью видео (миниатюра товара): не при «уменьшить движение», не в режиме экономии трафика
// и не на медленной сети (Network Information API; в Safari его нет — сеть считаем обычной). На сервере и до гидрации —
// нельзя: миниатюра показывает обложку, видео подключается уже в браузере.
import { useSyncExternalStore } from 'react';

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };
const REDUCED = '(prefers-reduced-motion: reduce)';
/** Медленнее 4G превью (несколько сотен килобайт) грузилось бы дольше, чем его смотрят. */
const SLOW = new Set(['slow-2g', '2g', '3g']);
const connection = () => (navigator as Navigator & { connection?: Connection }).connection;

function subscribe(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  const c = connection();
  mq.addEventListener('change', cb);
  c?.addEventListener('change', cb);
  return () => { mq.removeEventListener('change', cb); c?.removeEventListener('change', cb); };
}

export function canAutoplay(): boolean {
  if (window.matchMedia(REDUCED).matches) return false;
  const c = connection();
  return !c?.saveData && !SLOW.has(c?.effectiveType ?? '');
}

export function useVideoAutoplay(): boolean {
  return useSyncExternalStore(subscribe, canAutoplay, () => false);
}
