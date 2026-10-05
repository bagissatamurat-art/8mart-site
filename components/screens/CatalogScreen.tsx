'use client';
// Каталог — 07 Каталог.dc.html: 7a (1440) и 7b (390). Уровни: корень (плитки категорий) → категория (плитки подкатегорий
// + «Все товары») → список (фильтры, сортировка, бесконечная прокрутка по PAGE_SIZE). Состояние — в адресе (components/catalog/catalogUrl.ts).
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MartChip } from '@/components/MartChip';
import { MartProductCard } from '@/components/MartProductCard';
import { MartFiltersButton, MartFiltersPanel, MartFiltersSheet, filterChips, filtersToQuery, resetFilters, type FilterGroup, type FiltersValue } from '@/components/MartFilters';
import { MartSort, MartSortButton, MartSortSheet } from '@/components/MartSort';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteMiniCart } from '@/components/site/SiteMiniCart';
import { SiteTabBar } from '@/components/site/SiteTabBar';
import { CatalogSidebar } from '@/components/catalog/CatalogSidebar';
import { CatalogTopBar } from '@/components/catalog/CatalogTopBar';
import { RootTiles, SubTiles, type CatalogStats } from '@/components/catalog/CatalogTiles';
import { catalogHref, catalogLevel, parseCatalog, type CatalogState } from '@/components/catalog/catalogUrl';
import { useCatalogList } from '@/components/catalog/useCatalogList';
import { getFacets } from '@/lib/api';
import { CAT_FILTERS, PAGE_SIZE } from '@/lib/config';
import { CATALOG } from '@/lib/copy';
import { itemsTitle } from '@/lib/domain';
import { useCart } from '@/lib/store/cart';
import { setCartQty, useUi } from '@/lib/store/ui';
import type { Category, ProductQuery, SortId } from '@/lib/types';
import s from '@/components/site/site.module.css';
import c from '@/components/catalog/catalog.module.css';
import k from './CatalogScreen.module.css';

export type { CatalogStats };

/** Ввод цены пишем в адрес с задержкой, чтобы не плодить запросы на каждую цифру. */
const PRICE_DEBOUNCE = 400;

