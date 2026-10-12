import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
import { CartScreen } from '@/components/screens/CartScreen';
import { getCategories } from '@/lib/api';

export const metadata: Metadata = { title: 'Корзина', robots: NOINDEX };

export default async function CartPage() {
  return <CartScreen categories={await getCategories()} />;
}
