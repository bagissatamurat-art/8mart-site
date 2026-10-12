import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
import { AccountScreen } from '@/components/screens/AccountScreen';
import { getCategories } from '@/lib/api';

export const metadata: Metadata = { title: 'Личный кабинет', robots: NOINDEX };

// Вход хранится в браузере (localStorage), поэтому гость/кабинет решается на клиенте.
export default async function AccountPage() {
  return <AccountScreen categories={await getCategories()} />;
}
