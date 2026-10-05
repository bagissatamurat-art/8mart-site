'use client';
// MartSearch — COMPONENTS.md → MartSearch; референс site/MartSearch.dc.html и экран site/05 Поиск.dc.html.
// Подсказки: пусто — недавние + популярные (чипы); ввод — категории и товары (строка 60), «Все результаты · N»; ничего не нашли.
// Desktop — выпадающая панель под полем шапки (MartHeader → searchPanel); mobile — отдельный экран (MartSearchScreen).
// Данные подсказок приходят пропсом `suggest` (форма GET /search/suggest, lib/api.ts → searchSuggest).
import Link from 'next/link';
import { forwardRef, useEffect, useState } from 'react';
import { money } from '@/lib/domain/format';
import type { Product } from '@/lib/types';
import { MartChip } from './MartChip';
import { Chevron, Cross } from './ui/Cross';
import { Spinner } from './ui/Spinner';
import s from './MartSearch.module.css';
import { EMPTY } from '@/lib/copy';

/** Ответ GET /search/suggest?q */
export interface SearchSuggest {
  categories: { slug: string; name: string; parent: string; count: number }[];
  products: Product[];
  total: number;
}

/** «Часто ищут» — значения из референса (MartSearch.dc.html). TODO: перенести в lib/config.ts / API. */
export const SEARCH_POPULAR = ['Цемент', 'Кирпич', 'Краска', 'Плитка', 'Розы', 'Гортензии'];

// ─────────────────────────── Поле поиска ───────────────────────────

export interface SearchFieldProps {
  value: string;
  onChange: (q: string) => void;
  /** 56 — шапка desktop, 48 — шапка mobile и экран поиска mobile. */
  size?: 56 | 48;
  /** Лупа слева (в шапке есть, на экране поиска mobile нет). */
  icon?: boolean;
  /** Кнопка очистки ×, когда поле заполнено. */
  clearable?: boolean;
  /** Принудительный фокус-стиль (витрина): розовый бордер + кольцо. */
  focused?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Enter. */
  onSubmit?: (q: string) => void;
  /** Esc в поле. */
  onEscape?: () => void;
  /** id панели подсказок (aria-controls). */
  controls?: string;
  expanded?: boolean;
  className?: string;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField({
  value, onChange, size = 56, icon = true, clearable = true, focused, autoFocus, placeholder = 'Искать в 8mart',
  onFocus, onBlur, onSubmit, onEscape, controls, expanded, className,
}, ref) {
  return (
    <form role="search" className={[s.field, size === 56 ? s.f56 : s.f48, focused && s.fieldFocused, className].filter(Boolean).join(' ')}
      onSubmit={e => { e.preventDefault(); const q = value.trim(); if (q) onSubmit?.(q); }}>
      {icon && <span className={s.loupe} aria-hidden><span /><span /></span>}
      <input ref={ref} type="search" enterKeyHint="search" className={s.input} value={value} placeholder={placeholder} autoFocus={autoFocus}
        aria-label="Поиск по 8mart" aria-controls={controls} aria-expanded={expanded} autoComplete="off"
        onChange={e => onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}
        onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); onEscape?.(); } }} />
      {clearable && value.length > 0 && (
        <button type="button" className={s.clear} aria-label="Очистить" onMouseDown={e => e.preventDefault()} onClick={() => onChange('')}>
          <Cross size={12} color="var(--ink-2)" />
        </button>
      )}
    </form>
  );
});

// ─────────────────────────── Подсказки ───────────────────────────

export interface MartSearchProps {
  query: string;
  mode?: 'desktop' | 'mobile';
  /** Ответ searchSuggest(query). undefined при непустом запросе — загрузка. */
  suggest?: SearchSuggest;
  /** «Вы искали». По умолчанию пусто (в проде — localStorage / API). */
  recent?: string[];
  /** «Часто ищут». */
  popular?: string[];
  id?: string;
  onQuery?: (q: string) => void;
  onPick?: (product: Product) => void;
  onCategory?: (slug: string) => void;
  /** «Все результаты · N» → /search?q= */
  onSubmit?: (q: string) => void;
  onClearRecent?: () => void;
}

/** Сколько товаров в подсказках: desktop 5, mobile 6; категорий — до 2 (референс). */
const LIMIT = { desktop: 5, mobile: 6 } as const;
const CATS_LIMIT = 2;
const NONE: string[] = [];

