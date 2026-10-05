// MartTabBar (mobile) — COMPONENTS.md → MartTabBar; референс site/MartTabBar.dc.html. Иконки — геометрией.
import Link from 'next/link';
import s from './MartTabBar.module.css';

export type Tab = 'home' | 'catalog' | 'cart' | 'profile';

export interface MartTabBarProps {
  active?: Tab;
  cartCount?: number;
  hrefs?: Partial<Record<Tab, string>>;
  /** fixed — прибит к низу экрана; false — в потоке (витрина). */
  fixed?: boolean;
}

const DEFAULT_HREFS: Record<Tab, string> = { home: '/', catalog: '/catalog', cart: '/cart', profile: '/account' };

export function MartTabBar({ active = 'home', cartCount = 0, hrefs, fixed }: MartTabBarProps) {
  const h = { ...DEFAULT_HREFS, ...hrefs };
  const tab = (k: Tab, label: string, icon: React.ReactNode, extra?: React.ReactNode) => (
    <Link href={h[k]} className={`${s.tab} ${active === k ? s.active : ''}`} aria-current={active === k ? 'page' : undefined}>
      {icon}{label}{extra}
    </Link>
  );
  return (
    <nav className={`${s.bar} ${fixed ? s.fixed : ''}`} aria-label="Разделы">
      {tab('home', 'Главная', <span className={s.iHome}><span /></span>)}
      {tab('catalog', 'Каталог', <span className={s.iCatalog}><span /><span /><span /><span /></span>)}
      {tab('cart', 'Корзина', <span className={s.iCart}><span /><span /></span>,
        cartCount > 0 && <span className={s.count} aria-label={`${cartCount} в корзине`}>{cartCount}</span>)}
      {tab('profile', 'Профиль', <span className={s.iProfile}><span /><span /></span>)}
    </nav>
  );
}
