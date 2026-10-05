'use client';
// Полка товаров: заголовок + «Все →» + сетка (desktop 4 в ряд gap 12, mobile 2 gap 8). Количество — из стора корзины.
import Link from 'next/link';
import { MartProductCard } from '@/components/MartProductCard';
import { useCart } from '@/lib/store/cart';
import { setCartQty, useUi } from '@/lib/store/ui';
import type { Product } from '@/lib/types';
import s from './site.module.css';

export function ProductShelf({ title, href, products }: { title: string; href: string; products: Product[] }) {
  const lines = useCart(st => st.lines);
  const openQuickView = useUi(st => st.openQuickView);
  return (
    <section className={s.shelf} aria-label={title}>
      <div className={s.shelfHead}><h2 className={s.shelfTitle}><Link href={href} className={s.shelfTitleLink}>{title}</Link></h2><Link href={href} className={s.shelfAll}>Все →</Link></div>
      <div className={s.cards}>
        {products.map(p => (
          <MartProductCard key={p.id} product={p} qty={lines[p.id] || 0} onQty={setCartQty} onOpen={x => openQuickView(x.id)} />
        ))}
      </div>
    </section>
  );
}