export function MartSearch({
  query, mode = 'desktop', suggest, recent: recentProp = NONE, popular = SEARCH_POPULAR, id,
  onQuery, onPick, onCategory, onSubmit, onClearRecent,
}: MartSearchProps) {
  const [recent, setRecent] = useState(recentProp);
  const recentKey = recentProp.join('\n');
  // Синхронизация с пропсом — по содержимому, а не по ссылке (иначе массив-литерал зациклит эффект).
  useEffect(() => setRecent(recentProp), [recentKey]);
  const mobile = mode === 'mobile';
  const q = query.trim();
  const ql = q.toLowerCase();

  const idle = !ql;
  const loading = !idle && !suggest;
  const cats = suggest?.categories.slice(0, CATS_LIMIT) ?? [];
  const items = suggest?.products.slice(0, LIMIT[mode]) ?? [];
  const hasResults = !idle && !!suggest && (suggest.products.length > 0 || suggest.categories.length > 0);
  const empty = !idle && !!suggest && !hasResults;

  const chips = (center?: boolean) => (
    <div className={`${s.chips} ${center ? s.chipsCenter : ''}`}>
      {popular.map(t => <MartChip key={t} label={t} onClick={() => onQuery?.(t)} />)}
    </div>
  );

  return (
    <div id={id} className={`${s.panel} ${mobile ? s.mobile : s.desktop}`} role="region" aria-label="Подсказки поиска" aria-live="polite">
      {idle && <>
        {recent.length > 0 && (
          <div className={s.group}>
            <div className={s.groupHead}>
              <span className={s.caps}>Вы искали</span>
              <button type="button" className={s.clearRecent} onClick={() => { setRecent([]); onClearRecent?.(); }}>Очистить</button>
            </div>
            {recent.map(t => (
              <button key={t} type="button" className={s.row44} onClick={() => onQuery?.(t)}>
                <span className={s.clock} aria-hidden><span /><span /></span>{t}
              </button>
            ))}
          </div>
        )}
        <div className={s.group}>
          <span className={`${s.caps} ${s.capsPad}`}>Часто ищут</span>
          {chips()}
        </div>
      </>}

      {loading && <div className={s.loading}><Spinner size={20} /><span className="visually-hidden">Ищем…</span></div>}

      {hasResults && suggest && <>
        {cats.length > 0 && <>
          <div className={s.list}>
            {cats.map(c => (
              <button key={c.slug} type="button" className={`${s.row44} ${s.catRow}`} onClick={() => onCategory?.(c.slug)}>
                <span className={s.catName}>
                  <span className={s.grid} aria-hidden><span /><span /><span /><span /></span>
                  <span>{c.name}<span className={s.muted}> · {c.parent}</span></span>
                </span>
                <span className={s.count}>{c.count}</span>
              </button>
            ))}
          </div>
          <div className={s.divider} />
        </>}
        <div className={s.list}>
          {items.map(p => <ProductRow key={p.id} product={p} query={q} onPick={onPick} />)}
        </div>
        <button type="button" className={s.showAll} onClick={() => onSubmit?.(q)}>
          Все результаты · {suggest.total}<Chevron size={7} color="currentColor" direction="right" />
        </button>
      </>}

      {empty && (
        <div className={s.empty}>
          <b className={s.emptyTitle}>{EMPTY.search.title(q)}</b>
          <span className={s.emptyText}>{EMPTY.search.text}</span>
          {chips(true)}
        </div>
      )}
    </div>
  );
}

/** Строка товара 60: фото 44 r10, название с жирным совпадением, вес, цена справа. */
function ProductRow({ product: p, query, onPick }: { product: Product; query: string; onPick?: (p: Product) => void }) {
  const i = p.name.toLowerCase().indexOf(query.toLowerCase());
  const name = i < 0 || !query
    ? p.name
    : <>{p.name.slice(0, i)}<b className={s.hit}>{p.name.slice(i, i + query.length)}</b>{p.name.slice(i + query.length)}</>;
  return (
    <button type="button" className={s.productRow} onClick={() => onPick?.(p)}>
      {p.img ? <img src={p.img} alt="" className={s.thumb} /> : <span className={s.thumb} />}
      <span className={s.productText}>
        <span className={s.productName}>{name}</span>
        <span className={s.weight}>{p.weight}</span>
      </span>
      <span className={s.price}>{money(p.price)}</span>
    </button>
  );
}

// ─────────────────────────── Экран поиска (mobile) ───────────────────────────

export interface MartSearchScreenProps extends Omit<MartSearchProps, 'mode' | 'onQuery'> {
  onQuery?: (q: string) => void;
  /** Куда ведёт «Назад» (по умолчанию — главная). */
  backHref?: string;
  onBack?: () => void;
  autoFocus?: boolean;
}

/** Mobile: отдельный экран — «назад» 40 + поле 48 в фокусе + список подсказок. */
export function MartSearchScreen({ query: queryProp, onQuery, backHref = '/', onBack, autoFocus, onSubmit, ...rest }: MartSearchScreenProps) {
  const [q, setQ] = useState(queryProp);
  useEffect(() => setQ(queryProp), [queryProp]);
  const set = (v: string) => { setQ(v); onQuery?.(v); };
  const back = <span className={s.backIcon}><Chevron size={9} color="var(--ink-1)" direction="left" /></span>;
  return (
    <div className={s.screen}>
      <div className={s.screenBar}>
        {onBack
          ? <button type="button" className={s.back} aria-label="Назад" onClick={onBack}>{back}</button>
          : <Link href={backHref} className={s.back} aria-label="Назад">{back}</Link>}
        <SearchField value={q} onChange={set} size={48} icon={false} focused autoFocus={autoFocus} onSubmit={onSubmit} onEscape={onBack} className={s.screenField} />
      </div>
      <div className={s.screenBody}>
        <MartSearch {...rest} query={q} mode="mobile" onQuery={set} onSubmit={onSubmit} />
      </div>
    </div>
  );
}
