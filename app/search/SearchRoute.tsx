'use client';
// Запрос читается в браузере (?q=), чтобы страница была статической (GitHub Pages, CDN).
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchScreen } from '@/components/screens/SearchScreen';
import type { Category } from '@/lib/types';

export function SearchRoute({ categories }: { categories: Category[] }) {
  const q = (useSearchParams().get('q') ?? '').trim();
  useEffect(() => { document.title = q ? `«${q}» — поиск 8mart` : 'Поиск — 8mart'; }, [q]);
  // Новый запрос — новый экран (key): сбрасывает категорию, фильтры и сортировку.
  return <SearchScreen key={q} q={q} categories={categories} />;
}
