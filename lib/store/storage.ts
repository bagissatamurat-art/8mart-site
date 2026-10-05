'use client';
// localStorage только в браузере (и в тестах, где его подставляет vitest.setup); на сервере — пустое хранилище,
// без обращения к localStorage в Node (иначе ExperimentalWarning при сборке).
import type { StateStorage } from 'zustand/middleware';

const memory: StateStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
export const browserStorage = (): StateStorage => {
  if (typeof window !== 'undefined') return window.localStorage;
  const ls = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  return ls && 'value' in ls ? (ls.value as StateStorage) : memory;
};
