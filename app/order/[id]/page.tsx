import type { Metadata } from 'next';
import { OrderScreen } from '@/components/screens/OrderScreen';
import { getCategories, getOrders } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

// Демо-заказы собираются заранее; остальные id рендерятся по запросу.
export async function generateStaticParams() {
  return (await getOrders()).map(o => ({ id: o.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return { title: `Заказ №${(await params).id}`, robots: { index: false } };
}

// Заказ читается на клиенте: в моке созданные заказы живут в localStorage браузера.
export default async function OrderPage({ params }: Params) {
  const [{ id }, categories] = await Promise.all([params, getCategories()]);
  return <OrderScreen id={id} categories={categories} />;
}
