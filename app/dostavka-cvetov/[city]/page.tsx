// Страница города: «Доставка цветов в Актобе» — магазины города, букеты, условия доставки и оплаты, разметка Florist.
// Город без филиалов или неизвестный — 404. Список городов — из GET /cities (только города с филиалами).
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CityScreen } from '@/components/screens/CityScreen';
import { JsonLd } from '@/components/ui/JsonLd';
import { getCategories, getCities, getPickupPoints, getProducts } from '@/lib/api';
import { DELIVERY } from '@/lib/config';
import { breadcrumbsLd, CITY_IN, cityPath, OG_BASE, OG_IMAGE, storesLd } from '@/lib/seo';

type Props = { params: Promise<{ city: string }> };

/** Только города из generateStaticParams — остальные адреса отвечают настоящим 404 (не «пустой страницей» со статусом 200). */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCities()).filter(c => CITY_IN[c.id]).map(c => ({ city: c.id }));
}

async function load(id: string) {
  const city = (await getCities()).find(c => c.id === id);
  if (!city || !CITY_IN[id]) notFound();
  const points = await getPickupPoints(id);
  if (!points.length) notFound();
  return { city, points };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, points } = await load((await params).city);
  const where = CITY_IN[city.id];
  const title = `Доставка цветов ${where} за ${DELIVERY.etaMin}–${DELIVERY.etaMax} минут`;
  const description = `Букеты из роз, гортензий и хризантем с доставкой ${where} за ${DELIVERY.etaMin}–${DELIVERY.etaMax} минут и самовывозом из ${points.length === 1 ? 'магазина' : `${points.length} магазинов`} 8mart: ${points.map(p => p.name).join('; ')}.`;
  return {
    title, description,
    alternates: { canonical: cityPath(city.id) },
    openGraph: { ...OG_BASE, title: `${title} — 8mart`, description, url: cityPath(city.id), images: [OG_IMAGE] },
  };
}

export default async function CityPage({ params }: Props) {
  const { city, points } = await load((await params).city);
  const [categories, cities, flowers] = await Promise.all([getCategories(), getCities(), getProducts({ category: 'tsvety' })]);
  const crumbs = [{ name: 'Главная', path: '/' }, { name: `Доставка цветов ${CITY_IN[city.id]}`, path: cityPath(city.id) }];
  return (
    <>
      <JsonLd data={[breadcrumbsLd(crumbs), ...storesLd(points, cities)]} />
      <CityScreen where={CITY_IN[city.id]} points={points} products={flowers.items.slice(0, 8)} categories={categories}
        others={cities.filter(c => c.id !== city.id && CITY_IN[c.id])} />
    </>
  );
}
