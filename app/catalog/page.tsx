import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogScreen, type CatalogStats } from '@/components/screens/CatalogScreen';
import { JsonLd } from '@/components/ui/JsonLd';
import { catalogLevel, parseCatalog } from '@/components/catalog/catalogUrl';
import { CATALOG } from '@/lib/copy';
import { getCategories, getProducts } from '@/lib/api';
import { breadcrumbsLd, catalogPath, faqLd } from '@/lib/seo';
import { FAQ } from '@/lib/faq';
import type { Category } from '@/lib/types';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const toSearch = (sp: Record<string, string | string[] | undefined>) => {
  const u = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => (Array.isArray(v) ? v : v != null ? [v] : []).forEach(x => u.append(k, x)));
  return u;
};
const names = (cats: Category[], cat: string | null, sub: string | null) => {
  const c = cats.find(x => x.slug === cat);
  return { c, s: c?.sub.find(x => x.slug === sub) };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const url = parseCatalog(toSearch(await searchParams), await getCategories());
  const { c, s } = names(await getCategories(), url.cat, url.sub);
  const sale = !url.cat && url.filters.sale;
  const title = s ? `${s.name} — ${c!.name}` : c ? c.name : sale ? CATALOG.saleTitle : 'Каталог';
  const what = s?.name ?? c?.name ?? (sale ? 'товары со скидкой' : 'цветы и букеты, а также стройматериалы и товары для дома');
  const description = `${what[0].toUpperCase() + what.slice(1)} в 8mart с доставкой по Астане за 60–90 минут и самовывозом. Цены, наличие, бонусы за покупки.`;
  const canonical = sale ? '/catalog?sale=1' : catalogPath(url.cat, url.sub);
  return {
    title, description,
    openGraph: { type: 'website', title: `${title} — 8mart`, description, url: canonical, ...(c ? { images: [{ url: c.img, alt: c.name }] } : {}) },
    // Сортировка и фильтры — варианты одной страницы: каноническая ссылка без них.
    alternates: { canonical },
  };
}

export default async function CatalogPage({ searchParams }: Props) {
  const sp = toSearch(await searchParams);
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
        min: +String(url.filters.min) || undefined, max: +String(url.filters.max) || undefined })
    : null;

  const { c, s } = names(categories, url.cat, url.sub);
  const crumbs = [{ name: 'Главная', path: '/' }, { name: 'Каталог', path: '/catalog' },
    ...(c ? [{ name: c.name, path: catalogPath(c.slug) }] : []), ...(s ? [{ name: s.name, path: catalogPath(c!.slug, s.slug) }] : [])];
  return (
    <>
      <JsonLd data={[breadcrumbsLd(crumbs), faqLd(FAQ)]} />
      {/* useSearchParams в экране — граница Suspense обязательна. */}
      <Suspense><CatalogScreen categories={categories} stats={stats} initial={initial} /></Suspense>
    </>
  );
}
