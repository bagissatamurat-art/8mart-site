import { Suspense } from 'react';
import { PageSkeleton } from '@/components/site/PageSkeleton';
import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
import { getCategories } from '@/lib/api';
import { LoginRoute } from './LoginRoute';

export const metadata: Metadata = { title: 'Вход', robots: NOINDEX };

// /login?next=/somewhere — после входа возвращаем на next (только внутренние пути), без next — в кабинет.
export default async function LoginPage() {
  const categories = await getCategories();
  return <Suspense fallback={<PageSkeleton variant="auth" />}><LoginRoute categories={categories} /></Suspense>;
}
