import type { Metadata } from 'next';
import { AccountScreen } from '@/components/screens/AccountScreen';
import { getCategories } from '@/lib/api';

export const metadata: Metadata = { title: 'Личный кабинет — 8mart', robots: { index: false } };

// Вход хранится в браузере (localStorage), поэтому гость/кабинет решается на клиенте.
export default async function AccountPage() {
  return <AccountScreen categories={await getCategories()} />;
}
