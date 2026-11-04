import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductScreen } from '@/components/screens/ProductScreen';
import { ApiError, getAllProductIds, getCategories, getGroup, getProduct, getProductReviews } from '@/lib/api';
import { FEATURES } from '@/lib/config';
import { JsonLd } from '@/components/ui/JsonLd';
import { money } from '@/lib/domain';
import { breadcrumbsLd, catalogPath, OG_BASE, productLd, CITIES_IN } from '@/lib/seo';

export type Params = { params: Promise<{ id: string }> };

// Общее для app/product/[id] (desktop) и app/product/[id]/m (телефон, через proxy.ts).

// Страницы товаров собираются заранее (нужно для статического хостинга); новые id рендерятся по запросу.
export async function productParams() {
  return (await getAllProductIds()).map(id => ({ id }));
}

async function load(id: string) {
  try { return await getProduct(id); } catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
}

export async function productMetadata({ params }: Params): Promise<Metadata> {
  const product = await load((await params).id);
  const price = product.price != null ? `${product.variants ? 'от ' : ''}${money(product.price)}` : '';
  const description = [price, `доставка за 30–70 минут и самовывоз ${CITIES_IN}`, product.description.split('\n')[0]].filter(Boolean).join('. ').slice(0, 300);
  const image = product.images[0] ?? product.img;
  return {
    // «Розы Мандала — купить с доставкой — 8mart» (шаблон добавляет «— 8mart»); города — в описании и на страницах городов.
    title: `${product.name} — купить с доставкой`, description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: { ...OG_BASE, title: product.name, description, url: `/product/${product.id}`, ...(image ? { images: [{ url: image, alt: product.name }] } : {}) },
  };
}

/** Страница товара; mobile — вёрстка с сервера для телефона (app/product/[id]/m через proxy.ts).
 *  Отзывы: первая страница — в серверном HTML и в разметке Product (только опубликованные и только если они есть).
 *  Не загрузились — страница всё равно отдаётся, блок догрузит их в браузере. */
export async function renderProduct(id: string, mobile: boolean) {
  const product = await load(id);
  const rated = FEATURES.reviews && !!product.rating?.count;
  const [group, categories, reviews] = await Promise.all([
    product.group ? getGroup(product.group) : Promise.resolve([]), getCategories(),
    rated ? getProductReviews(product.id).catch(() => undefined) : Promise.resolve(undefined),
  ]);
  const cat = categories.find(c => c.sub.some(s => s.slug === product.cat));
  const sub = cat?.sub.find(s => s.slug === product.cat);
  const crumbs = [{ name: 'Главная', path: '/' }, { name: 'Каталог', path: '/catalog' },
    ...(cat ? [{ name: cat.name, path: catalogPath(cat.slug) }] : []), ...(cat && sub ? [{ name: sub.name, path: catalogPath(cat.slug, sub.slug) }] : []),
    { name: product.name, path: `/product/${product.id}` }];
  return (
    <>
      <JsonLd data={[productLd(product, cat, reviews?.items), breadcrumbsLd(crumbs)]} />
      <ProductScreen product={product} group={group} categories={categories} reviews={reviews} initialMobile={mobile} />
    </>
  );
}
