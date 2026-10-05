import type { Metadata } from 'next';
import { CheckoutScreen } from '@/components/screens/CheckoutScreen';
import { getCategories } from '@/lib/api';

export const metadata: Metadata = { title: 'Оформление — 8mart', robots: { index: false } };

export default async function CheckoutPage() {
  return <CheckoutScreen categories={await getCategories()} />;
}
