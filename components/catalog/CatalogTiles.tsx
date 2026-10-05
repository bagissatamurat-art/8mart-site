// Плитки каталога (07): корень — категории, уровень категории — «Все товары» + подкатегории.
// Desktop: сетка 3 в ряд; mobile: категории — строки с фото 72 и стрелкой, подкатегории — сетка 2 в ряд.
import Link from 'next/link';
import { CATALOG } from '@/lib/copy';
import { itemsTitle, plural } from '@/lib/domain';
import type { Category } from '@/lib/types';
import { Chevron } from '@/components/ui/Cross';
import { catalogHref } from './catalogUrl';
import c from './catalog.module.css';
import { Img } from '@/components/ui/Img';

/** Счётчики и обложки по slug (корневой или подкатегории) — собирает app/catalog/page.tsx через getProducts(). */
export type CatalogStats = Record<string, { count: number; img?: string }>;

export function RootTiles({ categories, stats }: { categories: Category[]; stats: CatalogStats }) {
  return (
    <div className={c.rootTiles}>
      {categories.map(x => {
        const n = stats[x.slug]?.count ?? 0;
        const [one, few, many] = CATALOG.sectionWords;
        const meta = x.sub.length ? CATALOG.tileMeta(`${x.sub.length} ${plural(x.sub.length, one, few, many)}`, itemsTitle(n)) : CATALOG.catEmpty.title;
        return (
          <Link key={x.slug} href={catalogHref({ cat: x.slug })} className={c.rootTile}>
            {x.img ? <Img src={x.img} w={160} h={160} className={c.rootImg} /> : <span className={`${c.rootImg} ${c.stripes}`} />}
            <span className={c.rootText}><b className={c.rootName}>{x.name}</b><span className={c.meta}>{meta}</span></span>
            <span className={c.rootArrow} aria-hidden><Chevron size={8} color="var(--ink-3)" direction="right" /></span>
          </Link>
        );
      })}
    </div>
  );
}

export function SubTiles({ category, stats }: { category: Category; stats: CatalogStats }) {
  return (
    <div className={c.subTiles}>
      <Link href={catalogHref({ cat: category.slug, all: true })} className={c.subTile}>
        <span className={`${c.subImg} ${c.subAll}`}>{CATALOG.allGoods}</span>
        <span className={c.subText}><b className={c.subName}>{CATALOG.allGoods}</b><span className={c.meta}>{itemsTitle(stats[category.slug]?.count ?? 0)}</span></span>
      </Link>
      {category.sub.map(x => {
        const st = stats[x.slug];
        return (
          <Link key={x.slug} href={catalogHref({ cat: category.slug, sub: x.slug })} className={c.subTile}>
            {st?.img ? <Img src={st.img} w={120} h={120} className={c.subImg} /> : <span className={`${c.subImg} ${c.stripes}`} />}
            <span className={c.subText}><b className={c.subName}>{x.name}</b><span className={c.meta}>{st?.count ? itemsTitle(st.count) : CATALOG.subEmpty}</span></span>
          </Link>
        );
      })}
    </div>
  );
}
