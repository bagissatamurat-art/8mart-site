import { HomeScreen } from '@/components/screens/HomeScreen';
import { getBanners, getCategories, getProducts, getStories } from '@/lib/api';
import { JsonLd } from '@/components/ui/JsonLd';
import type { Metadata } from 'next';
import { faqLd, organizationLd, storesLd, websiteLd } from '@/lib/seo';
import { SNAPSHOT_CITIES, SNAPSHOT_POINTS } from '@/lib/branches';
import { FAQ } from '@/lib/faq';

/** Полки главной — подкатегории основной категории (цветы): «Розы», «Гортензии», «Хризантемы». */
const MAIN_CATEGORY = 'tsvety';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function Home() {
  const [categories, stories, banners] = await Promise.all([getCategories(), getStories(), getBanners()]);
  const main = categories.find(c => c.slug === MAIN_CATEGORY);
  const shelves = await Promise.all((main?.sub ?? []).map(async sub => ({
    title: sub.name,
    href: `/catalog?cat=${MAIN_CATEGORY}&sub=${sub.slug}`,
    products: (await getProducts({ category: MAIN_CATEGORY, sub: sub.slug })).items.slice(0, 4),
  })));
  return (
    <>
      {/* FAQPage — только на главной: на каждой странице одна и та же разметка — дубль для поисковика. */}
      <JsonLd data={[organizationLd(), websiteLd(), faqLd(FAQ), ...storesLd(SNAPSHOT_POINTS, SNAPSHOT_CITIES)]} />
      <HomeScreen categories={categories} stories={stories} banner={banners[0]} shelves={shelves.filter(sh => sh.products.length)} />
    </>
  );
}
