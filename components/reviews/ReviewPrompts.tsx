'use client';
// «Оцените букет» — полученные товары заказа (Order.reviews). Без отзыва — звёзды: нажатие открывает форму с этой
// оценкой. С отзывом — «Ваш отзыв»: оценка, статус проверки, причина отказа, ответ магазина.
// compact — в «Моих заказах»: только неоценённые и те, что оценили сейчас («Спасибо…»).
import { useState } from 'react';
import { REVIEWS } from '@/lib/copy';
import type { MyReview, OrderReviewItem, ReviewDraft } from '@/lib/types';
import { Img } from '../ui/Img';
import { ReviewForm } from './ReviewForm';
import { Stars } from './Stars';
import { StarsInput } from './StarsInput';
import s from '../MartReviews.module.css';

export interface ReviewPromptsProps {
  orderId: string;
  items: OrderReviewItem[];
  mobile: boolean;
  compact?: boolean;
  /** Отзыв отправлен — родитель обновляет заказ у себя. */
  onReviewed?: (product: string, review: MyReview) => void;
  /** Витрина: форма внутри рамки, без отправки. */
  demoForm?: { product: string; rating: number };
  /** Витрина: отправка без сети (по умолчанию — createReview). */
  send?: (orderId: string, d: ReviewDraft) => Promise<MyReview>;
}

export function ReviewPrompts({ orderId, items, mobile, compact, onReviewed, demoForm, send }: ReviewPromptsProps) {
  const [form, setForm] = useState<{ item: OrderReviewItem; rating: number } | null>(null);
  const [sent, setSent] = useState<Record<string, MyReview>>({});
  const list = items.map(it => (sent[it.product] ? { ...it, review: sent[it.product] } : it)).filter(it => !compact || !it.review || sent[it.product]);
  const demo = demoForm && items.find(it => it.product === demoForm.product);
  if (!list.length) return null;
  return (
    <div className={`${s.prompts} ${compact ? s.compact : ''}`}>
      {list.map(it => (
        <div key={it.product} className={s.prompt}>
          {it.img ? <Img src={it.img} w={56} h={56} className={s.promptThumb} /> : <span className={s.promptThumb} aria-hidden />}
          {it.review
            ? <Mine item={it} review={it.review} justSent={!!sent[it.product]} />
            : (
              <div className={s.promptBody}>
                <b className={s.promptTitle}>{REVIEWS.rate(it.delivery === 'flowers')}</b>
                <span className={s.promptName}>{it.name}</span>
                <div className={s.promptStars}>
                  <StarsInput pick value={0} size={28} label={`${REVIEWS.rate(it.delivery === 'flowers')}: ${it.name}`} onChange={n => setForm({ item: it, rating: n })} />
                </div>
              </div>
            )}
        </div>
      ))}
      {form && (
        <ReviewForm key={form.item.product} orderId={orderId} item={form.item} rating={form.rating} mode={mobile ? 'mobile' : 'desktop'} send={send}
          onClose={() => setForm(null)}
          onDone={r => {
            const product = form.item.product;
            setSent(x => ({ ...x, [product]: r }));
            setForm(null);
            onReviewed?.(product, r);
          }} />
      )}
      {demo && <ReviewForm orderId={orderId} item={demo} rating={demoForm!.rating} mode={mobile ? 'mobile' : 'desktop'} contained onClose={() => {}} onDone={() => {}} />}
    </div>
  );
}

function Mine({ item, review: r, justSent }: { item: OrderReviewItem; review: MyReview; justSent: boolean }) {
  return (
    <div className={s.promptBody}>
      <div className={s.promptTop}>
        <b className={s.promptTitle}>{REVIEWS.yours}</b>
        <span className={`${s.status} ${s[`status_${r.status}`]}`}>{REVIEWS.status[r.status]}</span>
      </div>
      <span className={s.promptName}>{item.name}</span>
      <div className={s.itemMeta}>
        <Stars value={r.rating} size={14} label={REVIEWS.score(String(r.rating))} />
        <span className={s.date}>{r.date}</span>
      </div>
      {r.text && <p className={s.promptText}>{r.text}</p>}
      {justSent && r.status === 'pending' && <p className={`${s.promptNote} ${s.thanks}`} role="status">{REVIEWS.sent}</p>}
      {r.status === 'rejected' && r.rejectReason && <p className={`${s.promptNote} ${s.rejected}`}>{REVIEWS.rejected(r.rejectReason)}</p>}
      {r.reply && (
        <div className={s.reply}>
          <div className={s.replyHead}>
            <span className={s.replyTitle}>{REVIEWS.reply}</span>
            <span className={s.date}>{r.reply.date}</span>
          </div>
          <p className={s.replyText}>{r.reply.text}</p>
        </div>
      )}
    </div>
  );
}
