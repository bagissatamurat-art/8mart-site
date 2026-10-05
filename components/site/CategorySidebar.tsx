// Сайдбар категорий desktop (главная, каталог): белый r24, строки 48, иконка 36. Референс — 01 Главная и каталог (1a, 1d).
import Link from 'next/link';
import type { Category } from '@/lib/types';
import s from './site.module.css';
import { Img } from '@/components/ui/Img';

export function CategorySidebar({ categories, active }: { categories: Category[]; active?: string }) {
  return (
    <nav className={s.sidebar} aria-label="Категории">
      {categories.map(c => (
        <Link key={c.slug} href={`/catalog?cat=${c.slug}`} className={`${s.sideRow} ${c.slug === active ? s.sideRowActive : ''}`}
          aria-current={c.slug === active ? 'page' : undefined}>
          <Img src={c.img} w={36} h={36} className={s.sideImg} />{c.name}
        </Link>
      ))}
    </nav>
  );
}
