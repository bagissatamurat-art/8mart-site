'use client';
// Способ получения: { method, city, address, lat, lng, pickupPointId } (README → «Стейт»). localStorage '8mart.method'.
// Выбирается до первого добавления в корзину; модалку можно закрыть всегда.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { browserStorage } from './storage';
import type { MethodValue } from '@/components/method/types';

export const METHOD_KEY = '8mart.method';

interface MethodState extends MethodValue {
  /** Подпись для шапки: «Астана, Кабанбай батыра, 11» / адрес точки. */
  label: string;
  set: (v: MethodValue, label: string) => void;
  reset: () => void;
}

const EMPTY: MethodValue = { method: null, city: 'astana', address: '', lat: null, lng: null, pickupPointId: null };

export const useMethod = create<MethodState>()(persist(
  set => ({
    ...EMPTY, label: '',
    set: (v, label) => set({ ...EMPTY, ...v, label }),
    reset: () => set({ ...EMPTY, label: '' }),
  }),
  { name: METHOD_KEY, storage: createJSONStorage(browserStorage), skipHydration: true, version: 1,
    partialize: ({ set: _s, reset: _r, ...v }) => v },
));

export const methodValue = (s: MethodState): MethodValue => ({
  method: s.method, city: s.city, address: s.address, lat: s.lat, lng: s.lng, pickupPointId: s.pickupPointId, entrance: s.entrance, flat: s.flat,
});
