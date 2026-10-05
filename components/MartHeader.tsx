'use client';
// MartHeader — COMPONENTS.md → MartHeader, DESIGN_RULES.md → «Шапка desktop»; референс site/MartHeader.dc.html.
// Desktop 80: лого · способ получения · поиск · кнопка меню (бургер + аватар / «Войти»). Корзины в шапке нет.
// Меню — боковая панель справа 420 с затемнением; закрывается крестиком, Esc и кликом по фону.
// Mobile 124: белый блок r24 снизу — лого + способ получения, ниже поиск 48.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { BRAND, ORDER_STATUS, SUPPORT_WA } from '@/lib/config';
import { groupDigits } from '@/lib/domain/format';
import type { Category, Method, Order } from '@/lib/types';
import { MartButton } from './MartButton';
import { SearchField } from './MartSearch';
import { Chevron, Cross } from './ui/Cross';
import s from './MartHeader.module.css';

/** Разделы кабинета: /account/<section> (ids — как в маршрутах /account/[section]). */
export type AccountSection = 'orders' | 'favorites' | 'addresses' | 'payments' | 'promos' | 'bonus' | 'profile';
const ACCOUNT_ITEMS: [AccountSection, string][] = [
  ['orders', 'Мои заказы'], ['favorites', 'Избранное'], ['addresses', 'Адреса'], ['payments', 'Способы оплаты'],
  ['promos', 'Промокоды'], ['bonus', 'Бонусы'], ['profile', 'Личные данные'],
];
const ACTIVE_STATUSES: Order['status'][] = ['accepted', 'assembling', 'onway', 'ready'];

export interface MartHeaderProps {
  mode?: 'desktop' | 'mobile';
  /** Способ получения; null — не выбран («Как получить заказ?», оранжевая точка). */
  method?: Method | null;
  address?: string;
  /** Пусто — гость («Войти»). */
  userName?: string;
  userPhone?: string;
  query?: string;
  /** Принудительный фокус поиска (витрина); иначе — реальный фокус поля. */
  searchFocused?: boolean;
  /** Desktop: панель подсказок под полем (обычно <MartSearch mode="desktop" />), показывается в фокусе с затемнением. */
  searchPanel?: React.ReactNode;
  /** Открыто ли меню (стартовое / принудительное значение для витрины). */
  menuOpen?: boolean;
  /** Меню и затемнение позиционируются внутри ближайшего relative-предка, а не на весь экран (витрина /kit). */
  contained?: boolean;
  /** Активный заказ пользователя (первый в статусе accepted / assembling / onway / ready). */
  orders?: Order[];
  /** Счётчики разделов кабинета (Избранное, Промокоды, Бонусы…). */
  accountBadges?: Partial<Record<AccountSection, number>>;
  categories?: Category[];
  homeHref?: string;
  loginHref?: string;
  onMethod?: () => void;
  onQuery?: (q: string) => void;
  onSearchFocus?: () => void;
  /** Закрытие подсказок (клик по затемнению, Esc). */
  onSearchClose?: () => void;
  /** Enter в поиске. По умолчанию — переход на /search?q=. */
  onSubmit?: (q: string) => void;
  onMenuOpenChange?: (open: boolean) => void;
  onLogout?: () => void;
}

