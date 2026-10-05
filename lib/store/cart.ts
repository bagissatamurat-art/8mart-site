'use client';
// Корзина: { [lineKey]: qty }, lineKey = id или '<variantId>|<цвет>' (cartKey). localStorage '8mart.cart'.
// В проде синхронизируется с POST /cart/validate (цены, наличие, отправления).
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { browserStorage } from './storage';

export const CART_KEY = '8mart.cart';

interface CartState {
  lines: Record<string, number>;
  /** Раздельная доставка или «всё вместе завтра» (MartSplitChoice). */
  together: boolean;
  /** Применённый промокод (проверен POST /promo/check). Общий для корзины и оформления. */
  promo: { code: string; pct: number } | null;
  setPromo: (p: { code: string; pct: number } | null) => void;
  setQty: (key: string, qty: number) => void;
  add: (key: string, qty?: number) => void;
  setTogether: (v: boolean) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(persist(
  (set, get) => ({
    lines: {},
    together: false,
    promo: null,
    setPromo: promo => set({ promo }),
    setQty: (key, qty) => {
      const lines = { ...get().lines };
      if (qty <= 0) delete lines[key]; else lines[key] = qty;
      set({ lines });
    },
    add: (key, qty = 1) => get().setQty(key, (get().lines[key] || 0) + qty),
    setTogether: together => set({ together }),
    clear: () => set({ lines: {}, promo: null }),
  }),
  // Гидрация вручную после монтирования (StoreHydrator), чтобы SSR-разметка совпала с первой отрисовкой.
  { name: CART_KEY, storage: createJSONStorage(browserStorage), skipHydration: true, version: 1,
    partialize: s => ({ lines: s.lines, together: s.together, promo: s.promo }) },
));

export const cartCount = (lines: Record<string, number>) => Object.values(lines).reduce((s, q) => s + q, 0);
export const useCartCount = () => useCart(s => cartCount(s.lines));
