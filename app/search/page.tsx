import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getCategories } from '@/lib/api';
import { SearchRoute } from './SearchRoute';

export const metadata: Metadata = { title: 'Поиск', robots: { index: false } };

// Поиск — 05 Поиск.dc.html (5c / 5d).
export default async function SearchPage() {
  const categories = await getCategories();
  return <Suspense><SearchRoute categories={categories} /></Suspense>;
}
