'use client';
// Товары корзины с настоящим API: что за позиция стоит за ключом «f7-s» (название, фото, цена, вид доставки).
// Заполняется ответом POST /cart/validate и хранится в localStorage '8mart.cartItems' — корзина и мини-корзина
// показывают позиции сразу после перезагрузки, ещё до ответа сервера. В моке не нужен: resolveCartItem берёт мок-каталог.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { browserStorage } from './storage';
import type { CartProduct } from '@/lib/types';

export const CART_ITEMS_KEY = '8mart.cartItems';
/** Больше не держим: старые позиции вытесняются (корзина редко больше 100 строк). */
const MAX = 200;

interface CartItemsState {
  items: Record<string, CartProduct>;
  remember: (list: CartProduct[]) => void;
}

export const useCartItems = create<CartItemsState>()(persist(
  set => ({
    items: {},
    remember: list => set(st => {
      const items = { ...st.items };
      for (const p of list) { delete items[p.id]; items[p.id] = p; }
      const keys = Object.keys(items);
      for (const k of keys.slice(0, Math.max(0, keys.length - MAX))) delete items[k];
      return { items };
    }),
  }),
  { name: CART_ITEMS_KEY, storage: createJSONStorage(browserStorage), skipHydration: true, version: 1, partialize: s => ({ items: s.items }) },
));
