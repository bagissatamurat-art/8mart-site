'use client';
// Навигация кабинета — site/06 Личный кабинет.dc.html.
// desktop — сайдбар (профиль, разделы со счётчиками, «Выйти»); mobile — экран «Профиль» (шапка, активный заказ, список разделов, «Выйти»)
// и шапка экрана раздела с кнопкой «Назад» (MartAccountScreenHeader).
import Link from 'next/link';
import type { Bonus, Order, User, UserPromo } from '@/lib/types';
import { Chevron } from '../ui/Cross';
import { ACCOUNT_SECTIONS, defaultOrderHref, isActiveOrder, navBadges, orderSteps, statusLabel, type AccountSection } from './sections';
import s from './MartAccountNav.module.css';

export interface MartAccountNavProps {
  mode?: 'desktop' | 'mobile';
  /** Текущий раздел (подсвечивается только в сайдбаре desktop). */
  section?: AccountSection;
  user: Pick<User, 'name' | 'phone'>;
  /** Данные для счётчиков и карточки активного заказа. */
  orders?: Order[];
  promos?: UserPromo[];
  bonus?: Bonus | null;
  /** Ссылка раздела (роутинг); без неё — кнопки с onSelect. */
  hrefFor?: (section: AccountSection) => string;
  onSelect?: (section: AccountSection) => void;
  orderHref?: (id: string) => string;
  onLogout?: () => void;
  className?: string;
}

export function MartAccountNav({ mode = 'desktop', section, user, orders, promos, bonus, hrefFor, onSelect, orderHref = defaultOrderHref, onLogout, className }: MartAccountNavProps) {
  const m = mode === 'mobile';
  const badges = navBadges({ orders, promos, bonus });
  const initial = (user.name || '?').trim().charAt(0).toUpperCase() || '?';

  const rows = ACCOUNT_SECTIONS.map(([id, label]) => {
    const cur = !m && id === section;
    const b = badges[id];
    const inner = (
      <>
        <span>{label}</span>
        <span className={s.end}>
          {b && <span className={`${s.badge} ${s[`badge_${b.tone}`]}`}>{b.text}</span>}
          {m && <Chevron size={8} color="var(--ink-3)" direction="right" />}
        </span>
      </>
    );
    const cls = `${s.item} ${cur ? s.current : ''}`;
    const href = hrefFor?.(id);
    return (
      <li key={id}>
        {href
          ? <Link href={href} className={cls} aria-current={cur ? 'page' : undefined} onClick={() => onSelect?.(id)}>{inner}</Link>
          : <button type="button" className={cls} aria-current={cur ? 'page' : undefined} onClick={() => onSelect?.(id)}>{inner}</button>}
      </li>
    );
  });

  if (!m) {
    return (
      <nav className={`${s.aside} ${className || ''}`} aria-label="Разделы кабинета">
        <div className={s.profile}>
          <span className={s.avatar} aria-hidden>{initial}</span>
          <span className={s.who}><b className={s.name}>{user.name}</b><span className={s.phone}>{user.phone}</span></span>
        </div>
        <ul className={s.list}>{rows}</ul>
        <div className={s.divider} />
        <button type="button" className={`${s.item} ${s.logout}`} onClick={onLogout}>Выйти</button>
      </nav>
    );
  }

  const active = (orders || []).find(isActiveOrder);
  return (
    <div className={`${s.mRoot} ${className || ''}`}>
      <div className={s.mHead}>
        <span className={`${s.avatar} ${s.avatarM}`} aria-hidden>{initial}</span>
        <span className={s.who}><b className={s.nameM}>{user.name}</b><span className={s.phoneM}>{user.phone}</span></span>
      </div>
      <div className={s.mBody}>
        {active && (
          <Link href={orderHref(active.id)} className={s.activeCard}>
            <span className={s.activeTop}><span className={s.activeNo}>Активный заказ №{active.id}</span><Chevron size={8} color="var(--ink-3)" direction="right" /></span>
            <span className={s.activeMid}><b className={s.activeLabel}>{statusLabel(active)}</b>{active.eta && <span className={s.activeEta}>к {active.eta}</span>}</span>
            <span className={s.bars} aria-hidden>{orderSteps(active).map(st => <span key={st.label} className={`${s.bar} ${s[`bar_${st.state}`]}`} />)}</span>
          </Link>
        )}
        <nav aria-label="Разделы кабинета"><ul className={`${s.list} ${s.listM}`}>{rows}</ul></nav>
        <button type="button" className={s.logoutM} onClick={onLogout}>Выйти</button>
      </div>
    </div>
  );
}

/** Шапка экрана раздела на mobile: «Назад» 40 + заголовок 22/800. */
export function MartAccountScreenHeader({ title, backHref, onBack }: { title: string; backHref?: string; onBack?: () => void }) {
  const back = <Chevron size={9} color="var(--ink-1)" direction="left" />;
  return (
    <div className={s.screenHead}>
      {backHref
        ? <Link href={backHref} className={s.back} aria-label="Назад" onClick={onBack}>{back}</Link>
        : <button type="button" className={s.back} aria-label="Назад" onClick={onBack}>{back}</button>}
      <h1 className={s.screenTitle}>{title}</h1>
    </div>
  );
}
