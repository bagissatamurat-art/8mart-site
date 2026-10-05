'use client';
// Шапка сайта: desktop 80 (MartHeader + подсказки MartSearch + меню) и mobile 124 (белая, r24 снизу; поиск — отдельный экран).
// Способ получения — из стора method; клик открывает MartMethodModal.
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MartHeader } from '@/components/MartHeader';
import { MartSearch, MartSearchScreen } from '@/components/MartSearch';
import { useMethod } from '@/lib/store/method';
import { useAuth } from '@/lib/store/auth';
import { addRecentSearch, clearRecentSearches, useRecentSearches } from '@/lib/store/recentSearches';
import { useUi } from '@/lib/store/ui';
import { useSuggest } from '@/lib/hooks/useSuggest';
import { getBonus, getOrders, getUserPromos } from '@/lib/api';
import { useFavorites } from '@/lib/store/favorites';
import { isActiveOrder } from '@/components/account/sections';
import type { AccountSection } from '@/components/MartHeader';
import type { Category, Order, Product } from '@/lib/types';
import s from './site.module.css';

export function SiteHeader({ categories, mobile = true, query }: { categories: Category[]; /** false — на странице без mobile-шапки (товар) */ mobile?: boolean; /** Запрос в поле (страница поиска) */ query?: string }) {
  const router = useRouter();
  const method = useMethod(st => st.method);
  const label = useMethod(st => st.label);
  const openMethod = useUi(st => st.openMethod);
  const hydrated = useUi(st => st.hydrated);
  const user = useAuth(st => st.user);
  const logout = useAuth(st => st.logout);
  const openQuickView = useUi(st => st.openQuickView);
  const [q, setQ] = useState(query ?? '');
  const recent = useRecentSearches();
  const pathname = usePathname();
  const favorites = useFavorites();
  // Меню вошедшего: активный заказ и счётчики разделов кабинета (06).
  const [menuData, setMenuData] = useState<{ orders: Order[]; badges: Partial<Record<AccountSection, number>> }>({ orders: [], badges: {} });
  useEffect(() => {
    if (!user) return;
    let live = true;
    Promise.all([getOrders(), getUserPromos(), getBonus()]).then(([orders, promos, bonus]) => {
      if (live) setMenuData({ orders, badges: { orders: orders.filter(isActiveOrder).length, promos: promos.filter(p => p.status === 'active').length, bonus: bonus.balance } });
    });
    return () => { live = false; };
  }, [user]);
  const [screen, setScreen] = useState(false);
  const suggest = useSuggest(q);

  const submit = (v: string) => { if (!v.trim()) return; addRecentSearch(v.trim()); setScreen(false); router.push(`/search?q=${encodeURIComponent(v.trim())}`); };
  const pick = (p: Product) => { setScreen(false); openQuickView(p.id); };
  const category = (slug: string) => { setScreen(false); const root = categories.find(c => c.sub.some(x => x.slug === slug)); router.push(`/catalog?cat=${root?.slug ?? ''}&sub=${slug}`); };

  return (
    <>
      <div className={s.desktopOnly}>
        <div className={s.headerWrap}>
          <MartHeader mode="desktop" method={method} address={label} methodLoading={!hydrated} categories={categories} query={q}
            userName={user ? user.name || 'Профиль' : ''} userPhone={user?.phone} onLogout={() => { logout(); router.push('/'); }}
            orders={user ? menuData.orders : []} accountBadges={{ ...menuData.badges, favorites: favorites.length }}
            loginHref={`/login?next=${encodeURIComponent(pathname || '/')}`}
            onMethod={openMethod} onQuery={setQ} onSubmit={submit}
            searchPanel={<MartSearch query={q} mode="desktop" suggest={suggest} recent={recent} onClearRecent={clearRecentSearches} onQuery={setQ} onPick={pick} onCategory={category} onSubmit={submit} />} />
        </div>
      </div>
      {mobile && (
        <div className={s.mobileOnly}>
          <div className={s.mobileHeader}>
            <MartHeader mode="mobile" method={method} address={label} methodLoading={!hydrated} query="" onMethod={openMethod}
              onSearchFocus={() => setScreen(true)} />
          </div>
          {screen && (
            <div className={s.searchScreen} role="dialog" aria-modal="true" aria-label="Поиск">
              <div className={s.searchScreenInner}>
                <MartSearchScreen query={q} onQuery={setQ} suggest={suggest} recent={recent} onClearRecent={clearRecentSearches} autoFocus onBack={() => setScreen(false)}
                  onPick={pick} onCategory={category} onSubmit={submit} />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
