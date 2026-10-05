'use client';
// Избранное — общий стор на все экраны: гость — localStorage '8mart.favorites' (string[]),
// вошедший — синк с GET/PUT /favorites (lib/api.ts).
import { FAVORITES_KEY } from '../config';
import { FAVORITES } from '../mock';
import { createLocalArrayStore } from './localArray';

// Без сохранённого значения — демо-набор из мока, как getFavorites() в прототипе.
export const useFavoritesStore = createLocalArrayStore(FAVORITES_KEY, () => FAVORITES.slice());

export function setFavorite(id: string, on: boolean) {
  const cur = useFavoritesStore.getState().ids.filter(x => x !== id);
  useFavoritesStore.getState().set(on ? [id, ...cur] : cur);
}
export const useFavorites = () => useFavoritesStore(s => s.ids);
export const useIsFavorite = (id: string) => useFavoritesStore(s => s.ids.includes(id));
