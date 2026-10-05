import type { Metadata } from 'next';
import { CartScreen } from '@/components/screens/CartScreen';
import { getCategories } from '@/lib/api';

export const metadata: Metadata = { title: 'Корзина', robots: { index: false } };

export default async function CartPage() {
  return <CartScreen categories={await getCategories()} />;
}
