'use client';
// Строки корзины: товар + количество + «раскупили» — по ответу POST /cart/validate для выбранного филиала.
// С API товар (название, фото, цена) приходит в том же ответе; when — срок от сервера (учитывает график филиала).
import { useEffect, useMemo, useState } from 'react';
import { resolveCartItem, validateCart } from '@/lib/api';
import { useCart } from '@/lib/store/cart';
import { useCartItems } from '@/lib/store/cartItems';
import { useMethod } from '@/lib/store/method';
import { useUi } from '@/lib/store/ui';
import type { CartProduct } from '@/lib/types';

export interface CartLine { p: CartProduct; qty: number; soldOut: boolean }
/** Срок по виду отправления от сервера: «Сегодня с 09:00», если филиал сейчас закрыт. */
export type ServerWhen = Partial<Record<'courier' | 'cargo', string>>;

export function useCartLines(): { lines: CartLine[]; ready: boolean; when: ServerWhen } {
  const cart = useCart(s => s.lines);
  const hydrated = useUi(s => s.hydrated);
  const known = useCartItems(s => s.items);
  const method = useMethod(s => s.method);
  const pickupPointId = useMethod(s => s.pickupPointId);
  const lat = useMethod(s => s.lat), lng = useMethod(s => s.lng);
  const [sold, setSold] = useState<Set<string>>(new Set());
  const [when, setWhen] = useState<ServerWhen>({});
  const [validated, setValidated] = useState(false);
  const keys = Object.keys(cart).sort().join(',');
  useEffect(() => {
    if (!hydrated) return;
    let live = true;
    const place = method === 'pickup' && pickupPointId ? { method, pickupPointId }
      : method === 'delivery' && lat != null && lng != null ? { method, lat, lng } : method ? { method } : {};
    validateCart(useCart.getState().lines, place).then(r => {
      if (!live) return;
      setSold(new Set(r.lines.filter(l => l.soldOut).map(l => l.id)));
      setWhen(Object.fromEntries(r.plan.list.map(sh => [sh.kind, sh.when])));
      setValidated(true);
    }).catch(() => { if (live) setValidated(true); });
    return () => { live = false; };
  }, [hydrated, keys, method, pickupPointId, lat, lng]);
  const lines = useMemo(() => Object.entries(cart).map(([k, qty]) => {
    const p = resolveCartItem(k);
    return p ? { p, qty, soldOut: sold.has(k) } : null;
  }).filter((l): l is CartLine => !!l), [cart, sold, known]); // eslint-disable-line react-hooks/exhaustive-deps -- known: позиции пришли с сервера
  return { lines, ready: hydrated && (validated || Object.keys(cart).length === 0), when };
}
