'use client';
// Отзывы поверх видео товара: лист снизу внутри рамки плеера (MartSheet inside) — тот же список, что в карточке товара.
// Закрыть: крестик, Esc, свайп вниз, клик по затемнению. Видео на это время на паузе (решает плеер).
import { useId } from 'react';
import { REVIEWS } from '@/lib/copy';
import type { Product, Review } from '@/lib/types';
import { MartSheet } from '../MartSheet';
import { MartReviews } from '../MartReviews';
import { Cross } from '../ui/Cross';
import s from '../MartReviews.module.css';

export function ReviewsSheet({ open, product, onClose, contained, initial }: {
  open: boolean; product: Product; onClose: () => void;
  /** Витрина: статичный лист внутри рамки, без модального слоя. */
  contained?: boolean;
  /** Витрина: готовые (демо) отзывы вместо запроса. */
  initial?: Review[];
}) {
  const titleId = useId();
  if (!product.rating?.count) return null;
  return (
    <MartSheet open={open} onClose={onClose} inside={!contained} contained={contained} labelledBy={titleId} maxHeight="86%" gap={12} handle
      className={s.sheetPanel}>
      <div className={s.sheetHead}>
        <h2 id={titleId} className={s.sheetTitle}>{REVIEWS.title}</h2>
        <button type="button" className={s.sheetClose} onClick={onClose} aria-label={REVIEWS.sheetClose}>
          <Cross size={14} color="var(--ink-1)" />
        </button>
      </div>
      <MartReviews productId={product.id} rating={product.rating} title={false} initial={initial} />
    </MartSheet>
  );
}
