import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
import { CheckoutScreen } from '@/components/screens/CheckoutScreen';
import { getCategories } from '@/lib/api';

export const metadata: Metadata = { title: 'Оформление', robots: NOINDEX };

export default async function CheckoutPage() {
  return <CheckoutScreen categories={await getCategories()} />;
}
