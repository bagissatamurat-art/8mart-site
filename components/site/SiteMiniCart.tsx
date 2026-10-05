'use client';
// Мини-корзина desktop (колонка 340, sticky top 16) на сторе корзины и способа получения.
import { MartMiniCart } from '@/components/MartMiniCart';
import { useCart } from '@/lib/store/cart';
import { useMethod } from '@/lib/store/method';
import { setCartQty } from '@/lib/store/ui';

export function SiteMiniCart() {
  const lines = useCart(s => s.lines);
  const together = useCart(s => s.together);
  const method = useMethod(s => s.method);
  return <MartMiniCart cart={lines} method={method || 'delivery'} together={together} onChange={setCartQty} />;
}
