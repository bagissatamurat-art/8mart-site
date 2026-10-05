'use client';
// Шапка экрана mobile (02, 03): белая, r24 снизу, «назад» 40 + заголовок 22/800 + правый слот.
import Link from 'next/link';
import { Chevron } from '../ui/Cross';
import s from './checkout.module.css';

export function MobileTopBar({ title, sub, backHref = '/', right, children }: { title: string; sub?: string; backHref?: string; right?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className={s.topBar}>
      <div className={s.topRow}>
        <Link href={backHref} className={s.back} aria-label="Назад"><Chevron size={9} color="var(--ink-1)" direction="left" /></Link>
        <h1 className={s.topTitle}>{title}{sub && <span className={s.topSub}> · {sub}</span>}</h1>
        {right}
      </div>
      {children}
    </div>
  );
}

/** Плашка способа получения с «Изменить» (корзина): серый фон r14. */
export function MethodCard({ label, address, onChange, mobile }: { label: string; address: string; onChange: () => void; mobile?: boolean }) {
  return (
    <button type="button" className={`${s.methodCard} ${mobile ? s.methodCardM : ''}`} onClick={onChange} aria-haspopup="dialog">
      <span className={s.methodText}><span className={s.methodLabel}>{label}</span><span className={s.methodAddr}>{address}</span></span>
      <span className={s.methodEdit}>Изменить</span>
    </button>
  );
}
