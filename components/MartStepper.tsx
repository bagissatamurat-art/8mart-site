'use client';
// MartStepper — COMPONENTS.md → MartStepper; референс site/MartStepper.dc.html.
// «+» блокируется на max (opacity .4). qty → 0 удаляет позицию (решает владелец onChange).
import s from './MartStepper.module.css';

export interface MartStepperProps {
  qty: number;
  max?: number;
  size?: 36 | 44;
  tone?: 'primary' | 'neutral';
  full?: boolean;
  disabled?: boolean;
  onChange?: (qty: number) => void;
}

export function MartStepper({ qty, max = 99, size = 44, tone = 'primary', full, disabled, onChange }: MartStepperProps) {
  const atMax = qty >= max;
  return (
    <div className={`${s.root} ${s[tone]} ${disabled ? s.disabled : ''}`} style={{ height: size, width: full ? '100%' : undefined, fontSize: size >= 44 ? 16 : 14 }}
      onClick={e => e.stopPropagation()} role="group" aria-label="Количество">
      <button type="button" className={s.btn} style={{ width: size, height: size }} disabled={disabled} aria-label={qty <= 1 ? 'Удалить' : 'Меньше'}
        onClick={() => onChange?.(qty - 1)}>
        <span className={s.h} />
      </button>
      <span className={s.qty} aria-live="polite">{qty}</span>
      <button type="button" className={s.btn} style={{ width: size, height: size, opacity: atMax ? .4 : 1 }} disabled={disabled || atMax} aria-label="Больше"
        onClick={() => onChange?.(Math.min(max, qty + 1))}>
        <span className={s.h} /><span className={s.v} />
      </button>
    </div>
  );
}
