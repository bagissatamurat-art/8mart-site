import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogScreen, type CatalogStats } from '@/components/screens/CatalogScreen';
import { getCategories, getProducts } from '@/lib/api';

export const metadata: Metadata = { title: 'Каталог — 8mart' };

export default async function CatalogPage() {
  const categories = await getCategories();
  // Счётчики плиток и обложки подкатегорий (первое фото раздела) — по корневым и подкатегориям.
  const keys = categories.flatMap(c => [{ slug: c.slug, q: { category: c.slug } }, ...c.sub.map(x => ({ slug: x.slug, q: { category: c.slug, sub: x.slug } }))]);
  const res = await Promise.all(keys.map(x => getProducts(x.q)));
  const stats: CatalogStats = Object.fromEntries(keys.map((x, i) => [x.slug, { count: res[i].total, img: res[i].items.find(p => p.img)?.img }]));
  // useSearchParams в экране — граница Suspense обязательна.
  return <Suspense><CatalogScreen categories={categories} stats={stats} /></Suspense>;
}
