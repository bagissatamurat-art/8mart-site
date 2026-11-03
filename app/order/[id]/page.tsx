import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
import { OrderScreen } from '@/components/screens/OrderScreen';
import { getCategories, getOrders } from '@/lib/api';
import { isMocked } from '@/lib/http';

type Params = { params: Promise<{ id: string }> };

// Демо-заказы мока собираются заранее; остальные id рендерятся по запросу.
// С настоящим API заказы личные (нужен вход) — при сборке их не перечисляем.
export async function generateStaticParams() {
  return isMocked('getOrders') ? (await getOrders()).map(o => ({ id: o.id })) : [];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return { title: `Заказ №${(await params).id}`, robots: NOINDEX };
}

// Заказ читается на клиенте: в моке созданные заказы живут в localStorage браузера.
export default async function OrderPage({ params }: Params) {
  const [{ id }, categories] = await Promise.all([params, getCategories()]);
  return <OrderScreen id={id} categories={categories} />;
}
