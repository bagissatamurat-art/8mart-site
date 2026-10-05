import type { Metadata } from 'next';
import { SearchScreen } from '@/components/screens/SearchScreen';
import { getCategories } from '@/lib/api';

type Props = { searchParams: Promise<{ q?: string | string[] }> };

const readQ = (q: string | string[] | undefined) => (Array.isArray(q) ? q[0] : q ?? '').trim();

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = readQ((await searchParams).q);
  return { title: q ? `«${q}» — поиск 8mart` : 'Поиск — 8mart', robots: { index: false } };
}

// Поиск — 05 Поиск.dc.html (5c / 5d). Запрос — из ?q=; новый запрос — новый экран (key), сбрасывает категорию, фильтры и сортировку.
export default async function SearchPage({ searchParams }: Props) {
  const q = readQ((await searchParams).q);
  const categories = await getCategories();
  return <SearchScreen key={q} q={q} categories={categories} />;
}
