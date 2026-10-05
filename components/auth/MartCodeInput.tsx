'use client';
// MartCodeInput — код из 4 цифр: 4 ячейки поверх одного скрытого input (DESIGN_RULES «Авторизация»).
// Клик по ячейкам фокусирует input, Backspace стирает, вставка и автозаполнение one-time-code работают нативно.
import { forwardRef, useState } from 'react';
import s from './MartCodeInput.module.css';

export type CodeStatus = 'idle' | 'error' | 'ok';

export interface MartCodeInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  status?: CodeStatus;
  disabled?: boolean;
  /** Принудительный фокус (витрина): подсветка активной ячейки и каретка. */
  focused?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export const MartCodeInput = forwardRef<HTMLInputElement, MartCodeInputProps>(function MartCodeInput({
  value, onChange, length = 4, status = 'idle', disabled, focused, autoFocus, ...aria
}, ref) {
  const [focusState, setFocus] = useState(false);
  const focus = (focused ?? focusState) && !disabled;
  const cur = Math.min(value.length, length - 1);
  return (
    <div className={s.wrap}>
      <div className={s.cells} aria-hidden>
        {Array.from({ length }, (_, i) => {
          const ch = value[i] || '';
          // Активна ячейка под курсором; когда всё заполнено — последняя (как в референсе)
          const active = focus && i === cur && (i === value.length || value.length === length);
          const cls = [s.cell, status === 'ok' ? s.ok : status === 'error' ? s.error : active ? s.active : ''].join(' ');
          return (
            <div key={i} className={cls}>
              {ch}{active && !ch && status !== 'error' && <span className={s.caret} />}
            </div>
          );
        })}
      </div>
      <input
        ref={ref} className={s.input} value={value} disabled={disabled} autoFocus={autoFocus}
        type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code"
        aria-label={aria['aria-label']} aria-describedby={aria['aria-describedby']} aria-invalid={status === 'error' || undefined}
        // Без maxLength: вставка «Код: 1234» сначала чистится от нецифр, потом обрезается
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      />
    </div>
  );
});
