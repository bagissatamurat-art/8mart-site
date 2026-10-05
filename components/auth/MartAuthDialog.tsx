'use client';
// MartAuthDialog — MartAuth в модалке (desktop, 440 по центру) или bottom sheet (mobile).
// Так MartAuth показан в 06 Личный кабинет.dc.html (смена номера). Esc, клик по фону и крестик закрывают.
import { useEffect, useRef } from 'react';
import { Cross } from '../ui/Cross';
import { MartAuth, type MartAuthProps } from '../MartAuth';
import s from './MartAuthDialog.module.css';

export interface MartAuthDialogProps extends MartAuthProps {
  open: boolean;
  onClose: () => void;
  /** Витрина: рисовать внутри родителя (position:absolute), без блокировки прокрутки и Esc. */
  inline?: boolean;
  'aria-label'?: string;
}

export function MartAuthDialog({ open, onClose, inline, mode = 'desktop', 'aria-label': label, ...auth }: MartAuthDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || inline) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', onKey);
    // Фокус внутрь диалога, если MartAuth сам его не забрал (шаг «Код» фокусирует ячейки)
    requestAnimationFrame(() => {
      if (ref.current && !ref.current.contains(document.activeElement)) ref.current.querySelector<HTMLElement>('input, button')?.focus();
    });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, inline]);

  if (!open) return null;
  const sheet = mode === 'mobile';
  return (
    <div className={[s.overlay, sheet && s.overlaySheet, inline && s.inline].filter(Boolean).join(' ')}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal={!inline || undefined} aria-label={label ?? (auth.purpose === 'changePhone' ? 'Смена номера' : 'Вход')}
        className={`${s.dialog} ${sheet ? s.sheet : ''}`}>
        <button type="button" className={s.close} aria-label="Закрыть" onClick={onClose}>
          <Cross size={14} color="var(--ink-1)" />
        </button>
        <MartAuth mode={mode} {...auth} />
      </div>
    </div>
  );
}
