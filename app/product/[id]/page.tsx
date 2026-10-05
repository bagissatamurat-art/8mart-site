import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductScreen } from '@/components/screens/ProductScreen';
import { ApiError, getAllProductIds, getCategories, getGroup, getProduct } from '@/lib/api';
import { JsonLd } from '@/components/ui/JsonLd';
import { money } from '@/lib/domain';
import { breadcrumbsLd, catalogPath, productLd } from '@/lib/seo';

type Params = { params: Promise<{ id: string }> };

// Страницы товаров собираются заранее (нужно для статического хостинга); новые id рендерятся по запросу.
export async function generateStaticParams() {
  return (await getAllProductIds()).map(id => ({ id }));
}

async function load(id: string) {
  try { return await getProduct(id); } catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await load((await params).id);
  const price = product.price != null ? `${product.variants ? 'от ' : ''}${money(product.price)}` : '';
  const description = [price, product.description.split('\n')[0]].filter(Boolean).join(' — ').slice(0, 300);
  const image = product.images[0] ?? product.img;
  return {
    title: product.name, description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: { type: 'website', title: product.name, description, url: `/product/${product.id}`, ...(image ? { images: [{ url: image, alt: product.name }] } : {}) },
  };
}

export default async function ProductPage({ params }: Params) {
  const product = await load((await params).id);
  const [group, categories] = await Promise.all([product.group ? getGroup(product.group) : Promise.resolve([]), getCategories()]);
  const cat = categories.find(c => c.sub.some(s => s.slug === product.cat));
  const sub = cat?.sub.find(s => s.slug === product.cat);
  const crumbs = [{ name: 'Главная', path: '/' }, { name: 'Каталог', path: '/catalog' },
    ...(cat ? [{ name: cat.name, path: catalogPath(cat.slug) }] : []), ...(cat && sub ? [{ name: sub.name, path: catalogPath(cat.slug, sub.slug) }] : []),
    { name: product.name, path: `/product/${product.id}` }];
  return (
    <>
      <JsonLd data={[productLd(product, cat), breadcrumbsLd(crumbs)]} />
      <ProductScreen product={product} group={group} categories={categories} />
    </>
  );
}
