'use client';
// Данные кабинета через lib/api.ts: заказы, адреса, карты, промокоды, бонусы, профиль — разом после входа
// (счётчики сайдбара нужны на любом разделе); товары избранного — по id из useFavorites(), когда открыт раздел.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAddresses, getBonus, getCards, getMe, getOrders, getProductsByIds, getUserPromos } from '@/lib/api';
import { useFavorites, useFavoritesStore } from '@/lib/store/favorites';
import type { Address, Bonus, Card, Order, Product, User, UserPromo } from '@/lib/types';

export interface AccountState {
  orders?: Order[];
  addresses?: Address[];
  cards?: Card[];
  promos?: UserPromo[];
  bonus?: Bonus | null;
  me?: User;
}

export function useAccountData(enabled: boolean, needFavorites: boolean) {
  const [st, setSt] = useState<AccountState>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) { setSt({}); setError(false); return; }
    let on = true;
    // Каждый запрос сам по себе: упавший раздел не держит остальные в скелетонах
    const put = <K extends keyof AccountState>(k: K, p: Promise<AccountState[K]>, empty: AccountState[K]) =>
      p.then(v => { if (on) setSt(x => ({ ...x, [k]: v })); })
        .catch(() => { if (on) { setError(true); setSt(x => ({ ...x, [k]: empty })); } });
    put('orders', getOrders(), []);
    put('addresses', getAddresses(), []);
    put('cards', getCards(), []);
    put('promos', getUserPromos(), []);
    put('bonus', getBonus(), null);
    put('me', getMe(), undefined);
    return () => { on = false; };
  }, [enabled]);

  // Избранное: кэш товаров по id, порядок — как в сторе (новые сверху)
  const ids = useFavorites();
  const favHydrated = useFavoritesStore(s => s.hydrated);
  const cache = useRef(new Map<string, Product>());
  const [favorites, setFavorites] = useState<Product[] | undefined>(undefined);
  useEffect(() => {
    if (!enabled || !needFavorites || !favHydrated) return;
    let on = true;
    const missing = ids.filter(id => !cache.current.has(id));
    const done = () => { if (on) setFavorites(ids.map(id => cache.current.get(id)).filter((p): p is Product => !!p)); };
    if (!missing.length) { done(); return; }
    getProductsByIds(missing).then(list => { list.forEach(p => cache.current.set(p.id, p)); done(); });
    return () => { on = false; };
  }, [enabled, needFavorites, favHydrated, ids]);

  const patch = useCallback((p: Partial<AccountState> | ((x: AccountState) => Partial<AccountState>)) =>
    setSt(x => ({ ...x, ...(typeof p === 'function' ? p(x) : p) })), []);
  return { ...st, favorites, error, patch };
}
