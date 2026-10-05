import type { Metadata } from 'next';
import { OrderScreen } from '@/components/screens/OrderScreen';
import { getCategories } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return { title: `Заказ №${(await params).id} — 8mart`, robots: { index: false } };
}

// Заказ читается на клиенте: в моке созданные заказы живут в localStorage браузера.
export default async function OrderPage({ params }: Params) {
  const [{ id }, categories] = await Promise.all([params, getCategories()]);
  return <OrderScreen id={id} categories={categories} />;
}
