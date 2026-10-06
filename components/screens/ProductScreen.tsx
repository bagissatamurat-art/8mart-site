'use client';
// Страница товара — 08 Товар.dc.html: 8a (1440) и 8b (390). Тот же MartProductView, что и быстрый просмотр, с page.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MartProductView } from '@/components/MartProductView';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteMiniCart } from '@/components/site/SiteMiniCart';
import { Chevron } from '@/components/ui/Cross';
import { useCart, useCartCount } from '@/lib/store/cart';
import { useMethod } from '@/lib/store/method';
import { setCartQty } from '@/lib/store/ui';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import type { Category, Product, ProductDetail } from '@/lib/types';
import s from '@/components/site/site.module.css';
import p from './ProductScreen.module.css';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { SiteFaq } from '@/components/site/SiteFaq';
import { SiteFooter } from '@/components/site/SiteFooter';

export interface ProductData { product: ProductDetail; group: Product[]; categories: Category[] }

export function ProductScreen({ product, group, categories }: ProductData) {
  const router = useRouter();
  const mobile = useIsMobile();
  const lines = useCart(st => st.lines);
  const count = useCartCount();
  const method = useMethod(st => st.method);
  const cat = categories.find(c => c.sub.some(x => x.slug === product.cat));
  const sub = cat?.sub.find(x => x.slug === product.cat);
  const view = (
    <MartProductView page product={product} group={group} categories={categories} method={method} mode={mobile ? 'mobile' : 'desktop'}
      qtyFor={k => lines[k] || 0} onQty={setCartQty} onPickGroup={id => router.push(`/product/${id}`)}
      after={mobile ? <><SiteFaq /><SiteFooter categories={categories} /></> : undefined} />
  );

  if (mobile) {
    return (
      <div className={p.mPage}>
        <div className={p.mBar}>
          <button type="button" className={p.mBtn} aria-label="Назад" onClick={() => (history.length > 1 ? router.back() : router.push('/catalog'))}>
            <Chevron size={9} color="var(--ink-1)" direction="left" />
          </button>
          <span className={p.mTitle}>{sub?.name}</span>
          <Link href="/cart" className={p.mBtn} aria-label={count ? `Корзина, ${count}` : 'Корзина'}>
            <span className={p.cartIcon} aria-hidden><span /></span>
            {count > 0 && <span className={p.mCount}>{count}</span>}
          </Link>
        </div>
        <div className={p.mBody}><div className={p.mFill}>{view}</div></div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <SiteHeader categories={categories} mobile={false} />
      <div className={p.wrap}>
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Каталог', href: '/catalog' },
          ...(cat ? [{ label: cat.name, href: `/catalog?cat=${cat.slug}` }] : []), { label: sub?.name ?? '' }]} />
        <div className={s.grid2}>
          <div className={`${p.min0} ${p.stack}`}>{view}<SiteFaq /></div>
          <div className={s.aside}><SiteMiniCart /></div>
        </div>
      </div>
      <SiteFooter categories={categories} />
    </div>
  );
}
