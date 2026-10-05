'use client';
// Тост: тёмная плашка r16, текст 15, крестик 36. Референс — «Аккаунт удалён» в 01 Главная и каталог.
import { useEffect } from 'react';
import { Cross } from './Cross';
import s from './ui.module.css';

export function Toast({ children, onClose, timeout = 6000, inline }: { children: React.ReactNode; onClose: () => void; timeout?: number; inline?: boolean }) {
  useEffect(() => { if (!timeout || inline) return; const t = setTimeout(onClose, timeout); return () => clearTimeout(t); }, [timeout, onClose, inline]);
  return (
    <div role="status" className={`${s.toast} ${inline ? s.toastInline : ''}`}>
      <span className={s.toastText}>{children}</span>
      <button type="button" className={s.toastClose} aria-label="Закрыть" onClick={onClose}><Cross size={12} color="#fff" /></button>
    </div>
  );
}
