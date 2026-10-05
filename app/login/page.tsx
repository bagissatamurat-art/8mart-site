import type { Metadata } from 'next';
import { LoginScreen } from '@/components/screens/LoginScreen';
import { getCategories } from '@/lib/api';

export const metadata: Metadata = { title: 'Вход — 8mart', robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string | string[] }> };

// /login?next=/somewhere — после входа возвращаем на next (только внутренние пути), без next — в кабинет.
export default async function LoginPage({ searchParams }: Props) {
  const [{ next }, categories] = await Promise.all([searchParams, getCategories()]);
  return <LoginScreen categories={categories} next={(Array.isArray(next) ? next[0] : next) || '/account'} />;
}
