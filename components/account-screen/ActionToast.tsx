'use client';
// Тост с действием — «Повторить» в 06 Личный кабинет.dc.html: тёмная плашка + белая pill-кнопка «В корзину».
// Desktop — pill по центру снизу (bottom 32); mobile — r16 над таб-баром (left/right 16, bottom 96).
// Общий Toast (components/ui/Toast) действия не умеет и стоит сверху — поэтому отдельная плашка.
import Link from 'next/link';
import { useEffect } from 'react';
import s from './ActionToast.module.css';

export function ActionToast({ text, actionLabel, actionHref, mobile, timeout = 3500, onClose }: {
  text: string; actionLabel: string; actionHref: string; mobile?: boolean; timeout?: number; onClose: () => void;
}) {
  useEffect(() => { const t = setTimeout(onClose, timeout); return () => clearTimeout(t); }, [timeout, onClose]);
  return (
    <div role="status" className={`${s.toast} ${mobile ? s.m : ''}`}>
      <span>{text}</span>
      <Link href={actionHref} className={s.action}>{actionLabel}</Link>
    </div>
  );
}
