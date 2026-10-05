'use client';
// MartInput — COMPONENTS.md → MartInput; референс site/MartInput.dc.html.
// Плавающий лейбл, 56 (textarea 84), r16, бордер 1.5. Очистка × — только в фокусе и когда заполнено; у телефона нет.
import { forwardRef, useId, useState } from 'react';
import { formatPhone } from '@/lib/domain/format';
import { FORM_ERRORS } from '@/lib/copy';
import { Cross } from './ui/Cross';
import s from './MartInput.module.css';

export interface MartInputProps {
  label: string;
  value?: string;
  /** Неуправляемый режим (витрина): стартовое значение. */
  defaultValue?: string;
  type?: 'text' | 'phone' | 'code' | 'textarea';
  required?: boolean;
  hint?: string;
  /** true → «Обязательное поле» */
  error?: string | boolean;
  disabled?: boolean;
  /** Принудительный фокус (витрина). */
  focused?: boolean;
  name?: string;
  autoComplete?: string;
  maxLength?: number;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  className?: string;
}

export const MartInput = forwardRef<HTMLInputElement & HTMLTextAreaElement, MartInputProps>(function MartInput({
  label, value: controlled, defaultValue = '', type = 'text', required, hint, error, disabled, focused, name, autoComplete, maxLength,
  onChange, onFocus, onBlur, onKeyDown, className,
}, ref) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const [focusState, setFocus] = useState(false);
  const value = controlled ?? inner;
  const focus = focused ?? focusState;
  const isArea = type === 'textarea', isPhone = type === 'phone';
  const filled = value.length > 0;
  const hasError = !!error;
  const msg = hasError ? (error === true ? FORM_ERRORS.required : error) : hint;

  const set = (v: string) => { setInner(v); onChange?.(v); };
  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(isPhone ? formatPhone(e.target.value, value) : e.target.value);

  const state = disabled ? s.disabled : hasError ? s.error : focus ? s.focus : '';
  const common = {
    id, name, value, disabled, ref, onChange: handle, 'aria-invalid': hasError || undefined, 'aria-required': required || undefined,
    'aria-describedby': msg ? id + '-msg' : undefined, onKeyDown,
    onFocus: () => { setFocus(true); onFocus?.(); }, onBlur: () => { setFocus(false); onBlur?.(); },
    className: `${s.control} ${isArea ? s.area : ''} ${filled && !isPhone ? s.withClear : ''} ${type === 'code' ? s.code : ''}`,
  };
  return (
    <div className={`${s.root} ${className || ''}`}>
      <div className={`${s.box} ${isArea ? s.boxArea : ''} ${state} ${focus || filled ? s.up : ''}`}>
        <label htmlFor={id} className={s.label}>{label}{required && <span className={s.req}>*</span>}</label>
        {isArea
          ? <textarea {...common} maxLength={maxLength} />
          : <input {...common} type={isPhone ? 'tel' : 'text'} inputMode={isPhone || type === 'code' ? 'tel' : 'text'}
              autoComplete={autoComplete ?? (isPhone ? 'tel' : type === 'code' ? 'one-time-code' : 'on')} maxLength={maxLength} />}
        {!isPhone && !disabled && focus && filled && (
          <button type="button" className={s.clear} aria-label="Очистить" onMouseDown={e => { e.preventDefault(); set(''); }}>
            <Cross size={14} />
          </button>
        )}
      </div>
      {msg && <div id={id + '-msg'} className={`${s.msg} ${hasError ? s.msgError : ''}`}>{msg}</div>}
    </div>
  );
});
