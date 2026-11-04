'use client';
// MartVideoPlayer — видео товара на весь экран, как в TikTok: ролик заполняет экран целиком (cover, без чёрных полос; на
// компьютере — рамка 9:16 на затемнении), звук — тем же нажатием, что открыло плеер (не дал браузер — без звука, динамик
// перечёркнут), пауза по тапу. Поверх ролика снизу — товар по референсу владельца (ProductOverlay): компактная карточка
// с размером и «В корзину», над ней тонкая полоса прогресса, пузыри настоящих отзывов и колонка «В избранное», «Отзывы»
// (FEATURES.reviews, только у товара с опубликованными отзывами: лист со списком поверх видео, ролик на это время на паузе),
// «Поделиться». Закрыть: «Назад» слева сверху, крестик (desktop), Esc, свайп вниз, «назад» в браузере (useModal).
// Пробел и тап — пауза; Esc — только закрыть (где бы ни был фокус: на видео, кнопке, в карточке товара).
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Product, ProductVideo, Review } from '@/lib/types';
import { FEATURES } from '@/lib/config';
import { VIDEO } from '@/lib/copy';
import { isEscape, modalAbove, useModal } from '@/lib/hooks/useModal';
import { ReviewsSheet } from './reviews/ReviewsSheet';
import { ProductOverlay } from './product/ProductOverlay';
import { Chevron, Cross } from './ui/Cross';
import { Spinner } from './ui/Spinner';
import s from './MartVideoPlayer.module.css';

/** Свайп вниз длиннее — закрыть (как у сторис); короче — пружинит обратно. */
const SWIPE_CLOSE = 80;
/** Сдвиг, после которого касание — уже свайп, а не тап (пауза). */
const DRAG_START = 8;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface MartVideoPlayerProps {
  product: Product;
  video: ProductVideo;
  /** Размер и цвет, выбранные в карточке, — те же в карточке поверх видео. */
  variantId?: string | null;
  color?: string;
  mode?: 'desktop' | 'mobile';
  onClose?: () => void;
  qtyFor?: (key: string) => number;
  onQty?: (key: string, qty: number) => void;
  cartHref?: string;
  /** Витрина /kit: статичный кадр внутри родителя (position: relative) — без портала, модального слоя и звука.
   *  reviews — демо-отзывы: пузыри над карточкой; sheet — открытый лист отзывов поверх кадра. */
  preview?: { progress?: number; paused?: boolean; reviews?: Review[]; sheet?: boolean };
}

