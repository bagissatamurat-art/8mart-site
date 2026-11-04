'use client';
// ReviewBubbles — над карточкой товара в плеере видео и сторис (решение владельца 04.11): по одному всплывают начала
// настоящих опубликованных отзывов — инициал автора и «Купил(а): …» — и плашка «N отзывов» (нажатие — лист отзывов).
// Только из API отзывов (GET /products/{id}/reviews, первая страница): нет отзывов — нет ни пузырей, ни плашки;
// отзывы без текста пузырём не становятся. Пузыри для глаз (aria-hidden): весь список доступен по плашке и кнопке «Отзывы».
// «Уменьшить движение» — без всплытия, отзывы просто сменяют друг друга.
import { useEffect, useState } from 'react';
import { getProductReviews } from '@/lib/api';
import { FEATURES, REVIEW_BUBBLES } from '@/lib/config';
import { REVIEWS } from '@/lib/copy';
import { authorInitial, bubbleReviews, reviewSnippet } from '@/lib/reviewBubbles';
import type { Product, Review } from '@/lib/types';
import { STAR_PATH } from '../reviews/Stars';
import s from './ProductOverlay.module.css';

export function ReviewBubbles({ product: p, onOpen, hidden, initial, fetch = true }: {
  product: Product;
  /** Плашка «N отзывов» — открыть лист отзывов. */
  onOpen?: () => void;
  /** Лист отзывов открыт поверх — пузыри не нужны. */
  hidden?: boolean;
  /** Витрина: готовые (демо) отзывы вместо запроса. */
  initial?: Review[];
  /** false — отзывы не запрашивать (соседняя сторис в ленте). */
  fetch?: boolean;
}) {
  const count = FEATURES.reviews ? p.rating?.count ?? 0 : 0;
  const [items, setItems] = useState<Review[]>(() => bubbleReviews(initial ?? []));
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    if (!count || initial || !fetch) return;
    let alive = true;
    getProductReviews(p.id).then(r => { if (alive) { setItems(bubbleReviews(r.items)); setI(0); } }, () => { /* без пузырей */ });
    return () => { alive = false; };
  }, [p.id, count, initial, fetch]);

  // Один висит showMs, исчезает, через gapMs — следующий. Один отзыв — просто стоит.
  useEffect(() => {
    if (items.length < 2 || hidden) return;
    const t = setTimeout(() => {
      if (shown) setShown(false);
      else { setI(x => (x + 1) % items.length); setShown(true); }
    }, shown ? REVIEW_BUBBLES.showMs : REVIEW_BUBBLES.gapMs);
    return () => clearTimeout(t);
  }, [items.length, shown, hidden]);

  if (!count) return null;
  const r = items[i % Math.max(1, items.length)];
  return (
    <div className={s.bubbles}>
      {r && shown && !hidden && (
        <div key={`${r.id}-${i}`} className={s.bubble} aria-hidden>
          <span className={s.bubbleAvatar}>{authorInitial(r.author)}</span>
          <span className={s.bubbleText}>{REVIEWS.bubble(reviewSnippet(r.text, REVIEW_BUBBLES.words, REVIEW_BUBBLES.maxChars))}</span>
        </div>
      )}
      <button type="button" className={s.pill} onClick={onOpen} disabled={!onOpen} aria-haspopup="dialog" aria-label={REVIEWS.open(count)}>
        <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden focusable="false"><path d={STAR_PATH} fill="var(--star)" /></svg>
        <span>{REVIEWS.count(count)}</span>
      </button>
    </div>
  );
}
