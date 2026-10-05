'use client';
// Мини-корзина desktop (колонка 340, sticky top 16) на сторе корзины и способа получения.
import { MartMiniCart } from '@/components/MartMiniCart';
import { useCart } from '@/lib/store/cart';
import { useMethod } from '@/lib/store/method';
import { setCartQty, useUi } from '@/lib/store/ui';
import { Skeleton } from '@/components/ui/Spinner';
import s from './site.module.css';

function MiniCartSkeleton() {
  return (
    <div aria-busy="true" className={s.miniSkel}>
      <Skeleton w="50%" h={20} r={8} />
      {[0, 1, 2].map(i => (
        <div key={i} className={s.miniSkelRow}><Skeleton w={56} h={56} r={12} /><div><Skeleton w="80%" h={12} r={6} /><Skeleton w="40%" h={12} r={6} /></div></div>
      ))}
      <Skeleton w="100%" h={56} r={28} />
    </div>
  );
}

export function SiteMiniCart() {
  const lines = useCart(c => c.lines);
  const together = useCart(c => c.together);
  const method = useMethod(m => m.method);
  const hydrated = useUi(u => u.hydrated);
  // До чтения корзины из localStorage — скелетон, а не «Корзина пуста».
  if (!hydrated) return <MiniCartSkeleton />;
  return <MartMiniCart cart={lines} method={method || 'delivery'} together={together} onChange={setCartQty} />;
}
