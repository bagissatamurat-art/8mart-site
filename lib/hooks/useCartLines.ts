'use client';
// Строки корзины: товар из каталога + количество + «раскупили» (по ответу POST /cart/validate для филиала).
import { useEffect, useMemo, useState } from 'react';
import { resolveCartItem, validateCart } from '@/lib/api';
import { useCart } from '@/lib/store/cart';
import { useUi } from '@/lib/store/ui';
import type { CartProduct } from '@/lib/types';

export interface CartLine { p: CartProduct; qty: number; soldOut: boolean }

export function useCartLines(): { lines: CartLine[]; ready: boolean } {
  const cart = useCart(s => s.lines);
  const hydrated = useUi(s => s.hydrated);
  const [sold, setSold] = useState<Set<string>>(new Set());
  const [validated, setValidated] = useState(false);
  const keys = Object.keys(cart).sort().join(',');
  useEffect(() => {
    if (!hydrated) return;
    let live = true;
    validateCart(useCart.getState().lines).then(r => {
      if (!live) return;
      setSold(new Set(r.lines.filter(l => l.soldOut).map(l => l.id)));
      setValidated(true);
    });
    return () => { live = false; };
  }, [hydrated, keys]);
  const lines = useMemo(() => Object.entries(cart).map(([k, qty]) => {
    const p = resolveCartItem(k);
    return p ? { p, qty, soldOut: sold.has(k) } : null;
  }).filter((l): l is CartLine => !!l), [cart, sold]);
  return { lines, ready: hydrated && (validated || lines.length === 0) };
}
