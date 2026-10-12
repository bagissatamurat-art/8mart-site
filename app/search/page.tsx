import { Suspense } from 'react';
import { PageSkeleton } from '@/components/site/PageSkeleton';
import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
import { getCategories } from '@/lib/api';
import { SearchRoute } from './SearchRoute';

export const metadata: Metadata = { title: 'Поиск', robots: NOINDEX };

// Поиск — 05 Поиск.dc.html (5c / 5d).
export default async function SearchPage() {
  const categories = await getCategories();
  return <Suspense fallback={<PageSkeleton variant="grid" />}><SearchRoute categories={categories} /></Suspense>;
}
