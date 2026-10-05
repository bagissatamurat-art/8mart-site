// Хлебные крошки desktop-экранов: «Главная · Раздел · Текущая». Последний пункт без ссылки — текущая страница.
import Link from 'next/link';
import s from './Breadcrumbs.module.css';

export interface Crumb { label: string; href?: string | null }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className={s.crumbs} aria-label="Навигация">
      {items.map(({ label, href }, i) => (
        <span key={label + i} className={s.item}>
          {i > 0 && <span aria-hidden>·</span>}
          {href ? <Link href={href}>{label}</Link> : <span className={s.current} aria-current="page">{label}</span>}
        </span>
      ))}
    </nav>
  );
}
