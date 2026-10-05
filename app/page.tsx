import { HomeScreen } from '@/components/screens/HomeScreen';
import { getBanners, getCategories, getProducts, getStories } from '@/lib/api';
import { JsonLd } from '@/components/ui/JsonLd';
import { organizationLd, websiteLd } from '@/lib/seo';

export default async function Home() {
  const [categories, stories, banners, sale, flowers] = await Promise.all([
    getCategories(), getStories(), getBanners(), getProducts({ sale: true }), getProducts({ category: 'tsvety' }),
  ]);
  return (
    <>
      <JsonLd data={[organizationLd(), websiteLd()]} />
      <HomeScreen categories={categories} stories={stories} banner={banners[0]} deals={sale.items.slice(0, 4)} flowers={flowers.items.slice(0, 4)} />
    </>
  );
}
