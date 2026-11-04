'use client';
// ProductOverlay — товар поверх видео (MartVideoPlayer) и сторис с товаром (MartStories), по референсу владельца 04.11
// (экран видео товара Pinduoduo): снизу компактная карточка (MartProductStrip) с отступами от краёв, над ней — тонкая
// полоса прогресса ролика (в сторис прогресс — полосы сверху), выше слева — пузыри настоящих отзывов и плашка «N отзывов»
// (ReviewBubbles), справа — колонка белых иконок (VideoRail). Пустые места пропускают касания к видео: тап — пауза, свайп.
import type { Product, Review } from '@/lib/types';
import { VIDEO } from '@/lib/copy';
import { MartProductStrip } from '../MartProductStrip';
import { ReviewBubbles } from './ReviewBubbles';
import { VideoRail } from './VideoRail';
import s from './ProductOverlay.module.css';

export interface ProductOverlayProps {
  product: Product;
  /** Размер и цвет, выбранные в карточке, — те же в карточке поверх видео. */
  variantId?: string | null;
  color?: string;
  mobile: boolean;
  /** Прогресс ролика 0…1 — полоса над карточкой; не задан — без неё. */
  progress?: number;
  /** Открыть лист отзывов (у товара с опубликованными отзывами). */
  onReviews?: () => void;
  /** Лист отзывов открыт — пузыри спрятаны. */
  reviewsOpen?: boolean;
  /** Фото и название — ссылка на страницу товара (сторис). */
  link?: boolean;
  qtyFor?: (key: string) => number;
  onQty?: (key: string, qty: number) => void;
  cartHref?: string;
  /** Витрина: демо-отзывы для пузырей вместо запроса. */
  demoReviews?: Review[];
  /** false — без пузырей и запроса отзывов (соседняя сторис в ленте при свайпе): только плашка «N отзывов». */
  bubbles?: boolean;
  className?: string;
}

export function ProductOverlay({
  product, variantId, color, mobile, progress, onReviews, reviewsOpen, link, qtyFor, onQty, cartHref, demoReviews, bubbles = true, className,
}: ProductOverlayProps) {
  const pct = progress === undefined ? null : Math.min(100, Math.max(0, progress * 100));
  return (
    <div className={[s.root, className].filter(Boolean).join(' ')}>
      <div className={s.above}>
        <ReviewBubbles product={product} onOpen={onReviews} hidden={reviewsOpen || !bubbles} initial={demoReviews} fetch={bubbles} />
        <VideoRail product={product} mobile={mobile} onReviews={onReviews} />
      </div>
      {pct !== null && (
        <div className={s.progress} role="progressbar" aria-label={VIDEO.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <span className={s.progressFill} style={{ width: `${pct}%` }} />
        </div>
      )}
      <MartProductStrip product={product} variantId={variantId} color={color} link={link} qtyFor={qtyFor} onQty={onQty} cartHref={cartHref} className={s.card} />
    </div>
  );
}
