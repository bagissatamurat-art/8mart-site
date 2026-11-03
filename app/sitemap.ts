import type { MetadataRoute } from 'next';
import { getAllProductIds, getCategories, getCities } from '@/lib/api';
import { abs as absUrl, catalogPath, CITY_IN, cityPath } from '@/lib/seo';

// В XML амперсанд в адресе экранируется (Next сам этого не делает).
const abs = (path: string) => absUrl(path).replace(/&/g, '&amp;');

// Главная, страницы городов, каталог (категории и подкатегории), страницы товаров. lastModified нет: в API нет даты изменения,
// а дата сборки на каждой записи учит поисковик игнорировать поле. Появится updatedAt — добавить.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, ids, cities] = await Promise.all([getCategories(), getAllProductIds(), getCities()]);
  return [
    { url: abs('/'), changeFrequency: 'daily', priority: 1 },
    { url: abs('/catalog'), changeFrequency: 'daily', priority: .9 },
    ...cities.filter(c => CITY_IN[c.id]).map(c => ({ url: abs(cityPath(c.id)), changeFrequency: 'weekly' as const, priority: .9 })),
    ...categories.flatMap(c => [
      { url: abs(catalogPath(c.slug)), changeFrequency: 'daily' as const, priority: .8 },
      ...c.sub.map(s => ({ url: abs(catalogPath(c.slug, s.slug)), changeFrequency: 'daily' as const, priority: .7 })),
    ]),
    ...ids.map(id => ({ url: abs(`/product/${id}`), changeFrequency: 'weekly' as const, priority: .6 })),
  ];
}
