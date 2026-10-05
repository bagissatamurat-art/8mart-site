import type { MetadataRoute } from 'next';
import { getAllProductIds, getCategories } from '@/lib/api';
import { abs as absUrl, catalogPath } from '@/lib/seo';

// В XML амперсанд в адресе экранируется (Next сам этого не делает).
const abs = (path: string) => absUrl(path).replace(/&/g, '&amp;');

// Главная, каталог (категории и подкатегории), страницы товаров.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, ids] = await Promise.all([getCategories(), getAllProductIds()]);
  const now = new Date();
  return [
    { url: abs('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: abs('/catalog'), lastModified: now, changeFrequency: 'daily', priority: .9 },
    { url: abs('/catalog?sale=1'), lastModified: now, changeFrequency: 'daily', priority: .8 },
    ...categories.flatMap(c => [
      { url: abs(catalogPath(c.slug)), lastModified: now, changeFrequency: 'daily' as const, priority: .8 },
      ...c.sub.map(s => ({ url: abs(catalogPath(c.slug, s.slug)), lastModified: now, changeFrequency: 'daily' as const, priority: .7 })),
    ]),
    ...ids.map(id => ({ url: abs(`/product/${id}`), lastModified: now, changeFrequency: 'weekly' as const, priority: .6 })),
  ];
}
