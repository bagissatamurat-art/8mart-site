'use client';
// Главная — 01 Главная и каталог.dc.html: 1a (1440) и 1b (390).
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MartStories } from '@/components/MartStories';
import { MartBanner } from '@/components/MartBanner';
import { MartChip } from '@/components/MartChip';
import { Toast } from '@/components/ui/Toast';
import { HOME_H1 } from '@/lib/seo';
import { CategorySidebar } from '@/components/site/CategorySidebar';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteTabBar } from '@/components/site/SiteTabBar';
import { SiteMiniCart } from '@/components/site/SiteMiniCart';
import { ProductShelf } from '@/components/site/ProductShelf';
import { autoOpenMethodOnce, useUi } from '@/lib/store/ui';
import type { Banner, Category, Product, Story } from '@/lib/types';
import s from '@/components/site/site.module.css';
import h from './HomeScreen.module.css';
import { TOASTS } from '@/lib/copy';

export interface HomeData { categories: Category[]; stories: Story[]; banner: Banner; deals: Product[]; flowers: Product[] }

export function HomeScreen({ categories, stories, banner, deals, flowers }: HomeData) {
  const router = useRouter();
  const hydrated = useUi(st => st.hydrated);
  const [deleted, setDeleted] = useState(false);

  // Способ не выбран — показываем модалку один раз за сессию (её можно закрыть).
  useEffect(() => { if (hydrated) autoOpenMethodOnce(); }, [hydrated]);

  // ?deleted=1 — после удаления аккаунта
  useEffect(() => { if (new URLSearchParams(location.search).get('deleted') === '1') setDeleted(true); }, []);

  return (
    <div className={s.page}>
      {deleted && <Toast onClose={() => setDeleted(false)}>{TOASTS.accountDeleted}</Toast>}
      <SiteHeader categories={categories} />
      <div className={s.grid}>
        <div className={s.side}><CategorySidebar categories={categories} /></div>
        <main className={s.main}>
          <h1 className="visually-hidden">{HOME_H1}</h1>
          <div className={h.top}>
            <div className={s.desktopOnly}><MartStories stories={stories} mode="desktop" /></div>
            <div className={s.mobileOnly}><MartStories stories={stories} mode="mobile" /></div>
            <div className={s.mobileOnly}>
              <div className={s.chips}>
                <MartChip label="Все" selected />
                {categories.map(c => <MartChip key={c.slug} label={c.name} onClick={() => router.push(`/catalog?cat=${c.slug}`)} />)}
              </div>
            </div>
            <div className={s.desktopOnly}><MartBanner banner={banner} mode="desktop" /></div>
            <div className={s.mobileOnly}><MartBanner banner={banner} mode="mobile" /></div>
          </div>
          <ProductShelf title="Выгодная полка" href="/catalog?sale=1" products={deals} />
          <ProductShelf title="Цветы" href="/catalog?cat=tsvety" products={flowers} />
        </main>
        <div className={s.aside}><SiteMiniCart /></div>
      </div>
      <SiteTabBar active="home" />
    </div>
  );
}