export function MartHeader(props: MartHeaderProps) {
  const {
    mode = 'desktop', method = null, address = '', userName = '', query = '', searchFocused, searchPanel, menuOpen = false, contained,
    homeHref = '/', onMethod, onQuery, onSearchFocus, onSearchClose, onSubmit, onMenuOpenChange,
  } = props;
  const router = useRouter();
  const [q, setQ] = useState(query);
  useEffect(() => setQ(query), [query]);
  const [focus, setFocus] = useState(false);
  const [menu, setMenu] = useState(menuOpen);
  useEffect(() => setMenu(menuOpen), [menuOpen]);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const setQuery = (v: string) => { setQ(v); onQuery?.(v); };
  const submit = (v: string) => { if (onSubmit) onSubmit(v); else router.push(`/search?q=${encodeURIComponent(v)}`); };
  const openMenu = (open: boolean) => {
    setMenu(open); onMenuOpenChange?.(open);
    if (!open) menuBtn.current?.focus();
  };

  const methodLabel = method === 'delivery' ? 'Доставка' : method === 'pickup' ? 'Самовывоз' : 'Как получить заказ?';
  const dot = <span className={`${s.dot} ${method ? s.dotOk : s.dotNone}`} aria-hidden />;

  if (mode === 'mobile') {
    return (
      <header className={s.mobile}>
        <div className={s.mRow}>
          <Link href={homeHref} className={s.logoLink} aria-label="8mart — на главную"><img src="/assets/logo.svg" alt="8mart" className={s.mLogo} /></Link>
          <button type="button" className={s.mMethod} onClick={onMethod} aria-haspopup="dialog">
            {dot}
            <span className={s.mMethodText}>{method ? (address || methodLabel) : 'Как получить заказ?'}</span>
            <span className={s.mChev}><Chevron size={7} direction="down" /></span>
          </button>
        </div>
        <SearchField value={q} onChange={setQuery} size={48} clearable={false} focused={searchFocused}
          onFocus={onSearchFocus} onSubmit={submit} />
      </header>
    );
  }

  const open = !!searchPanel && (searchFocused ?? focus);
  const closeSearch = () => { setFocus(false); onSearchClose?.(); };
  const user = !!userName;

  return (
    <>
      {open && <div className={`${s.searchOverlay} ${contained ? s.abs : s.fixed}`} onClick={closeSearch} aria-hidden />}
      <header className={s.desktop}>
        <Link href={homeHref} className={s.logoLink} aria-label="8mart — на главную"><img src="/assets/logo.svg" alt="8mart" className={s.logo} /></Link>

        <button type="button" className={s.method} onClick={onMethod} aria-haspopup="dialog">
          {dot}
          <span className={s.methodText}>
            <span className={s.methodLabel}>{methodLabel}</span>
            <span className={s.methodAddr}>{method ? (address || 'Укажите адрес') : 'Выбрать способ'}</span>
          </span>
          <span className={s.methodChev}><Chevron size={8} direction="down" /></span>
        </button>

        <div className={s.search}
          onFocus={() => { if (!focus) { setFocus(true); onSearchFocus?.(); } }}
          onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false); }}>
          <SearchField value={q} onChange={setQuery} size={56} focused={searchFocused} onSubmit={submit}
            onEscape={closeSearch} controls={searchPanel ? panelId : undefined} expanded={searchPanel ? open : undefined} />
          {/* mousedown не уводит фокус из поля: иначе (Safari) панель закрылась бы до клика по подсказке */}
          {open && <div className={s.dropdown} id={panelId} onMouseDown={e => e.preventDefault()}>{searchPanel}</div>}
        </div>

        <button ref={menuBtn} type="button" className={`${s.menuBtn} ${user ? s.menuBtnUser : ''}`} onClick={() => openMenu(true)}
          aria-haspopup="dialog" aria-expanded={menu} aria-label={user ? `Меню, ${userName}` : 'Меню, войти'}>
          <span className={s.burger} aria-hidden><span /><span /><span /></span>
          {user ? <span className={s.avatar} aria-hidden>{userName[0]}</span> : <span className={s.login}>Войти</span>}
        </button>
      </header>
      {menu && <MartSideMenu {...props} contained={contained} onClose={() => openMenu(false)} />}
    </>
  );
}

// ─────────────────────────── Боковое меню ───────────────────────────

export interface MartSideMenuProps extends Pick<MartHeaderProps,
  'userName' | 'userPhone' | 'orders' | 'accountBadges' | 'categories' | 'loginHref' | 'contained' | 'onLogout'> {
  onClose: () => void;
  /** Фокус на крестик при открытии (по умолчанию да; статичные образцы витрины — нет). */
  autoFocus?: boolean;
}

