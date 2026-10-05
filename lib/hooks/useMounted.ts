'use client';
// true после гидрации (на сервере и при гидрации — false): порталы в document.body рендерим только на клиенте.
import { useSyncExternalStore } from 'react';

const noop = () => () => {};

export function useMounted(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
