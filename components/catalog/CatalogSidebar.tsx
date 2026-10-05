// Сайдбар каталога desktop (7a): «Все категории» 44 + категории 48 (иконка 36); у открытой категории — подкатегории 36 с отступом 58.
// Строки категорий — те же стили, что у CategorySidebar главной (site.module.css).
import Link from 'next/link';
import { CATALOG } from '@/lib/copy';
import type { Category } from '@/lib/types';
import { catalogHref, type CatalogLevel } from './catalogUrl';
import s from '@/components/site/site.module.css';
import c from './catalog.module.css';

export function CatalogSidebar({ categories, level, cat, sub }: { categories: Category[]; level: CatalogLevel; cat: string | null; sub: string | null }) {
  const isRoot = level === 'root';
  return (
    <nav className={s.sidebar} aria-label="Категории">
      <Link href="/catalog" className={`${c.sideAll} ${isRoot ? c.sideAllOn : ''}`} aria-current={isRoot ? 'page' : undefined}>{CATALOG.allCategories}</Link>
      {categories.map(x => {
        const on = !isRoot && x.slug === cat;
        return (
          <div key={x.slug} className={c.sideItem}>
            <Link href={catalogHref({ cat: x.slug })} className={`${s.sideRow} ${on ? s.sideRowActive : ''}`}
              aria-current={on && level === 'cat' ? 'page' : undefined}>
              {x.img ? <img src={x.img} alt="" className={s.sideImg} /> : <span className={`${s.sideImg} ${c.stripes}`} />}{x.name}
            </Link>
            {on && x.sub.length > 0 && (
              <div className={c.sideSubs}>
                {x.sub.map(y => {
                  const a = level === 'list' && sub === y.slug;
                  return (
                    <Link key={y.slug} href={catalogHref({ cat: x.slug, sub: y.slug })} className={`${c.sideSub} ${a ? c.sideSubOn : ''}`}
                      aria-current={a ? 'page' : undefined}>{y.name}</Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
