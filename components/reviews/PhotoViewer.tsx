'use client';
// Фото отзыва на весь экран: тёмный фон, фото целиком; стрелки, ←→ и свайп вбок — между фото этого отзыва.
// Закрыть: крестик, Esc, клик по фону, «назад» в браузере (useModal). Поверх быстрого просмотра и плеера видео.
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { REVIEWS } from '@/lib/copy';
import { modalAbove, useModal } from '@/lib/hooks/useModal';
import type { ReviewPhoto } from '@/lib/types';
import { Img } from '../ui/Img';
import { Chevron, Cross } from '../ui/Cross';
import s from '../MartReviews.module.css';

/** Свайп вбок длиннее — соседнее фото (как у сторис). */
const SWIPE = 50;

export function PhotoViewer({ photos, start = 0, author, onClose }: { photos: ReviewPhoto[]; start?: number; author: string; onClose: () => void }) {
  const [i, setI] = useState(start);
  const ref = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const n = photos.length;
  useModal({ active: true, ref, onClose });
  const go = (d: number) => setI(x => (x + d + n) % n);
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (n < 2 || modalAbove(ref)) return;
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const p = photos[i];
  if (!p) return null;
  const label = REVIEWS.photo(author, i + 1, n);
  return createPortal(
    <div ref={ref} className={s.viewer} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const x0 = touchX.current;
        touchX.current = null;
        if (x0 === null || n < 2) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > SWIPE) go(dx < 0 ? 1 : -1);
      }}>
      <div className={s.viewerStage} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <Img key={p.src} src={p.src} alt={label} fill sizes="(max-width: 1023px) 100vw, 960px" className={s.viewerImg} eager />
      </div>
      <button type="button" className={`${s.round} ${s.viewerClose}`} onClick={onClose} aria-label={REVIEWS.photoClose}>
        <Cross size={14} color="var(--ink-1)" />
      </button>
      {n > 1 && <>
        <button type="button" className={`${s.round} ${s.viewerPrev}`} onClick={() => go(-1)} aria-label={REVIEWS.photoPrev}>
          <Chevron size={9} color="var(--ink-1)" direction="left" />
        </button>
        <button type="button" className={`${s.round} ${s.viewerNext}`} onClick={() => go(1)} aria-label={REVIEWS.photoNext}>
          <Chevron size={9} color="var(--ink-1)" direction="right" />
        </button>
        <span className={s.viewerCount} aria-live="polite">{i + 1} / {n}</span>
      </>}
    </div>,
    document.body,
  );
}
