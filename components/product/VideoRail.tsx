'use client';
// VideoRail — колонка справа над карточкой товара в плеере видео и сторис (референс владельца 04.11): белые иконки без
// подложек, подпись или счётчик под ними, лёгкая тень для читаемости на любом кадре. «В избранное», «Отзывы» с числом
// (FEATURES.reviews, только у товара с опубликованными отзывами — открывает лист со списком) и «Поделиться»
// (mobile — системное меню, иначе ссылка в буфер).
import { useEffect, useRef, useState } from 'react';
import type { Product } from '@/lib/types';
import { FEATURES } from '@/lib/config';
import { REVIEWS, STATUS, VIDEO } from '@/lib/copy';
import { setFavorite, useIsFavorite } from '@/lib/store/favorites';
import { HeartIcon } from '../ui/HeartIcon';
import { shareProduct, ShareIcon } from './share';
import s from './ProductOverlay.module.css';

export function VideoRail({ product: p, mobile, onReviews, className }: {
  product: Product; mobile: boolean; onReviews?: () => void; className?: string;
}) {
  const fav = useIsFavorite(p.id);
  const count = FEATURES.reviews ? p.rating?.count ?? 0 : 0;
  const [shared, setShared] = useState(false);
  const shareT = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(shareT.current), []);
  const share = () => {
    shareProduct(p, mobile).then(copied => {
      if (!copied) return;
      clearTimeout(shareT.current);
      setShared(true);
      shareT.current = setTimeout(() => setShared(false), 1800);
    });
  };
  return (
    <div className={[s.rail, className].filter(Boolean).join(' ')}>
      <button type="button" className={s.railBtn} onClick={() => setFavorite(p.id, !fav)} aria-pressed={fav} aria-label={fav ? 'Убрать из избранного' : VIDEO.fav}>
        <span className={s.railIcon}><HeartIcon on={fav} size={30} onDark /></span>
        <span className={s.railLabel} aria-hidden>{fav ? VIDEO.favOn : VIDEO.fav}</span>
      </button>
      {count > 0 && onReviews && (
        <button type="button" className={s.railBtn} onClick={onReviews} aria-haspopup="dialog" aria-label={REVIEWS.open(count)}>
          <span className={s.railIcon}><ReviewsIcon /></span>
          <span className={s.railLabel} aria-hidden>{count}</span>
        </button>
      )}
      <button type="button" className={s.railBtn} onClick={share} aria-label={shared ? STATUS.linkCopied : VIDEO.share}>
        <span className={`${s.railIcon} ${shared ? s.railDone : ''}`}><ShareIcon size={28} /></span>
        <span className={s.railLabel} aria-live="polite">{shared ? STATUS.linkCopied : VIDEO.share}</span>
      </button>
    </div>
  );
}

/** Облачко с текстом — «Отзывы», цветом текста. */
function ReviewsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 18.5 3.5 21l.5-4A8 8 0 1 1 7.5 19.5Z" />
      <path d="M8.5 10.5h7M8.5 14h4.5" />
    </svg>
  );
}
