'use client';
// Ввод оценки: пять звёзд-кнопок 44×44. В форме — радиогруппа: стрелки меняют оценку, под звёздами — словом
// («Отлично»). pick — звёзды-кнопки в «Оцените букет»: нажатие сразу открывает форму с этой оценкой, стрелки только
// переводят фокус. Наведение мышью подсвечивает звёзды до курсора.
import { useRef, useState, type KeyboardEvent } from 'react';
import { REVIEWS } from '@/lib/copy';
import { STAR_PATH } from './Stars';
import s from '../MartReviews.module.css';

export interface StarsInputProps {
  value: number;
  onChange: (n: number) => void;
  /** Звезда внутри кнопки 44: 32 — в форме, 28 — в строке «Оцените букет». */
  size?: number;
  /** Звёзды открывают форму, а не выбирают оценку (без радиогруппы). */
  pick?: boolean;
  /** Подпись группы для скринридера. */
  label?: string;
  /** Оценка словом под звёздами. */
  caption?: boolean;
  disabled?: boolean;
}

export function StarsInput({ value, onChange, size = 32, pick, label = 'Оценка', caption = !pick, disabled }: StarsInputProps) {
  const [hover, setHover] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const shown = hover || value;
  const focusAt = (n: number) => ref.current?.querySelector<HTMLButtonElement>(`[data-star="${n}"]`)?.focus();
  const onKey = (e: KeyboardEvent) => {
    const at = Number((e.target as HTMLElement).dataset?.star) || value || 0;
    const next = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? Math.min(5, at + 1)
      : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? Math.max(1, at - 1)
        : e.key === 'Home' ? 1 : e.key === 'End' ? 5 : 0;
    if (!next) return;
    e.preventDefault();
    if (!pick) onChange(next);
    focusAt(next);
  };
  return (
    <div className={s.rate}>
      <div ref={ref} role={pick ? 'group' : 'radiogroup'} aria-label={label} className={s.rateRow} onKeyDown={onKey}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" data-star={n} disabled={disabled}
            {...(pick ? { 'aria-label': `${REVIEWS.starLabel(n)} — ${REVIEWS.stars[n - 1]}` }
              : { role: 'radio', 'aria-checked': value === n, 'aria-label': `${REVIEWS.starLabel(n)} — ${REVIEWS.stars[n - 1]}`, tabIndex: (value || 1) === n ? 0 : -1 })}
            className={`${s.rateBtn} ${n <= shown ? s.rateOn : ''}`}
            onPointerEnter={e => { if (e.pointerType === 'mouse') setHover(n); }} onPointerLeave={e => { if (e.pointerType === 'mouse') setHover(0); }}
            onClick={() => { setHover(0); onChange(n); }}>
            <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false"><path d={STAR_PATH} fill="currentColor" /></svg>
          </button>
        ))}
      </div>
      {caption && <span className={s.rateCaption} aria-live="polite">{shown ? REVIEWS.stars[shown - 1] : ''}</span>}
    </div>
  );
}