export function MartVideoPlayer({ product: p, video, variantId, color, mode = 'mobile', onClose, qtyFor, onQty, cartHref, preview }: MartVideoPlayerProps) {
  const desktop = mode === 'desktop';
  const isPreview = !!preview;
  const dialogRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(preview?.paused ?? false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(preview?.progress ?? 0);
  const [waiting, setWaiting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reviews, setReviews] = useState(!!preview?.sheet);
  const resume = useRef(false);
  const rated = FEATURES.reviews && !!p.rating?.count;
  const drag = useRef<{ x: number; y: number; dy: number; moved: boolean } | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  const close = () => { if (!isPreview) onCloseRef.current?.(); };

  // Звук: плеер монтируется синхронно в нажатии на миниатюру (flushSync у родителя) — play() внутри того же жеста.
  useLayoutEffect(() => {
    const v = videoRef.current;
    if (!v || isPreview) return;
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      v.play().catch(() => setPaused(true));
    });
  }, [isPreview]);

  // Ловушка фокуса, блокировка прокрутки, «назад» в браузере — общий слой. Фокус — на сам диалог: Пробел ставит паузу.
  useModal({ active: !isPreview, ref: dialogRef, onClose: close });

  const toggle = () => {
    const v = videoRef.current;
    if (!v || isPreview || failed) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  };
  // Отзывы поверх видео: ролик на паузе, после закрытия — продолжаем, если он шёл.
  const openReviews = () => {
    const v = videoRef.current;
    resume.current = !!v && !v.paused;
    v?.pause();
    setReviews(true);
  };
  const closeReviews = () => {
    setReviews(false);
    if (resume.current) videoRef.current?.play().catch(() => {});
    resume.current = false;
  };
  const toggleSound = () => {
    const v = videoRef.current;
    if (!v || isPreview) return;
    v.muted = !muted;
    setMuted(!muted);
    if (v.paused) v.play().catch(() => {});
  };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (modalAbove(dialogRef)) return; // поверх — лист отзывов или выбор способа: клавиши им
    // Esc — закрыть плеер, и только. Ловим раньше всех (фаза перехвата на window): после клика по видео или по кнопке
    // в карточке товара событие не должно попасть ни к ним, ни к видео (у браузера свои клавиши для медиа).
    if (isEscape(e)) { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key !== ' ') return;
    if ((e.target as HTMLElement | null)?.closest?.('button, a, input, select, textarea')) return; // Пробел на кнопке — её нажатие
    e.preventDefault();
    toggle();
  });
  useEffect(() => {
    if (isPreview) return;
    const h = (e: KeyboardEvent) => onKey(e);
    // Ушли на другую вкладку — пауза: звук в фоне не нужен.
    const onHidden = () => { if (document.hidden) videoRef.current?.pause(); };
    window.addEventListener('keydown', h, true);
    document.addEventListener('visibilitychange', onHidden);
    return () => { window.removeEventListener('keydown', h, true); document.removeEventListener('visibilitychange', onHidden); };
  }, [isPreview]);

  // Тап — пауза; свайп вниз — закрыть: рамка едет за пальцем и уходит вниз.
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, dy: 0, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current, frame = frameRef.current;
    if (!d || !frame) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_START) return;
    d.moved = true;
    d.dy = Math.max(0, dy);
    frame.style.transform = `translateY(${d.dy}px)`;
  };
  const onUp = () => {
    const d = drag.current, frame = frameRef.current;
    drag.current = null;
    if (!d || !frame) return;
    if (!d.moved) {
      toggle();
      // Фокус — обратно на диалог: клавиши (Пробел, Esc) — плееру, а не тому, что было в фокусе до тапа.
      if (!dialogRef.current?.contains(document.activeElement) || document.activeElement === videoRef.current) dialogRef.current?.focus({ preventScroll: true });
      return;
    }
    const from = frame.style.transform;
    frame.style.transform = '';
    if (d.dy > SWIPE_CLOSE) {
      if (reducedMotion()) close();
      else frame.animate([{ transform: from }, { transform: 'translateY(100%)', opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished.then(close, close);
    } else if (from && !reducedMotion()) {
      frame.animate([{ transform: from }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  };
  const onCancel = () => {
    drag.current = null;
    if (frameRef.current) frameRef.current.style.transform = '';
  };

  const view = (
    <div ref={dialogRef} role="dialog" aria-modal={isPreview ? undefined : true} aria-label={VIDEO.player(p.name)} tabIndex={-1}
      className={[s.overlay, desktop ? s.desktop : s.mobile, isPreview && s.inline].filter(Boolean).join(' ')}
      onClick={e => { if (desktop && e.target === e.currentTarget) close(); }}
      inert={isPreview || undefined} aria-hidden={isPreview || undefined}>
      <div ref={frameRef} className={s.frame}>
        <div className={s.stage}>
          <video ref={videoRef} className={s.media} src={isPreview ? undefined : video.src} poster={video.poster} playsInline loop preload="auto"
            disablePictureInPicture tabIndex={-1} aria-hidden
            onPlay={() => setPaused(false)} onPause={() => setPaused(true)} onWaiting={() => setWaiting(true)} onPlaying={() => setWaiting(false)}
            onTimeUpdate={e => { const v = e.currentTarget; if (v.duration > 0) setProgress(v.currentTime / v.duration); }}
            onError={() => setFailed(true)} />
          <div className={s.tap} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} aria-hidden />
          {failed ? <span className={s.note}>{VIDEO.failed}</span>
            : waiting && !paused ? <span className={s.center} aria-hidden><Spinner size={28} /></span>
              : paused && <span className={s.center} aria-hidden><span className={s.playIco} /></span>}
        </div>
        <div className={s.top}>
          <button type="button" className={s.round} onClick={close} aria-label={VIDEO.back}>
            <Chevron size={9} color="var(--ink-1)" direction="left" />
          </button>
          <div className={s.topRight}>
            <button type="button" className={s.round} onClick={toggle} aria-label={paused ? VIDEO.play : VIDEO.pause} aria-pressed={paused}>
              {paused ? <span className={s.playSm} aria-hidden /> : <span className={s.pauseSm} aria-hidden><span /><span /></span>}
            </button>
            <button type="button" className={s.round} onClick={toggleSound} aria-label={muted ? VIDEO.soundOn : VIDEO.soundOff} aria-pressed={!muted}>
              <SoundIcon muted={muted} />
            </button>
          </div>
        </div>
        <ProductOverlay product={p} variantId={variantId} color={color} mobile={!desktop} progress={progress}
          onReviews={rated ? openReviews : undefined} reviewsOpen={reviews} qtyFor={qtyFor} onQty={onQty} cartHref={cartHref}
          demoReviews={preview?.reviews} className={s.bottom} />
        {rated && <ReviewsSheet open={reviews} product={p} onClose={closeReviews} contained={isPreview} initial={preview?.reviews} />}
      </div>
      {desktop && (
        <button type="button" className={`${s.round} ${s.closeD}`} onClick={close} aria-label={VIDEO.close}>
          <Cross size={14} color="var(--ink-1)" />
        </button>
      )}
    </div>
  );

  return isPreview ? view : createPortal(view, document.body);
}

/** Динамик: со звуком — волны, без звука — крест (как в сторис). */
function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="var(--ink-1)" />
      {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />}
    </svg>
  );
}
