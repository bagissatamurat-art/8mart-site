'use client';
// MartVideoPlayer — видео товара на весь экран, как в TikTok: тёмный фон, ролик со звуком (запуск — тем же нажатием,
// что открыло плеер; не дал браузер — без звука, динамик перечёркнут), пауза по тапу, полоса прогресса. Справа —
// «В избранное», «Отзывы» (FEATURES.reviews) и «Поделиться», снизу — блок товара с размером и «В корзину».
// Desktop — вертикальная рамка 400 по центру поверх затемнения; mobile — весь экран.
// Закрыть: «Назад» слева сверху, крестик (desktop), Esc, свайп вниз, «назад» в браузере (useModal). Пробел — пауза.
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Product, ProductVideo } from '@/lib/types';
import { FEATURES } from '@/lib/config';
import { STATUS, VIDEO } from '@/lib/copy';
import { modalAbove, useModal } from '@/lib/hooks/useModal';
import { setFavorite, useIsFavorite } from '@/lib/store/favorites';
import { MartProductStrip } from './MartProductStrip';
import { shareProduct, ShareIcon } from './product/share';
import { Chevron, Cross } from './ui/Cross';
import { HeartIcon } from './ui/HeartIcon';
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
  /** Размер и цвет, выбранные в карточке, — те же в блоке товара. */
  variantId?: string | null;
  color?: string;
  mode?: 'desktop' | 'mobile';
  onClose?: () => void;
  qtyFor?: (key: string) => number;
  onQty?: (key: string, qty: number) => void;
  cartHref?: string;
  /** Витрина /kit: статичный кадр внутри родителя (position: relative) — без портала, модального слоя и звука. */
  preview?: { progress?: number; paused?: boolean };
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
  const [shared, setShared] = useState(false);
  const fav = useIsFavorite(p.id);
  const drag = useRef<{ x: number; y: number; dy: number; moved: boolean } | null>(null);
  const shareT = useRef<ReturnType<typeof setTimeout>>(undefined);
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

  // Esc, ловушка фокуса, блокировка прокрутки, «назад» в браузере — общий слой. Фокус — на сам диалог: Пробел ставит паузу.
  useModal({ active: !isPreview, ref: dialogRef, onClose: close });

  const toggle = () => {
    const v = videoRef.current;
    if (!v || isPreview || failed) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  };
  const toggleSound = () => {
    const v = videoRef.current;
    if (!v || isPreview) return;
    v.muted = !muted;
    setMuted(!muted);
    if (v.paused) v.play().catch(() => {});
  };

  const onSpace = useEffectEvent((e: KeyboardEvent) => {
    if (e.key !== ' ' || modalAbove(dialogRef)) return;
    if ((e.target as HTMLElement | null)?.closest?.('button, a, input, select, textarea')) return; // Пробел на кнопке — её нажатие
    e.preventDefault();
    toggle();
  });
  useEffect(() => {
    if (isPreview) return;
    const onKey = (e: KeyboardEvent) => onSpace(e);
    // Ушли на другую вкладку — пауза: звук в фоне не нужен.
    const onHidden = () => { if (document.hidden) videoRef.current?.pause(); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onHidden);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onHidden); };
  }, [isPreview]);

  useEffect(() => () => clearTimeout(shareT.current), []);
  const share = () => {
    shareProduct(p, !desktop).then(copied => {
      if (!copied) return;
      clearTimeout(shareT.current);
      setShared(true);
      shareT.current = setTimeout(() => setShared(false), 1800);
    });
  };

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
    if (!d.moved) { toggle(); return; }
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

  const pct = Math.min(100, Math.max(0, progress * 100));
  const view = (
    <div ref={dialogRef} role="dialog" aria-modal={isPreview ? undefined : true} aria-label={VIDEO.player(p.name)} tabIndex={-1}
      className={[s.overlay, desktop ? s.desktop : s.mobile, isPreview && s.inline].filter(Boolean).join(' ')}
      onClick={e => { if (desktop && e.target === e.currentTarget) close(); }}
      inert={isPreview || undefined} aria-hidden={isPreview || undefined}>
      <div ref={frameRef} className={s.frame}>
        <div className={s.stage}>
          <video ref={videoRef} className={s.media} src={isPreview ? undefined : video.src} poster={video.poster} playsInline loop preload="auto"
            disablePictureInPicture aria-hidden
            onPlay={() => setPaused(false)} onPause={() => setPaused(true)} onWaiting={() => setWaiting(true)} onPlaying={() => setWaiting(false)}
            onTimeUpdate={e => { const v = e.currentTarget; if (v.duration > 0) setProgress(v.currentTime / v.duration); }}
            onError={() => setFailed(true)} />
          <div className={s.tap} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} aria-hidden />
          {failed ? <span className={s.note}>{VIDEO.failed}</span>
            : waiting && !paused ? <span className={s.center} aria-hidden><Spinner size={28} /></span>
              : paused && <span className={s.center} aria-hidden><span className={s.playIco} /></span>}
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
          <div className={s.rail}>
            <button type="button" className={s.railBtn} onClick={() => setFavorite(p.id, !fav)} aria-pressed={fav} aria-label={fav ? 'Убрать из избранного' : VIDEO.fav}>
              <span className={s.railIcon}><HeartIcon on={fav} size={24} /></span>
              <span className={s.railLabel} aria-hidden>{fav ? VIDEO.favOn : VIDEO.fav}</span>
            </button>
            {FEATURES.reviews && (
              <button type="button" className={s.railBtn} aria-label={VIDEO.reviews}>
                <span className={s.railIcon}><ReviewsIcon /></span>
                <span className={s.railLabel} aria-hidden>{VIDEO.reviews}</span>
              </button>
            )}
            <button type="button" className={s.railBtn} onClick={share} aria-label={shared ? STATUS.linkCopied : VIDEO.share}>
              <span className={`${s.railIcon} ${shared ? s.railDone : ''}`}><ShareIcon size={22} /></span>
              <span className={s.railLabel} aria-live="polite">{shared ? STATUS.linkCopied : VIDEO.share}</span>
            </button>
          </div>
          <div className={s.progress} role="progressbar" aria-label={VIDEO.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
            <span className={s.progressFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className={s.sheet}>
          <MartProductStrip product={p} variantId={variantId} color={color} mobile={!desktop} qtyFor={qtyFor} onQty={onQty} cartHref={cartHref} />
        </div>
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

/** Облачко с текстом — «Отзывы». */
function ReviewsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 18.5 3.5 21l.5-4A8 8 0 1 1 7.5 19.5Z" />
      <path d="M8.5 10.5h7M8.5 14h4.5" />
    </svg>
  );
}
