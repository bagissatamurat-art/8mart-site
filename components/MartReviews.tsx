'use client';
// MartReviews — отзывы о товаре: средняя, число, отзывы (сначала с текстом и фото — так отдаёт API), «Показать ещё».
// В карточке товара (страница и быстрый просмотр) и в листе поверх видео. Страница товара отдаёт первую страницу
// в серверном HTML (initial); быстрый просмотр и плеер грузят её сами. Только опубликованные — их отдаёт API;
// у товара без отзывов блока нет вовсе (решает родитель по product.rating).
import { useCallback, useEffect, useId, useState, type Ref } from 'react';
import { getProductReviews } from '@/lib/api';
import { REVIEWS } from '@/lib/copy';
import type { Review, ReviewSummary } from '@/lib/types';
import { Chevron } from './ui/Cross';
import { Skeleton, Spinner } from './ui/Spinner';
import { ReviewCard } from './reviews/ReviewCard';
import { ratingText, Stars } from './reviews/Stars';
import s from './MartReviews.module.css';
import pv from './MartProductView.module.css';

export interface MartReviewsProps {
  productId: string;
  rating: ReviewSummary;
  /** Первая страница с сервера (страница товара): отзывы — в HTML, без запроса из браузера. */
  initial?: Review[];
  /** Заголовок «Отзывы» — нет в листе поверх видео (там он в шапке листа). */
  title?: boolean;
  /** id блока — для ссылки у названия товара. */
  id?: string;
  /** Заголовок блока — к нему ведёт ссылка у названия (фокус для скринридера). */
  headingRef?: Ref<HTMLHeadingElement>;
}

export function MartReviews({ productId, rating, initial, title = true, id, headingRef }: MartReviewsProps) {
  const headId = useId();
  const [items, setItems] = useState<Review[] | null>(initial ?? null);
  const [summary, setSummary] = useState(rating);
  const [page, setPage] = useState(initial ? 1 : 0);
  const [loading, setLoading] = useState(!initial);
  const [failed, setFailed] = useState(false);
  const [end, setEnd] = useState(false);

  const load = useCallback(async (next: number) => {
    setLoading(true);
    setFailed(false);
    try {
      const r = await getProductReviews(productId, next);
      setItems(prev => {
        const have = next === 1 ? [] : prev ?? [];
        return [...have, ...r.items.filter(x => !have.some(y => y.id === x.id))];
      });
      if (r.rating) setSummary(r.rating);
      // Пустая страница — отзывов больше нет (их сняли с публикации, пока покупатель листал).
      if (!r.items.length) setEnd(true);
      setPage(next);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { if (!initial) void load(1); }, [initial, load]);

  const shown = items?.length ?? 0;
  const left = end ? 0 : Math.max(0, summary.count - shown);
  const avg = ratingText(summary.avg);

  return (
    <section className={s.block} id={id} aria-labelledby={title ? headId : undefined} aria-label={title ? undefined : REVIEWS.title}>
      {title && <h2 id={headId} ref={headingRef} tabIndex={-1} className={s.title}>{REVIEWS.title}</h2>}
      <div className={s.summary}>
        <b className={s.avg} aria-hidden>{avg}</b>
        <Stars value={summary.avg} size={18} />
        <span className={s.countNote}><span className="visually-hidden">{REVIEWS.score(avg)}, </span>{REVIEWS.count(summary.count)}</span>
      </div>

      {items === null ? (
        failed ? <Retry onRetry={() => void load(1)} /> : <ReviewsSkeleton />
      ) : (
        <>
          <ul className={s.list}>{items.map(r => <ReviewCard key={r.id} review={r} />)}</ul>
          {(left > 0 || failed) && (
            <div className={s.foot}>
              {failed ? <Retry onRetry={() => void load(page + 1)} />
                : (
                  <button type="button" className={`${pv.more} ${pv.more44}`} disabled={loading} aria-busy={loading || undefined} onClick={() => void load(page + 1)}>
                    {REVIEWS.more(left)}{loading ? <Spinner size={16} variant="track" /> : <Chevron color="var(--primary)" />}
                  </button>
                )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Retry({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={s.foot} role="alert">
      <span className={s.error}>{REVIEWS.loadError}</span>
      <button type="button" className={s.retry} onClick={onRetry}>{REVIEWS.retry}</button>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div aria-busy="true">
      {[0, 1].map(i => (
        <div key={i} className={s.skel}>
          <Skeleton w="40%" h={16} />
          <Skeleton w={90} h={14} />
          <Skeleton h={14} />
          <Skeleton w="70%" h={14} />
        </div>
      ))}
    </div>
  );
}

/** Средняя у названия товара: «★★★★★ 4,8 · 23 отзыва» — нажатие ведёт к блоку отзывов. */
export function RatingLink({ rating, onClick }: { rating: ReviewSummary; onClick: () => void }) {
  const avg = ratingText(rating.avg);
  return (
    <button type="button" className={s.ratingLink} onClick={onClick} aria-label={REVIEWS.toList(avg, rating.count)}>
      <Stars value={rating.avg} size={16} />
      <span className={s.ratingAvg}>{avg}</span>
      <span className={s.ratingCount}>· {REVIEWS.count(rating.count)}</span>
    </button>
  );
}
