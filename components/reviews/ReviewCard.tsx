'use client';
// Один отзыв: подпись («Айгерим К.» / «Покупатель»), дата, звёзды, купленный размер, текст (длинный — свёрнут
// до 6 строк, в HTML целиком), фото 72 (нажатие — на весь экран), ответ магазина. Текст — обычным текстом:
// React экранирует, ссылок из него не делаем, переносы строк сохраняются.
import { useLayoutEffect, useRef, useState } from 'react';
import { REVIEWS } from '@/lib/copy';
import type { Review } from '@/lib/types';
import { Img } from '../ui/Img';
import { Chevron } from '../ui/Cross';
import { PhotoViewer } from './PhotoViewer';
import { Stars } from './Stars';
import s from '../MartReviews.module.css';
import pv from '../MartProductView.module.css';

export function ReviewCard({ review: r }: { review: Review }) {
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Свёрнут ли текст на самом деле — меряем после раскладки (ширина колонки разная) и при её изменении.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || open) return;
    const check = () => setLong(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, r.text]);

  return (
    <li className={s.item}>
      <div className={s.itemHead}>
        <b className={s.author}>{r.author}</b>
        <span className={s.date}>{r.date}</span>
      </div>
      <div className={s.itemMeta}>
        <Stars value={r.rating} size={14} label={REVIEWS.score(String(r.rating))} />
        {r.variant && <span className={s.variant}>{REVIEWS.variant(r.variant)}</span>}
      </div>
      {r.text && <p ref={textRef} className={`${s.text} ${open ? '' : s.textClamp}`}>{r.text}</p>}
      {r.text && (long || open) && (
        <button type="button" className={`${pv.more} ${pv.more36}`} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? REVIEWS.collapse : REVIEWS.readMore}<Chevron color="var(--primary)" direction={open ? 'up' : 'down'} />
        </button>
      )}
      {r.photos.length > 0 && (
        <div className={s.photos}>
          {r.photos.map((p, i) => (
            <button key={p.thumb} type="button" className={s.photoBtn} onClick={() => setPhoto(i)} aria-label={REVIEWS.photoOpen(i + 1, r.photos.length)}>
              <Img src={p.thumb} w={72} h={72} className={s.photoImg} quality={60} />
            </button>
          ))}
        </div>
      )}
      {r.reply && (
        <div className={s.reply}>
          <div className={s.replyHead}>
            <span className={s.replyTitle}>{REVIEWS.reply}</span>
            <span className={s.date}>{r.reply.date}</span>
          </div>
          <p className={s.replyText}>{r.reply.text}</p>
        </div>
      )}
      {photo !== null && <PhotoViewer photos={r.photos} start={photo} author={r.author} onClose={() => setPhoto(null)} />}
    </li>
  );
}
