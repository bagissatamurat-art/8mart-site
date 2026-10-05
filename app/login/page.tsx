import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getCategories } from '@/lib/api';
import { LoginRoute } from './LoginRoute';

export const metadata: Metadata = { title: 'Вход', robots: { index: false } };

// /login?next=/somewhere — после входа возвращаем на next (только внутренние пути), без next — в кабинет.
export default async function LoginPage() {
  const categories = await getCategories();
  return <Suspense><LoginRoute categories={categories} /></Suspense>;
}
