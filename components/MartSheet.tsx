'use client';
// MartSheet — общий нижний лист (mobile). Референс: шторки «Фильтры» и «Сортировка» в site/07 Каталог.dc.html
// (затемнение --overlay, панель белая r24 сверху, отступы 20/16/24, max-height 88%).
// Закрытие: Esc, клик по фону, свайп вниз > 80 (с ручки или с панели, когда она прокручена к началу).
// contained — лист внутри ближайшего position:relative родителя (артборд 390 в витрине /kit), без портала и блокировки скролла.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import s from './MartSheet.module.css';

export interface MartSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Подпись для скринридера, если в листе нет видимого заголовка с labelledBy. */
  label?: string;
  /** id видимого заголовка внутри листа. */
  labelledBy?: string;
  /** Зазор между блоками листа: фильтры — 16, сортировка — 8. */
  gap?: number;
  /** max-height панели; по умолчанию 88% (фильтры). */
  maxHeight?: string;
  /** Видимая ручка сверху. В макете её нет — по умолчанию выключена, свайп работает и без неё. */
  handle?: boolean;
  /** Внутри родителя (витрина), а не поверх страницы. */
  contained?: boolean;
  /** Переводить фокус в лист при открытии (выключается для статичного образца в витрине). */
  autoFocus?: boolean;
  className?: string;
}

/** Порог свайпа вниз для закрытия — как у сторис (COMPONENTS.md → MartStories). */
const SWIPE_CLOSE = 80;

export function MartSheet({ open, onClose, children, label, labelledBy, gap = 16, maxHeight = '88%', handle, contained, autoFocus = true, className }: MartSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [dy, setDy] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; active: boolean } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Esc, фокус в лист и возврат фокуса, блокировка прокрутки страницы.
  useEffect(() => {
    if (!open) return;
    const prev = autoFocus ? document.activeElement as HTMLElement | null : null;
    if (autoFocus) panel.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    // Встроенный (contained) лист витрины всегда открыт — глобальный Esc ему не нужен и мешал бы остальным модалкам.
    if (!contained) document.addEventListener('keydown', onKey);
    let overflow = '';
    if (!contained) { overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    return () => {
      document.removeEventListener('keydown', onKey);
      if (!contained) document.body.style.overflow = overflow;
      prev?.focus?.({ preventScroll: true });
    };
  }, [open, contained, autoFocus, onClose]);

  useEffect(() => { if (!open) setDy(0); }, [open]);

  const start = useCallback((y: number, fromHandle: boolean) => {
    const el = panel.current;
    // Свайп с панели — только когда её содержимое прокручено к началу, иначе это обычная прокрутка.
    drag.current = { y, active: fromHandle || !el || el.scrollTop <= 0 };
  }, []);
  const move = (y: number) => {
    const d = drag.current; if (!d || !d.active) return;
    setDy(Math.max(0, y - d.y));
  };
  const end = () => {
    const d = drag.current; drag.current = null;
    if (!d || !d.active) return;
    if (dy > SWIPE_CLOSE) onClose(); else setDy(0);
  };

  if (!open || (!contained && !mounted)) return null;

  const sheet = (
    <div className={`${s.overlay} ${contained ? s.contained : s.fixed}`} onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={[s.panel, dy ? s.dragging : '', className].filter(Boolean).join(' ')}
        style={{ gap, maxHeight, transform: dy ? `translateY(${dy}px)` : undefined }}
        onClick={e => e.stopPropagation()}
        onTouchStart={e => start(e.touches[0].clientY, false)}
        onTouchMove={e => move(e.touches[0].clientY)}
        onTouchEnd={end}
        onTouchCancel={end}
      >
        {handle && (
          <div
            className={s.handle}
            aria-hidden
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); start(e.clientY, true); }}
            onPointerMove={e => move(e.clientY)}
            onPointerUp={end}
            onPointerCancel={end}
          ><span /></div>
        )}
        {children}
      </div>
    </div>
  );
  return contained ? sheet : createPortal(sheet, document.body);
}
