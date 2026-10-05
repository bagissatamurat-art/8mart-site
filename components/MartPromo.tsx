'use client';
// MartPromo — COMPONENTS.md → MartPromo; референс site/MartPromo.dc.html.
// Состояния: idle, loading, applied, ошибки notFound / expired / minSum. Тексты — PROMO_ERRORS.
import { useState } from 'react';
import { PROMO_ERRORS } from '@/lib/copy';
import { MartInput } from './MartInput';
import { MartButton } from './MartButton';
import { Cross } from './ui/Cross';
import s from './MartPromo.module.css';

export type PromoStatus = 'idle' | 'loading' | 'applied' | 'notFound' | 'expired' | 'minSum';

export interface MartPromoProps {
  status?: PromoStatus;
  value?: string;
  /** Применённый код */
  code?: string;
  /** «−1 278 тг.» */
  discountText?: string;
  minSum?: number;
  onApply?: (code: string) => void;
  onRemove?: () => void;
}

export function promoErrorText(status: PromoStatus, minSum = 0): string {
  return status === 'notFound' ? PROMO_ERRORS.notFound : status === 'expired' ? PROMO_ERRORS.expired : status === 'minSum' ? PROMO_ERRORS.minSum(minSum) : '';
}

export function MartPromo({ status = 'idle', value: initial = '', code, discountText = '', minSum = 0, onApply, onRemove }: MartPromoProps) {
  const [value, setValue] = useState(initial);
  if (status === 'applied') {
    return (
      <div className={s.applied}>
        <div className={s.col}><span className={s.ok}>Промокод применён</span><span className={s.code}>{code ?? value.toUpperCase()}</span></div>
        <div className={s.right}>
          <span className={s.disc}>{discountText}</span>
          <button type="button" className={s.remove} aria-label="Убрать промокод" onClick={onRemove}><Cross size={14} /></button>
        </div>
      </div>
    );
  }
  const err = promoErrorText(status, minSum);
  return (
    <form className={s.row} onSubmit={e => { e.preventDefault(); if (value) onApply?.(value); }}>
      <div className={s.field}><MartInput label="Промокод" value={value} error={err || undefined} onChange={setValue} autoComplete="off" /></div>
      <MartButton label="Применить" variant="secondary" size={56} type="submit" disabled={!value} loading={status === 'loading'} />
    </form>
  );
}
