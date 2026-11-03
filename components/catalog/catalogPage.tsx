// Страница каталога — общая для /catalog, /catalog/<cat> и /catalog/<cat>/<sub>: метаданные, хлебные крошки, первая страница списка.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/site/PageSkeleton';
import { CatalogScreen, type CatalogStats } from '@/components/screens/CatalogScreen';
import { JsonLd } from '@/components/ui/JsonLd';
import { catalogLevel, parseCatalog } from '@/components/catalog/catalogUrl';
import { CATALOG } from '@/lib/copy';
import { getCategories, getProducts } from '@/lib/api';
import { breadcrumbsLd, catalogPath, CATEGORY_SEO, CITIES_IN, NOINDEX, OG_BASE, OG_IMAGE } from '@/lib/seo';
import type { Category } from '@/lib/types';

export type Raw = Record<string, string | string[] | undefined>;

const toSearch = (sp: Record<string, string | string[] | undefined>) => {
  const u = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => (Array.isArray(v) ? v : v != null ? [v] : []).forEach(x => u.append(k, x)));
  return u;
};
/** ?page=N (с 1) — страница списка для поисковика и прямых ссылок; в браузере дальше догружается прокруткой. */
const pageOf = (v: string | string[] | undefined) => Math.max(1, parseInt(String(Array.isArray(v) ? v[0] : v ?? '1'), 10) || 1);

const names = (cats: Category[], cat: string | null, sub: string | null) => {
  const c = cats.find(x => x.slug === cat);
  return { c, s: c?.sub.find(x => x.slug === sub) };
};


/** Раздел из пути /catalog/<cat>/<sub>: неизвестный — 404 (у страницы нет содержимого). */
export async function withPath(raw: Raw, cat: string, sub?: string): Promise<Raw> {
  const { c, s } = names(await getCategories(), cat, sub ?? null);
  if (!c || (sub && !s)) notFound();
  return { ...raw, cat, sub };
}

export async function catalogMetadata(raw: Raw): Promise<Metadata> {
  const url = parseCatalog(toSearch(raw), await getCategories());
  const { c, s } = names(await getCategories(), url.cat, url.sub);
  const sale = !url.cat && url.filters.sale;
  const unknown = (!!raw.cat && !c) || (!!raw.sub && !s);
  const seoName = CATEGORY_SEO[(s ?? c)?.slug ?? '']?.h1;
  const title = seoName ? (s ? seoName : `${seoName} — каталог`) : s ? `${s.name} — ${c!.name}` : c ? c.name : sale ? CATALOG.saleTitle : 'Каталог';
  const what = s?.name ?? c?.name ?? (sale ? 'товары со скидкой' : 'цветы и букеты');
  const description = `${what[0].toUpperCase() + what.slice(1)} в 8mart с доставкой за 30–70 минут и самовывозом ${CITIES_IN}. Цены, наличие, бонусы за покупки.`;
  // Страница списка ?page=N — своя каноническая ссылка (на ней другие товары), заголовок с номером.
  const page = pageOf(raw.page);
  const base = sale ? '/catalog?sale=1' : catalogPath(url.cat, url.sub);
  const canonical = page > 1 ? `${base}${base.includes('?') ? '&' : '?'}page=${page}` : base;
  const fullTitle = page > 1 ? `${title}, страница ${page}` : title;
  return {
    title: fullTitle, description,
    openGraph: { ...OG_BASE, title: `${fullTitle} — 8mart`, description, url: canonical, images: [c ? { url: c.img, alt: c.name } : OG_IMAGE] },
    // Неизвестный раздел (?cat=опечатка) показывает корень каталога — такой адрес не индексируем.
    ...(unknown ? { robots: NOINDEX } : {}),
    // Сортировка и фильтры — варианты одной страницы: каноническая ссылка без них.
    alternates: { canonical },
  };
}

export async function renderCatalog(raw: Raw) {
  const sp = toSearch(raw);
  const categories = await getCategories();
  // Счётчики плиток и обложки подкатегорий (первое фото раздела) — по корневым и подкатегориям.
  const keys = categories.flatMap(c => [{ slug: c.slug, q: { category: c.slug } }, ...c.sub.map(x => ({ slug: x.slug, q: { category: c.slug, sub: x.slug } }))]);
  const res = await Promise.all(keys.map(x => getProducts(x.q)));
  const stats: CatalogStats = Object.fromEntries(keys.map((x, i) => [x.slug, { count: res[i].total, img: res[i].items.find(p => p.img)?.img }]));

  // Первая страница списка рендерится на сервере (поисковики видят товары). Группы фильтров — только на клиенте.
  const url = parseCatalog(sp, categories);
  const groups = Object.entries(url.filters).some(([k, v]) => Array.isArray(v) && v.length && k !== 'min' && k !== 'max');
  const initial = catalogLevel(url) === 'list' && !groups
    ? await getProducts({ category: url.cat ?? undefined, sub: url.sub ?? undefined, sort: url.sort, sale: url.filters.sale || undefined,
        min: +String(url.filters.min) || undefined, max: +String(url.filters.max) || undefined, page: pageOf(sp.get('page') ?? undefined) })
        .then(r => ({ ...r, page: pageOf(sp.get('page') ?? undefined) }))
    : null;

  const { c, s } = names(categories, url.cat, url.sub);
  const crumbs = [{ name: 'Главная', path: '/' }, { name: 'Каталог', path: '/catalog' },
    ...(c ? [{ name: c.name, path: catalogPath(c.slug) }] : []), ...(s ? [{ name: s.name, path: catalogPath(c!.slug, s.slug) }] : [])];
  return (
    <>
      <JsonLd data={[breadcrumbsLd(crumbs)]} />
      {/* useSearchParams в экране — граница Suspense обязательна. */}
      <Suspense fallback={<PageSkeleton variant="grid" />}><CatalogScreen categories={categories} stats={stats} initial={initial} /></Suspense>
    </>
  );
}
