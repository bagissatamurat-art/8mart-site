'use client';
// Результаты поиска — 05 Поиск.dc.html: 5c (1440) и 5d (390); пустой запрос на mobile — экран поиска 5b.
// Состояния: загрузка (скелетоны), результаты (лента по PAGE_SIZE с подгрузкой), «С такими фильтрами ничего нет»,
// «Ничего не нашли» (как в MartSearch: подсказка + «Часто ищут»), пустой запрос («Вы искали» + «Часто ищут»).
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MartButton } from '@/components/MartButton';
import { MartChip } from '@/components/MartChip';
import {
  MartFiltersButton, MartFiltersPanel, MartFiltersSheet, filterChips, filtersToQuery, hasActiveFilters, type FilterGroup, type FiltersValue,
} from '@/components/MartFilters';
import { MartProductCard } from '@/components/MartProductCard';
import { MartSearch, MartSearchScreen, SEARCH_POPULAR } from '@/components/MartSearch';
import { MartSort, MartSortSheet } from '@/components/MartSort';
import { Chevron } from '@/components/ui/Cross';
import { Skeleton } from '@/components/ui/Spinner';
import { CategorySidebar } from '@/components/site/CategorySidebar';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteMiniCart } from '@/components/site/SiteMiniCart';
import { SiteTabBar } from '@/components/site/SiteTabBar';
import { useSearchIndex, useSearchPages, useSentinel } from '@/components/search/useSearch';
import { CAT_FILTERS, SORTS, type FilterDef } from '@/lib/config';
import { itemsTitle } from '@/lib/domain';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useSuggest } from '@/lib/hooks/useSuggest';
import { useCart } from '@/lib/store/cart';
import { addRecentSearch, clearRecentSearches, useRecentSearches, useRecentSearchesStore } from '@/lib/store/recentSearches';
import { setCartQty, useUi } from '@/lib/store/ui';
import type { Category, Product, SortId } from '@/lib/types';
import { EMPTY, SEARCH } from '@/lib/copy';
import site from '@/components/site/site.module.css';
import s from './SearchScreen.module.css';
import { Img } from '@/components/ui/Img';

/** Сортировки поиска: по умолчанию «По релевантности» (5c) — порядок выдачи, в API это sort по умолчанию (id 'popular'). */
const SEARCH_SORTS: [SortId, string][] = [['popular', SEARCH.relevance], ...SORTS.filter(x => x[0] !== 'popular')];
const EMPTY_FILTERS: FiltersValue = { min: '', max: '', inStock: false, sale: false };
/** Задержка перед запросом при вводе цены. */
const FILTER_DEBOUNCE = 300;

const searchHref = (q: string) => `/search?q=${encodeURIComponent(q.trim())}`;