/** Панель справа 420: гость — плашка «Войдите»; пользователь — профиль, активный заказ, разделы кабинета, «Выйти». */
export function MartSideMenu({ userName = '', userPhone = '', orders = [], accountBadges = {}, categories = [], loginHref = '/account', contained, onLogout, onClose, autoFocus = true }: MartSideMenuProps) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  const user = !!userName;
  const active = orders.find(o => ACTIVE_STATUSES.includes(o.status));

  // Esc закрывает; фокус — на крестик; на весь экран — блокируем прокрутку страницы.
  useEffect(() => {
    if (autoFocus) closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    if (!contained) document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); if (!contained) document.body.style.overflow = prev; };
  }, [contained, autoFocus]);

  const pos = contained ? s.abs : s.fixed;
  return (
    <>
      <div className={`${s.overlay} ${pos}`} onClick={onClose} aria-hidden />
      <aside className={`${s.aside} ${pos}`} role="dialog" aria-modal="true" aria-label="Меню">
        <div className={s.asideHead}>
          {user
            ? <Link href="/account" className={s.profile} onClick={onClose}>
                <span className={s.avatar48} aria-hidden>{userName[0]}</span>
                <span className={s.profileText}><b className={s.userName}>{userName}</b><span className={s.userPhone}>{userPhone}</span></span>
              </Link>
            : <b className={s.menuTitle}>Меню</b>}
          <button ref={closeBtn} type="button" className={s.close} aria-label="Закрыть" onClick={onClose}><Cross size={14} color="var(--ink-1)" /></button>
        </div>

        <div className={s.asideBody}>
          {!user && (
            <div className={s.guest}>
              <div className={s.guestText}>
                <b className={s.guestTitle}>Войдите в 8mart</b>
                <span className={s.guestSub}>Заказы, избранное, адреса и бонусы — в одном месте</span>
              </div>
              <MartButton label="Войти" size={56} full href={loginHref} />
            </div>
          )}

          {user && (
            <div className={s.list}>
              {active && (
                <Link href={`/order/${active.id}`} className={s.order} onClick={onClose}>
                  <span className={s.orderText}>
                    <span className={s.orderNo}>Заказ №{active.id}</span>
                    <b className={s.orderStatus}>{ORDER_STATUS[active.status].label}</b>
                  </span>
                  {active.eta && <span className={s.orderEta}>к {active.eta.split('–')[0]}</span>}
                </Link>
              )}
              {ACCOUNT_ITEMS.map(([id, label]) => {
                const n = accountBadges[id];
                return (
                  <Link key={id} href={`/account/${id}`} className={`${s.row} ${s.rowBetween}`} onClick={onClose}>
                    <span>{label}</span>
                    <span className={s.rowEnd}>
                      {!!n && <span className={`${s.badge} ${id === 'bonus' ? s.badgeBonus : ''}`}>{groupDigits(n)}</span>}
                      <span className={s.rowChev}><Chevron size={7} color="var(--ink-3)" direction="right" /></span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          <div className={s.divider} />
          <div className={s.list}>
            <span className={s.caption}>Каталог</span>
            {categories.map(c => (
              <Link key={c.slug} href={`/catalog?cat=${c.slug}`} className={s.row} onClick={onClose}>
                <span className={s.catIcon}>{c.img && <img src={c.img} alt="" />}</span>{c.name}
              </Link>
            ))}
          </div>

          <div className={s.divider} />
          <div className={s.list}>
            <a href={`https://wa.me/${SUPPORT_WA}`} target="_blank" rel="noopener" className={`${s.row} ${s.rowTall}`}>
              <span className={`${s.supIcon} ${s.supWa}`} aria-hidden><span /></span>
              <span className={s.supText}><span className={s.supTitle}>Написать в поддержку</span><span className={s.supSub}>WhatsApp</span></span>
            </a>
            <a href={`tel:${BRAND.phoneRaw}`} className={`${s.row} ${s.rowTall}`}>
              <span className={`${s.supIcon} ${s.supPhone}`} aria-hidden><span /></span>
              <span className={s.supText}><span className={s.supTitle}>{BRAND.phone}</span><span className={s.supSub}>Ежедневно</span></span>
            </a>
          </div>

          {user && <button type="button" className={s.logout} onClick={() => { onClose(); onLogout?.(); }}>Выйти</button>}
        </div>
      </aside>
    </>
  );
}
