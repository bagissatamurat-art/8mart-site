// Шапка каталога mobile (7b): белая, r24 снизу, padding 8/16/14, gap 12.
// Корень — «Каталог» 24/800 + поле-ссылка «Найти товар» 44; ниже — «назад» 40 + заголовок 22/800 + счётчик; на списке — ряд кнопок и чипов.
import Link from 'next/link';
import { CATALOG } from '@/lib/copy';
import { Chevron } from '@/components/ui/Cross';
import c from './catalog.module.css';

export function CatalogTopBar({ root, title, count, backHref, children }: {
  root: boolean; title: string; count?: string; backHref: string;
  /** Ряд «Фильтры» · сортировка · подкатегории (только список). */
  children?: React.ReactNode;
}) {
  return (
    <div className={c.topBar}>
      {root ? (
        <>
          <h1 className={c.topRoot}>{CATALOG.title}</h1>
          <Link href="/search" className={c.searchLink}><span className={c.loupe} aria-hidden />{CATALOG.searchPlaceholder}</Link>
        </>
      ) : (
        <div className={c.topRow}>
          <Link href={backHref} className={c.back} aria-label="Назад"><Chevron size={9} color="var(--ink-1)" direction="left" /></Link>
          <h1 className={c.topTitle}>{title}</h1>
          {count && <span className={c.topCount}>{count}</span>}
        </div>
      )}
      {children && <div className={c.topChips}>{children}</div>}
    </div>
  );
}
