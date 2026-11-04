'use client';
// Форма отзыва о полученном товаре: оценка (обязательна), текст до 1000 (можно без него — тогда только оценка),
// до 3 фото (уменьшаются на телефоне, координаты съёмки не уходят). Desktop — окно 520 по центру, mobile — лист снизу.
// Закрыть: крестик, Esc, клик по фону; пока отправляем — нельзя. Отзыв уходит на проверку (createReview).
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ApiError, createReview } from '@/lib/api';
import { REVIEW_RULES } from '@/lib/config';
import { REVIEWS } from '@/lib/copy';
import { useModal } from '@/lib/hooks/useModal';
import { isPhoto, shrinkPhoto } from '@/lib/photo';
import type { MyReview, OrderReviewItem, ReviewDraft } from '@/lib/types';
import { MartButton } from '../MartButton';
import { MartInput } from '../MartInput';
import { MartSheet } from '../MartSheet';
import { Alert } from '../ui/Alert';
import { Cross } from '../ui/Cross';
import { Img } from '../ui/Img';
import { StarsInput } from './StarsInput';
import s from '../MartReviews.module.css';

export interface ReviewFormProps {
  orderId: string;
  item: OrderReviewItem;
  /** Оценка, с которой открыли (нажатая звезда в «Оцените букет»); 0 — не выбрана. */
  rating?: number;
  mode: 'desktop' | 'mobile';
  onClose: () => void;
  onDone: (review: MyReview) => void;
  /** Витрина: внутри рамки, без модального слоя и отправки. */
  contained?: boolean;
  /** Отправка; по умолчанию — createReview (API или мок). Витрина подставляет свою, без сети. */
  send?: (orderId: string, d: ReviewDraft) => Promise<MyReview>;
}

type Picked = { blob: Blob; url: string };
const MB = 1024 * 1024;

export function ReviewForm({ orderId, item, rating: start = 0, mode, onClose, onDone, contained, send = createReview }: ReviewFormProps) {
  const mobile = mode === 'mobile';
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [rating, setRating] = useState(start);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [preparing, setPreparing] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flowers = item.delivery === 'flowers';

  // Превью фото — blob:-ссылки: освобождаем при закрытии формы.
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach(u => URL.revokeObjectURL(u)), []);

  const close = () => { if (!busy) onClose(); };
  // Окно desktop: Esc, фокус на выбранную звезду (или первую), ловушка Tab. Лист mobile делает это сам (MartSheet).
  useModal({
    active: !mobile && !contained, ref: boxRef, onClose: close,
    initialFocus: () => boxRef.current?.querySelector<HTMLElement>('[data-star][tabindex="0"]'),
  });

  const add = async (list: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    const files = [...list];
    const room = REVIEW_RULES.photosMax - photos.length - preparing;
    if (files.length > room) setError(REVIEWS.photosMax(REVIEW_RULES.photosMax));
    for (const f of files.slice(0, Math.max(0, room))) {
      if (!isPhoto(f)) { setError(REVIEWS.photoType); continue; }
      setPreparing(n => n + 1);
      const blob = await shrinkPhoto(f);
      setPreparing(n => n - 1);
      if (blob.size > REVIEW_RULES.photoMaxMb * MB) { setError(REVIEWS.photoTooBig(REVIEW_RULES.photoMaxMb)); continue; }
      const url = URL.createObjectURL(blob);
      urls.current.push(url);
      setPhotos(p => (p.length < REVIEW_RULES.photosMax ? [...p, { blob, url }] : p));
    }
  };
  const remove = (i: number) => setPhotos(p => p.filter((_, j) => j !== i));

  const submit = async () => {
    if (!rating || busy || preparing) return;
    if (contained) return;
    setBusy(true);
    setError(null);
    try {
      onDone(await send(orderId, { product: item.product, rating, text: text.trim(), photos: photos.map(p => p.blob) }));
    } catch (e) {
      setError(e instanceof ApiError && e.message ? e.message : REVIEWS.failed);
    } finally {
      setBusy(false);
    }
  };

  const left = REVIEW_RULES.textMax - text.length;
  const body = (
    <div className={s.form}>
      <div className={s.formHead}>
        {item.img ? <Img src={item.img} w={56} h={56} className={s.formThumb} /> : <span className={s.formThumb} aria-hidden />}
        <div className={s.formHeadText}>
          <h2 id={titleId} className={s.formTitle}>{REVIEWS.formTitle(flowers)}</h2>
          <span className={s.formName}>{item.name}</span>
        </div>
      </div>

      <StarsInput value={rating} onChange={n => { setRating(n); setError(null); }} label={REVIEWS.formTitle(flowers)} disabled={busy} />

      <MartInput type="textarea" label={REVIEWS.textLabel(flowers)} value={text} maxLength={REVIEW_RULES.textMax} disabled={busy}
        onChange={setText} hint={left <= 100 ? REVIEWS.textLeft(left) : REVIEWS.textHint} />

      <div className={s.formSection}>
        <div className={s.pick}>
          {photos.map((p, i) => (
            <div key={p.url} className={s.pickItem}>
              <img src={p.url} alt="" className={s.pickImg} />
              <button type="button" className={s.pickRemove} onClick={() => remove(i)} aria-label={REVIEWS.removePhoto(i + 1)} disabled={busy}>
                <Cross size={10} color="var(--ink-1)" />
              </button>
            </div>
          ))}
          {photos.length + preparing < REVIEW_RULES.photosMax && (
            <label className={`${s.pickAdd} ${preparing ? s.pickBusy : ''}`}>
              <span className={s.plus} aria-hidden />
              <span aria-hidden>{REVIEWS.addPhoto}</span>
              <input type="file" accept="image/*" multiple className="visually-hidden" disabled={busy}
                aria-label={REVIEWS.addPhotoLabel(REVIEW_RULES.photosMax)}
                onChange={e => { void add(e.target.files); e.target.value = ''; }} />
            </label>
          )}
          {Array.from({ length: preparing }, (_, i) => <span key={`p${i}`} className={s.pickItem} aria-hidden />)}
        </div>
        <p className={s.hint}>{REVIEWS.photosHint(REVIEW_RULES.photosMax)}</p>
      </div>

      <p className={s.hint}>{REVIEWS.note}</p>
      {error && <Alert>{error}</Alert>}
      <div className={s.formFoot}>
        <MartButton label={REVIEWS.submit} size={56} full loading={busy} disabled={!rating || preparing > 0}
          reason={!rating ? REVIEWS.chooseRating : undefined} onClick={submit} />
        {!rating && <p className={s.reason}>{REVIEWS.chooseRating}</p>}
      </div>
    </div>
  );

  if (mobile) {
    return (
      <MartSheet open onClose={close} labelledBy={titleId} maxHeight="94%" gap={0} contained={contained} className={s.formSheet}>
        <button type="button" className={`${s.formClose} ${s.formCloseM}`} onClick={close} aria-label={REVIEWS.formClose} disabled={busy}>
          <Cross size={14} color="var(--ink-1)" />
        </button>
        {body}
      </MartSheet>
    );
  }
  const dialog = (
    <div className={`${s.formOverlay} ${contained ? s.inline : ''}`} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div ref={boxRef} role="dialog" aria-modal={contained ? undefined : true} aria-labelledby={titleId} tabIndex={-1} className={s.formBox}>
        <button type="button" className={s.formClose} onClick={close} aria-label={REVIEWS.formClose} disabled={busy}>
          <Cross size={14} color="var(--ink-1)" />
        </button>
        {body}
      </div>
    </div>
  );
  return contained || typeof document === 'undefined' ? dialog : createPortal(dialog, document.body);
}
