'use client';
// Можно ли крутить беззвучное превью видео (плавающая миниатюра товара): да, кроме «уменьшить движение» и явной экономии
// трафика (Save-Data). Медленную сеть больше не учитываем (решение владельца 04.11): Chrome на телефоне часто считает
// мобильную сеть «3g» по задержке, и покупатель видел статичную обложку вместо ролика; превью — несколько сотен килобайт.
// На сервере и до гидрации — нельзя: миниатюра показывает обложку, видео подключается уже в браузере.
import { useSyncExternalStore } from 'react';

type Connection = EventTarget & { saveData?: boolean };
const REDUCED = '(prefers-reduced-motion: reduce)';
const connection = () => (navigator as Navigator & { connection?: Connection }).connection;

function subscribe(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  const c = connection();
  mq.addEventListener('change', cb);
  c?.addEventListener('change', cb);
  return () => { mq.removeEventListener('change', cb); c?.removeEventListener('change', cb); };
}

export function canAutoplay(): boolean {
  return !window.matchMedia(REDUCED).matches && !connection()?.saveData;
}

export function useVideoAutoplay(): boolean {
  return useSyncExternalStore(subscribe, canAutoplay, () => false);
}
