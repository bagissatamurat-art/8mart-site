// Адрес каталога ⇄ состояние экрана (07 Каталог). Одно место кодирования параметров.
//
//   /catalog                              — корень: плитки категорий
//   /catalog?cat=<корень>                 — категория: плитки подкатегорий + «Все товары»
//   /catalog?cat=<корень>&all=1           — список «Все товары» категории
//   /catalog?cat=<корень>&sub=<подкат.>   — список подкатегории
//   /catalog?sale=1                       — список всех товаров со скидкой («Выгодная полка» с главной)
// Параметры списка: sort=<SortId> (popular не пишем), min, max (тг, цифры), sale=1,
// фильтры групп CAT_FILTERS — повторяющимся ключом группы: ?packs=25 кг&packs=50 кг, ?colors=Белый.
// Любой фильтр или сортировка при одной cat тоже открывают список.
import { CAT_FILTERS, SORTS } from '@/lib/config';
import type { FiltersValue } from '@/components/MartFilters';
import type { Category, SortId } from '@/lib/types';

export type CatalogLevel = 'root' | 'cat' | 'list';

export interface CatalogState {
  /** Корневая категория (slug) или null. */
  cat: string | null;
  sub: string | null;
  /** «Все товары» категории. */
  all: boolean;
  sort: SortId;
  /** Цена, переключатель «Со скидкой» и группы CAT_FILTERS по ключу группы. */
  filters: FiltersValue;
}

const digits = (x: string | null) => (x || '').replace(/\D/g, '');

/** Пустое значение фильтров для категории — с ключами всех групп (так работает resetFilters). */
export function emptyFilters(cat: string | null): FiltersValue {
  const v: FiltersValue = { min: '', max: '', sale: false };
  (cat ? CAT_FILTERS[cat] || [] : []).forEach(g => { v[g.key] = []; });
  return v;
}

export function parseCatalog(sp: URLSearchParams, categories: Category[]): CatalogState {
  const root = categories.find(c => c.slug === sp.get('cat')) || null;
  const sub = root?.sub.find(s => s.slug === sp.get('sub'))?.slug ?? null;
  const sortRaw = sp.get('sort');
  const sort = (SORTS.find(x => x[0] === sortRaw)?.[0] ?? 'popular') as SortId;
  const filters = emptyFilters(root?.slug ?? null);
  filters.min = digits(sp.get('min'));
  filters.max = digits(sp.get('max'));
  filters.sale = sp.get('sale') === '1';
  (root ? CAT_FILTERS[root.slug] || [] : []).forEach(g => { filters[g.key] = sp.getAll(g.key).filter(Boolean); });
  return { cat: root?.slug ?? null, sub, all: sp.get('all') === '1', sort, filters };
}

/** Есть ли в значении выбранные фильтры (цена, скидка, группы). */
export function anyFilter(v: FiltersValue): boolean {
  return Object.values(v).some(x => (Array.isArray(x) ? x.length > 0 : !!x));
}

export function catalogLevel(st: CatalogState): CatalogLevel {
  if (!st.cat) return st.filters.sale ? 'list' : 'root';
  return st.sub || st.all || st.sort !== 'popular' || anyFilter(st.filters) ? 'list' : 'cat';
}

export function catalogHref(st: Partial<CatalogState>): string {
  const p = new URLSearchParams();
  if (st.cat) p.set('cat', st.cat);
  if (st.cat && st.sub) p.set('sub', st.sub);
  else if (st.cat && st.all) p.set('all', '1');
  if (st.sort && st.sort !== 'popular') p.set('sort', st.sort);
  const f = st.filters || {};
  if (f.min) p.set('min', String(f.min));
  if (f.max) p.set('max', String(f.max));
  if (f.sale) p.set('sale', '1');
  (st.cat ? CAT_FILTERS[st.cat] || [] : []).forEach(g => {
    const vals = f[g.key];
    if (Array.isArray(vals)) vals.forEach(v => p.append(g.key, v));
  });
  const q = p.toString();
  return q ? `/catalog?${q}` : '/catalog';
}
