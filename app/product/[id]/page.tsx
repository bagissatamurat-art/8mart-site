import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductScreen } from '@/components/screens/ProductScreen';
import { ApiError, getAllProductIds, getCategories, getGroup, getProduct } from '@/lib/api';

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
  return { title: `${product.name} — 8mart`, description: product.description.split('\n')[0] };
}

export default async function ProductPage({ params }: Params) {
  const product = await load((await params).id);
  const [group, categories] = await Promise.all([product.group ? getGroup(product.group) : Promise.resolve([]), getCategories()]);
  return <ProductScreen product={product} group={group} categories={categories} />;
}
