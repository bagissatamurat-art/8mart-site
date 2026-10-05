'use client';
// Таб-бар mobile со счётчиком корзины из стора.
import { MartTabBar, type Tab } from '@/components/MartTabBar';
import { useCartCount } from '@/lib/store/cart';
import s from './site.module.css';

/** count — переопределение счётчика (корзина знает про раскупленное, оно в количество не входит). */
export function SiteTabBar({ active, count }: { active: Tab; count?: number }) {
  const stored = useCartCount();
  return <div className={s.mobileOnly}><MartTabBar active={active} cartCount={count ?? stored} fixed /></div>;
}
