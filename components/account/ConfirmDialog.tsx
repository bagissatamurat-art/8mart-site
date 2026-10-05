'use client';
// Диалог подтверждения (удаление аккаунта) — из site/06 Личный кабинет.dc.html.
// Desktop — карточка 440 по центру; mobile — sheet снизу, кнопки столбиком («Удалить» первой). Esc и клик по фону закрывают.
import { useId, useRef } from 'react';
import { useModal } from '@/lib/hooks/useModal';
import { createPortal } from 'react-dom';
import { MartButton } from '../MartButton';
import { Cross } from '../ui/Cross';
import s from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel?: string;
  mode?: 'desktop' | 'mobile';
  loading?: boolean;
  /** В потоке, без портала и фиксированного оверлея (витрина). */
  inline?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, text, confirmLabel, cancelLabel = 'Отмена', mode = 'desktop', loading, inline, onConfirm, onClose }: ConfirmDialogProps) {
  const id = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const m = mode === 'mobile';

  // Фокус на «Отмена» — безопасное действие по умолчанию; пока идёт запрос, Esc не закрывает.
  // В витрине (inline) диалог открыт сразу — фокус и прокрутку не трогаем.
  useModal({ active: open && !inline, ref: boxRef, onClose: () => { if (!loading) onClose(); },
    initialFocus: () => boxRef.current?.querySelector<HTMLElement>('[data-cancel] button') });

  if (!open) return null;
  const cancel = <span data-cancel className={s.btnWrap}><MartButton label={cancelLabel} variant="ghost" size={56} full onClick={onClose} /></span>;
  const confirm = <span className={s.btnWrap}><MartButton label={confirmLabel} variant="danger" size={56} full loading={loading} onClick={onConfirm} /></span>;
  const dialog = (
    <div className={`${s.overlay} ${m ? s.overlayM : ''} ${inline ? s.inline : ''}`} onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div ref={boxRef} role="dialog" aria-modal="true" aria-labelledby={id + '-t'} aria-describedby={id + '-d'} className={`${s.box} ${m ? s.boxM : ''}`}>
        <button type="button" className={`${s.close} ${m ? s.closeM : ''}`} aria-label="Закрыть" onClick={onClose} disabled={loading}>
          <Cross size={14} color="var(--ink-1)" />
        </button>
        <div className={s.head}>
          <h2 id={id + '-t'} className={s.title}>{title}</h2>
          <p id={id + '-d'} className={s.text}>{text}</p>
        </div>
        <div className={m ? s.btnsM : s.btns}>{m ? <>{confirm}{cancel}</> : <>{cancel}{confirm}</>}</div>
      </div>
    </div>
  );
  return inline || typeof document === 'undefined' ? dialog : createPortal(dialog, document.body);
}