export function CatalogScreen({ categories, stats }: { categories: Category[]; stats: CatalogStats }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const search = sp.toString();
  const url = useMemo(() => parseCatalog(new URLSearchParams(search), categories), [search, categories]);
  const level = catalogLevel(url);
  const category = categories.find(x => x.slug === url.cat) || null;
  const subs = category?.sub ?? [];
  const sub = subs.find(x => x.slug === url.sub) || null;
  const defs = useMemo(() => (url.cat ? CAT_FILTERS[url.cat] || [] : []), [url.cat]);
  /** /catalog?sale=1 без категории: скидка — суть страницы, а не снимаемый фильтр. */
  const saleShelf = !url.cat && level === 'list';

  const lines = useCart(st => st.lines);
  const openQuickView = useUi(st => st.openQuickView);

  // ── Фильтры: локальная копия (поле цены не прыгает при наборе), адрес — источник правды ──
  const [filters, setFilters] = useState<FiltersValue>(url.filters);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { if (!timer.current) setFilters(url.filters); }, [url.filters]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const go = useCallback((patch: Partial<CatalogState>, mode: 'push' | 'replace' = 'push', scroll = true) => {
    const href = catalogHref({ ...url, ...patch });
    if (mode === 'push') router.push(href, { scroll });
    else router.replace(href, { scroll });
  }, [url, router]);

  const applyFilters = (v: FiltersValue) => {
    const next = saleShelf ? { ...v, sale: true } : v;
    setFilters(next);
    if (timer.current) clearTimeout(timer.current);
    const priceOnly = Object.keys(next).every(x => x === 'min' || x === 'max' || JSON.stringify(next[x]) === JSON.stringify(filters[x]));
    const write = () => { timer.current = null; go({ filters: next }, 'replace', false); };
    if (priceOnly) timer.current = setTimeout(write, PRICE_DEBOUNCE); else write();
  };
  const panelValue: FiltersValue = saleShelf ? { ...filters, sale: false } : filters;
  const chips = filterChips(panelValue, defs);
  const resetAll = () => applyFilters(resetFilters(panelValue));
  const setSort = (sort: SortId) => go({ sort }, 'replace');

  // ── Данные ──
  const query = useMemo<Omit<ProductQuery, 'page'> | null>(() => level !== 'list' ? null : {
    category: url.cat ?? undefined, sub: url.sub ?? undefined, sort: url.sort, ...filtersToQuery(url.filters, defs),
  }, [level, url, defs]);
  const list = useCatalogList(query);
  // Счётчик в CTA листа фильтров не падает в 0, пока грузится новая выборка.
  const [lastTotal, setLastTotal] = useState(0);
  useEffect(() => { if (!list.loading) setLastTotal(list.total); }, [list.loading, list.total]);
  const resultCount = list.loading ? lastTotal : list.total;
  const [groups, setGroups] = useState<FilterGroup[]>([]);
  useEffect(() => {
    if (!url.cat) { setGroups([]); return; }
    let live = true;
    getFacets({ category: url.cat, sub: url.sub ?? undefined }).then(g => { if (live) setGroups(g); });
    return () => { live = false; };
  }, [url.cat, url.sub]);

  const [sheet, setSheet] = useState<'filters' | 'sort' | null>(null);
  useEffect(() => { setSheet(null); }, [pathname, url.cat, url.sub]);

  // ── Заголовки и навигация ──
  const title = level === 'root' ? CATALOG.title : saleShelf ? CATALOG.saleTitle : sub ? sub.name : category?.name ?? CATALOG.title;
  const countText = level === 'list' && !list.loading && !list.error ? itemsTitle(list.total) : '';
  const backHref = level === 'list' && category && subs.length ? catalogHref({ cat: category.slug }) : '/catalog';
  const crumbs: [string, string | null][] = [['Главная', '/'], [CATALOG.title, level !== 'root' ? '/catalog' : null]];
  if (saleShelf) crumbs.push([CATALOG.saleTitle, null]);
  else if (level !== 'root' && category) crumbs.push([category.name, level === 'list' && subs.length ? catalogHref({ cat: category.slug }) : null]);
  if (level === 'list' && sub) crumbs.push([sub.name, null]);

  const subChips = category && subs.length > 0 ? [
    { key: '', name: CATALOG.allChip, sel: !sub, pick: () => go({ sub: null, all: true }) },
    ...subs.map(x => ({ key: x.slug, name: x.name, sel: x.slug === url.sub, pick: () => go({ sub: x.slug, all: false }) })),
  ] : [];
  const renderSubChips = () => subChips.map(x => <MartChip key={x.key} label={x.name} selected={x.sel} onClick={x.pick} />);
  const renderActiveChips = () => chips.map(x => <MartChip key={x.label} label={x.label} removable onClick={() => applyFilters(x.remove())} />);

  // ── Содержимое по уровню ──
  const skeletons = (n: number, ref?: (el: HTMLElement | null) => void) => (
    <div className={k.grid} ref={ref} aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className={`${c.skel} ${i >= n / 2 ? k.desktopExtra : ''}`}><div className={c.skelPhoto} /><div className={c.skelLine} /><div className={c.skelLine2} /></div>
      ))}
    </div>
  );

  const listBody = () => {
    if (list.loading) return <div aria-busy="true" aria-label="Загрузка">{skeletons(8)}</div>;
    if (list.error) {
      return (
        <div className={k.empty} role="alert">
          <b className={k.emptyTitle}>{CATALOG.error.title}</b>
          <span className={k.emptyText}>{CATALOG.error.text}</span>
          <button type="button" className={k.emptyBtn} onClick={list.retry}>{CATALOG.error.retry}</button>
        </div>
      );
    }
    if (!list.items.length) {
      return (
        <div className={k.empty}>
          <b className={k.emptyTitle}>{CATALOG.listEmpty.title}</b>
          <span className={k.emptyText}>{chips.length ? CATALOG.listEmpty.filtered : CATALOG.listEmpty.plain}</span>
          {chips.length > 0 && <button type="button" className={k.emptyBtn} onClick={resetAll}>{CATALOG.resetFilters}</button>}
        </div>
      );
    }
    return (
      <>
        <div className={k.grid}>
          {list.items.map(p => (
            <MartProductCard key={p.id} product={p} qty={lines[p.id] || 0} onQty={setCartQty} onOpen={x => openQuickView(x.id)} />
          ))}
        </div>
        {list.hasMore && skeletons(4, list.sentinel)}
        {!list.hasMore && !list.loadingMore && list.total > PAGE_SIZE && <span className={k.end}>{CATALOG.end}</span>}
      </>
    );
  };

  return (
    <div className={s.page}>
      <SiteHeader categories={categories} mobile={false} />
      <div className={s.mobileOnly}>
        <CatalogTopBar root={level === 'root'} title={title} count={countText} backHref={backHref}>
          {level === 'list' ? (
            <>
              <MartFiltersButton count={chips.length} onClick={() => setSheet('filters')} />
              <MartSortButton value={url.sort} onClick={() => setSheet('sort')} />
              {renderSubChips()}
            </>
          ) : undefined}
        </CatalogTopBar>
      </div>

      <div className={k.layout}>
        <div className={k.side}>
          <CatalogSidebar categories={categories} level={level} cat={url.cat} sub={url.sub} />
          {level === 'list' && (
            <MartFiltersPanel value={panelValue} groups={groups} resultCount={resultCount} showToggles={false} onChange={applyFilters} onReset={resetAll} />
          )}
        </div>

        <main className={k.main}>
          <div className={s.desktopOnly}>
            <nav className={k.crumbs} aria-label="Навигация">
              {crumbs.map(([label, href], i) => (
                <span key={label + i} className={k.crumb}>
                  {i > 0 && <span aria-hidden>·</span>}
                  {href ? <Link href={href}>{label}</Link> : <span className={k.current} aria-current="page">{label}</span>}
                </span>
              ))}
            </nav>
            <div className={k.titleRow}>
              <h1 className={k.h1}>{title}</h1>
              {countText && <span className={k.count}>{countText}</span>}
            </div>
          </div>

          {level === 'root' && <RootTiles categories={categories} stats={stats} />}

          {level === 'cat' && category && (subs.length ? <SubTiles category={category} stats={stats} /> : (
            <div className={k.empty}>
              <b className={k.emptyTitle}>{CATALOG.catEmpty.title}</b>
              <span className={k.emptyText}>{CATALOG.catEmpty.text}</span>
              <Link href="/catalog" className={`${k.emptyBtn} ${k.desktopOnlyFlex}`}>{CATALOG.allCategories}</Link>
            </div>
          ))}

          {level === 'list' && (
            <>
              {subChips.length > 0 && <div className={`${k.chips} ${k.desktopOnlyFlex}`}>{renderSubChips()}</div>}
              <div className={`${k.controls} ${k.desktopOnlyFlex}`}>
                <div className={k.chips}>{renderActiveChips()}</div>
                <div className={k.sort}><MartSort value={url.sort} onChange={setSort} /></div>
              </div>
              {chips.length > 0 && <div className={`${k.chipsM} ${k.mobileOnlyFlex}`}>{renderActiveChips()}</div>}
              {listBody()}
            </>
          )}
        </main>

        <div className={k.aside}><SiteMiniCart /></div>
      </div>

      <SiteTabBar active="catalog" />

      {level === 'list' && (
        <>
          <MartFiltersSheet open={sheet === 'filters'} onClose={() => setSheet(null)} value={panelValue} groups={groups}
            resultCount={resultCount} showToggles={false} onChange={applyFilters} onReset={resetAll} />
          <MartSortSheet open={sheet === 'sort'} onClose={() => setSheet(null)} value={url.sort} onChange={setSort} />
        </>
      )}
    </div>
  );
}