const attrValues = (p: Product, attr: FilterDef['attr']): string[] => {
  const v = (p as unknown as Record<string, unknown>)[attr];
  return Array.isArray(v) ? (v as string[]) : v ? [String(v)] : [];
};

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export function SearchScreen({ q, categories }: { q: string; categories: Category[] }) {
  const router = useRouter();
  const mobile = useIsMobile();
  const lines = useCart(st => st.lines);
  const openQuickView = useUi(st => st.openQuickView);
  const recent = useRecentSearches();
  const recentHydrated = useRecentSearchesStore(st => st.hydrated);

  const [sub, setSub] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersValue>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortId>('popular');
  const [sheet, setSheet] = useState<'filters' | 'sort' | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(q);
  const suggest = useSuggest(draft);

  // Запрос с сайта → «Вы искали» (после чтения localStorage, чтобы не затереть сохранённое).
  useEffect(() => { if (q && recentHydrated) addRecentSearch(q); }, [q, recentHydrated]);

  const go = (v: string) => { if (v.trim()) { setEditing(false); router.push(searchHref(v)); } };
  const openProduct = (p: Product) => { setEditing(false); openQuickView(p.id); };
  const goCategory = (slug: string) => {
    setEditing(false);
    const root = categories.find(c => c.sub.some(x => x.slug === slug));
    router.push(`/catalog?cat=${root?.slug ?? ''}&sub=${slug}`);
  };

  // ── Все совпадения: категории-уточнения и фасеты ──
  const index = useSearchIndex(q);
  const tree = useMemo(() => categories
    .map(c => ({ ...c, subs: c.sub.map(x => ({ ...x, count: (index ?? []).filter(p => p.cat === x.slug).length })).filter(x => x.count > 0) }))
    .filter(c => c.subs.length > 0), [categories, index]);
  const flatSubs = tree.flatMap(c => c.subs);
  const subName = flatSubs.find(x => x.slug === sub)?.name ?? '';

  // Корень для фильтров по атрибутам: выбранной подкатегории, либо единственный у всех совпадений (как «Фасовка» в 5c).
  const root = sub ? tree.find(c => c.subs.some(x => x.slug === sub)) : tree.length === 1 ? tree[0] : undefined;
  const defs = root ? CAT_FILTERS[root.slug] || [] : [];
  const groups: FilterGroup[] = useMemo(() => {
    const scope = (index ?? []).filter(p => !sub || p.cat === sub);
    return defs.map(g => {
      const cnt: Record<string, number> = {};
      scope.forEach(p => attrValues(p, g.attr).forEach(v => { cnt[v] = (cnt[v] || 0) + 1; }));
      return { key: g.key, title: g.title, items: Object.entries(cnt) };
    });
  }, [index, sub, defs]);

  const applied = useDebounced(filters, FILTER_DEBOUNCE);
  const page = useSearchPages({
    q, category: root?.slug, sub: sub ?? undefined, sort: sort === 'popular' ? undefined : sort, ...filtersToQuery(applied, defs),
  }, !!q && !!index && index.length > 0);

  const chips = filterChips(filters, groups);
  const fCount = chips.length;
  const active = hasActiveFilters(filters);
  const resetAll = () => setFilters(EMPTY_FILTERS);
  /** Смена подкатегории: значения групп другого корня сбрасываем. */
  const pickSub = (slug: string | null) => {
    const nextRoot = slug ? tree.find(c => c.subs.some(x => x.slug === slug)) : undefined;
    if (nextRoot?.slug !== root?.slug) setFilters(f => ({ min: f.min, max: f.max, inStock: f.inStock, sale: f.sale }));
    setSub(slug);
  };

  const sentinel = useSentinel(page.loadMore);
  const loadingIndex = !!q && index === undefined;
  const nothing = !!q && index !== undefined && index.length === 0;
  const listLoading = !loadingIndex && !nothing && page.items === undefined;
  const filteredEmpty = !!page.items && page.items.length === 0;
  const countText = page.items ? itemsTitle(page.total) : '';

  const cards = (list: Product[]) => list.map(p => (
    <MartProductCard key={p.id} product={p} qty={lines[p.id] || 0} onQty={setCartQty} onOpen={x => openQuickView(x.id)} />
  ));
  const skeletons = (n: number) => Array.from({ length: n }, (_, i) => <SkeletonCard key={i} />);

  const list = (
    <>
      {(loadingIndex || listLoading) && <div className={s.cards} aria-busy="true">{skeletons(mobile ? 4 : 8)}<span className="visually-hidden">{SEARCH.loading}</span></div>}
      {page.items && page.items.length > 0 && <div className={s.cards}>{cards(page.items)}</div>}
      {page.hasMore && <div key={page.items?.length} ref={sentinel} className={s.cards} aria-hidden>{skeletons(mobile ? 2 : 4)}</div>}
      {page.items && !page.hasMore && page.total > (mobile ? 4 : 8) && <span className={s.end}>{SEARCH.end}</span>}
      {filteredEmpty && (
        <div className={s.emptyBox}>
          <b className={s.emptyTitle}>{SEARCH.filteredEmpty.title}</b>
          <span className={s.emptyText}>{SEARCH.filteredEmpty.text}</span>
          <MartButton label={SEARCH.filteredEmpty.reset} variant="secondary" size={44} onClick={() => { resetAll(); setSub(null); }} />
        </div>
      )}
      {nothing && <NothingFound q={q} onQuery={go} />}
    </>
  );

  // ─────────────── Mobile (5d; без запроса — экран поиска 5b) ───────────────
  if (mobile) {
    if (!q || editing) {
      return (
        <div className={s.mScreen}>
          <MartSearchScreen query={draft} onQuery={setDraft} suggest={suggest} recent={recent} onClearRecent={clearRecentSearches}
            autoFocus onBack={q ? () => { setDraft(q); setEditing(false); } : undefined} backHref="/"
            onPick={openProduct} onCategory={goCategory} onSubmit={go} />
        </div>
      );
    }
    const edit = () => { setDraft(q); setEditing(true); };
    return (
      <div className={site.page}>
        <div className={s.mTop}>
          <div className={s.mBar}>
            <button type="button" className={s.back} aria-label="Назад" onClick={edit}><Chevron size={9} color="var(--ink-1)" direction="left" /></button>
            <button type="button" className={s.mQuery} onClick={edit} aria-label={`Поиск: ${q}. Изменить запрос`}>{q}</button>
          </div>
          {!nothing && <>
            <div className={s.mChips}>
              <MartFiltersButton icon count={fCount} onClick={() => setSheet('filters')} />
              <MartChip label={SEARCH.allChip} selected={!sub} onClick={() => pickSub(null)} />
              {flatSubs.map(x => <MartChip key={x.slug} label={x.name} count={x.count} selected={sub === x.slug} onClick={() => pickSub(sub === x.slug ? null : x.slug)} />)}
            </div>
            <div className={s.mCountRow}>
              <span className={s.mCount}>{countText}</span>
              <button type="button" className={s.mSort} onClick={() => setSheet('sort')} aria-haspopup="dialog">
                {SEARCH_SORTS.find(x => x[0] === sort)?.[1]}<Chevron size={6} />
              </button>
            </div>
          </>}
        </div>
        <main className={s.mList}>{list}</main>
        <MartFiltersSheet open={sheet === 'filters'} onClose={() => setSheet(null)} value={filters} onChange={setFilters} groups={groups}
          resultCount={page.total} onReset={resetAll} />
        <MartSortSheet open={sheet === 'sort'} onClose={() => setSheet(null)} value={sort} onChange={setSort} sorts={SEARCH_SORTS} />
        <SiteTabBar active="catalog" />
      </div>
    );
  }

  // ─────────────── Desktop (5c) ───────────────
  return (
    <div className={site.page}>
      <SiteHeader categories={categories} query={q} mobile={false} />
      <div className={site.grid}>
        <div className={s.side}>
          {loadingIndex && <SideSkeleton />}
          {!loadingIndex && (!q || nothing) && <CategorySidebar categories={categories} />}
          {!loadingIndex && q && !nothing && <>
            <aside className={s.panel} aria-labelledby="search-cats">
              <b className={s.panelTitle} id="search-cats">{SEARCH.cats}</b>
              <div className={s.tree}>
                <button type="button" className={`${s.row} ${!sub ? s.rowOn : ''}`} aria-pressed={!sub} onClick={() => pickSub(null)}>
                  <span>{SEARCH.all}</span><span className={s.rowCount}>{index?.length}</span>
                </button>
                {tree.map(c => (
                  <div key={c.slug} role="group" aria-label={c.name} className={s.tree}>
                    <div className={s.groupHead}><Img src={c.img} w={24} h={24} className={s.groupImg} />{c.name}</div>
                    {c.subs.map(x => (
                      <button key={x.slug} type="button" className={`${s.row} ${s.subRow} ${sub === x.slug ? s.rowOn : ''}`} aria-pressed={sub === x.slug}
                        onClick={() => pickSub(sub === x.slug ? null : x.slug)}>
                        <span>{x.name}</span><span className={s.rowCount}>{x.count}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </aside>
            <MartFiltersPanel value={filters} onChange={setFilters} onReset={resetAll} groups={groups} resultCount={page.total} />
          </>}
        </div>

        <main className={s.main}>
          <nav className={s.crumbs} aria-label="Хлебные крошки"><Link href="/">Главная</Link><span>·</span><span className={s.current}>{SEARCH.crumb}</span></nav>
          <div className={s.titleRow}>
            <h1 className={s.h1}>{q ? SEARCH.title(q) : SEARCH.emptyQuery}</h1>
            {q && (countText ? <span className={s.count}>{countText}</span> : !nothing && <Skeleton w={90} h={16} r={6} />)}
            {nothing && <span className={s.count}>{itemsTitle(0)}</span>}
          </div>

          {!q && (
            <div className={s.idle}>
              <MartSearch query="" mode="mobile" recent={recent} onClearRecent={clearRecentSearches} onQuery={go} />
            </div>
          )}

          {q && !nothing && (
            <div className={s.toolbar}>
              <div className={s.chips}>
                {sub && <MartChip label={subName} selected removable onClick={() => pickSub(null)} />}
                {chips.map(c => <MartChip key={c.label} label={c.label} removable onClick={() => setFilters(c.remove())} />)}
              </div>
              <MartSort value={sort} onChange={setSort} sorts={SEARCH_SORTS} />
            </div>
          )}

          {q && list}
        </main>

        <div className={site.aside}><SiteMiniCart /></div>
      </div>
    </div>
  );
}

/** Ничего не нашли (MartSearch → empty): заголовок, подсказка и «Часто ищут». */
function NothingFound({ q, onQuery }: { q: string; onQuery: (q: string) => void }) {
  return (
    <div className={s.emptyBox} role="status">
      <b className={s.emptyTitle}>{EMPTY.search.title(q)}</b>
      <span className={s.emptyText}>{EMPTY.search.text}</span>
      <div className={s.popular}>{SEARCH_POPULAR.map(t => <MartChip key={t} label={t} onClick={() => onQuery(t)} />)}</div>
    </div>
  );
}

/** Скелетон карточки — 07 Каталог: 300 (mobile 290), r20, p8, фото 1:1 r14 + две строки, пульс 1.4 с. */
function SkeletonCard() {
  return (
    <div className={s.skelCard} aria-hidden>
      <span className={s.skelPhoto} />
      <span className={s.skelLine} style={{ width: '50%', height: 16 }} />
      <span className={s.skelLine} style={{ width: '80%', height: 14 }} />
    </div>
  );
}

/** Сайдбар «Нашли в категориях» во время загрузки. */
function SideSkeleton() {
  return (
    <div className={s.panel} aria-hidden>
      <Skeleton w="70%" h={20} r={6} />
      {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} h={40} r={12} />)}
    </div>
  );
}
