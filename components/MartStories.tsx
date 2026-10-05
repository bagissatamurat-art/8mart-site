'use client';
// MartStories — COMPONENTS.md → MartStories; референс site/MartStories.dc.html.
// Ряд миниатюр + просмотрщик (desktop — карточка 400×711 на затемнении со стрелками, mobile — на весь экран).
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { MartButton } from './MartButton';
import { Chevron, Cross } from './ui/Cross';
import { STORY_DURATION } from '@/lib/config';
import { markStorySeen, useStoriesSeen } from '@/lib/store/storiesSeen';
import type { Story } from '@/lib/types';
import s from './MartStories.module.css';
import { STATUS } from '@/lib/copy';
import { modalAbove, useModal } from '@/lib/hooks/useModal';
import { Img } from '@/components/ui/Img';

export type StoriesMode = 'desktop' | 'mobile';

/** Порог удержания (мс): дольше — пауза, а не тап. */
const HOLD_MS = 250;
/** Свайп вниз — закрыть; вбок — соседняя история (px). */
const SWIPE_CLOSE = 80;
const SWIPE_SIDE = 60;
/** Сколько держим «Код скопирован» (мс), таймер на паузе. */
const COPIED_MS = 1800;

export interface MartStoriesProps {
  stories: Story[];
  mode?: StoriesMode;
  className?: string;
}

/** Ряд миниатюр; клик открывает просмотр с выбранной истории. */
export function MartStories({ stories, mode = 'mobile', className }: MartStoriesProps) {
  const seen = useStoriesSeen();
  const [openAt, setOpenAt] = useState<number | null>(null);
  const desktop = mode === 'desktop';
  return (
    <>
      <div className={[s.row, desktop ? s.rowDesktop : s.rowMobile, className].filter(Boolean).join(' ')}>
        {stories.map((t, i) => {
          const isSeen = seen.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              className={[s.thumb, isSeen ? s.thumbSeen : s.thumbNew].join(' ')}
              aria-label={isSeen ? t.title : `${t.title}, не просмотрено`}
              onClick={() => setOpenAt(i)}
            >
              <span className={s.thumbInner}>
                <Img src={t.cover} fill sizes="104px" className={s.thumbImg} />
                <span className={s.thumbShade} aria-hidden />
                <span className={s.thumbTitle}>{t.title}</span>
              </span>
            </button>
          );
        })}
      </div>
      {openAt != null && <MartStoryViewer stories={stories} mode={mode} start={openAt} onClose={() => setOpenAt(null)} />}
    </>
  );
}

export interface StoryPreviewState {
  /** Номер слайда в истории. */
  slide?: number;
  /** Прогресс текущего слайда 0…1. */
  progress?: number;
  paused?: boolean;
  /** Состояние «Код скопирован» у CTA-копирования. */
  copied?: boolean;
}

export interface MartStoryViewerProps {
  stories: Story[];
  mode?: StoriesMode;
  /** С какой истории открыть. */
  start?: number;
  onClose?: () => void;
  /** Статичный превью-режим для /kit: без таймера, клавиш и портала, рисуется внутри родителя (position: relative). */
  preview?: StoryPreviewState;
}

/** Просмотрщик сторис. Обычно открывается из MartStories; отдельно — для витрины. */
export function MartStoryViewer({ stories, mode = 'mobile', start = 0, onClose, preview }: MartStoryViewerProps) {
  const desktop = mode === 'desktop';
  const isPreview = !!preview;
  const router = useRouter();

  const [pos, setPos] = useState({ si: start, sl: preview?.slide ?? 0 });
  const [prog, setProg] = useState(preview?.progress ?? 0);
  const [paused, setPaused] = useState(preview?.paused ?? false);
  const [copied, setCopied] = useState(preview?.copied ?? false);
  const [held, setHeld] = useState(false);

  // Актуальные значения для rAF и обработчиков без пересоздания.
  const posRef = useRef(pos); posRef.current = pos;
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const progRef = useRef(prog);
  const holdingRef = useRef(false);
  const downRef = useRef({ t: 0, x: 0, y: 0 });
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose); onCloseRef.current = onClose;

  const close = useCallback(() => { if (!isPreview) onCloseRef.current?.(); }, [isPreview]);

  const go = useCallback((si: number, sl: number) => {
    progRef.current = 0;
    setProg(0);
    setCopied(false);
    if (copyTimer.current) { clearTimeout(copyTimer.current); copyTimer.current = undefined; setPaused(false); }
    setPos({ si, sl });
  }, []);

  const next = useCallback(() => {
    const { si, sl } = posRef.current;
    if (sl < stories[si].slides.length - 1) go(si, sl + 1);
    else if (si < stories.length - 1) go(si + 1, 0);
    else close(); // после последней — закрыть
  }, [stories, go, close]);

  const prev = useCallback(() => {
    const { si, sl } = posRef.current;
    if (sl > 0) go(si, sl - 1);
    else if (si > 0) go(si - 1, stories[si - 1].slides.length - 1);
    else go(0, 0);
  }, [stories, go]);

  const nextStory = useCallback(() => {
    const { si } = posRef.current;
    if (si < stories.length - 1) go(si + 1, 0); else close();
  }, [stories, go, close]);

  const prevStory = useCallback(() => {
    const { si } = posRef.current;
    if (si > 0) go(si - 1, 0);
  }, [go]);

  // Автопереход: STORY_DURATION на слайд; пауза — Пробел, удержание, «Код скопирован».
  useEffect(() => {
    if (isPreview) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last; last = now;
      if (!pausedRef.current && !holdingRef.current) {
        const p = progRef.current + dt / STORY_DURATION;
        if (p >= 1) { next(); return; }
        progRef.current = p;
        setProg(p);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pos, isPreview, next]);

  // Открытая история — просмотрена.
  const storyId = stories[pos.si]?.id;
  useEffect(() => { if (!isPreview && storyId) markStorySeen(storyId); }, [storyId, isPreview]);

  // Esc, ловушка фокуса, блокировка прокрутки, возврат фокуса — общий слой; здесь только ←→ и Пробел.
  useModal({ active: !isPreview, ref: dialogRef, onClose: close, initialFocus: () => closeRef.current });
  useEffect(() => {
    if (isPreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (modalAbove(dialogRef)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPreview, next, prev]);

  useEffect(() => () => { clearTimeout(copyTimer.current); clearTimeout(holdTimer.current); }, []);

  const story = stories[pos.si];
  if (!story) return null;
  const slide = story.slides[pos.sl] ?? story.slides[0];
  const nextImg = story.slides[pos.sl + 1]?.img ?? stories[pos.si + 1]?.slides[0]?.img;
  const cta = slide.cta;
  const ctaLabel = cta ? (cta.copy && copied ? STATUS.codeCopied : cta.label) : '';
  const noPrev = pos.si === 0;

  const onCta = () => {
    if (!cta || isPreview) return;
    if (cta.copy) {
      navigator.clipboard?.writeText(cta.copy).catch(() => { /* нет доступа к буферу */ });
      setCopied(true);
      setPaused(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => { copyTimer.current = undefined; setCopied(false); setPaused(false); }, COPIED_MS);
    } else if (cta.href) {
      close();
      if (/^https?:/.test(cta.href)) window.location.href = cta.href; else router.push(cta.href);
    }
  };

  // Тап / удержание / свайпы — на слое поверх картинки.
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    holdingRef.current = true;
    downRef.current = { t: performance.now(), x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => { if (holdingRef.current) setHeld(true); }, HOLD_MS);
  };
  const onCancel = () => { holdingRef.current = false; clearTimeout(holdTimer.current); setHeld(false); };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const wasHold = holdingRef.current;
    onCancel();
    if (!wasHold) return;
    const d = downRef.current;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (dy > SWIPE_CLOSE && Math.abs(dy) > Math.abs(dx)) { close(); return; }
    if (Math.abs(dx) > SWIPE_SIDE) { if (dx < 0) nextStory(); else prevStory(); return; }
    if (performance.now() - d.t > HOLD_MS) return; // было удержание — только пауза
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX - r.left < r.width / 3) prev(); else next();
  };

  const showPause = paused || held;

  const view = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal={isPreview ? undefined : true}
      aria-label={`Сторис: ${story.title}`}
      className={[s.overlay, desktop ? s.overlayDesktop : s.overlayMobile, isPreview && s.overlayInline].filter(Boolean).join(' ')}
      onClick={e => { if (desktop && e.target === e.currentTarget) close(); }}
      // Превью витрины — без фокуса и событий
      inert={isPreview || undefined}
      aria-hidden={isPreview || undefined}
    >
      {desktop && (
        <button type="button" className={[s.arrow, s.arrowPrev].join(' ')} aria-label="Предыдущая история" disabled={noPrev} onClick={prevStory}>
          <Chevron size={10} color="var(--ink-1)" direction="left" />
        </button>
      )}
      <div className={[s.card, desktop ? s.cardDesktop : s.cardMobile].join(' ')}>
        <Img src={slide.img} fill sizes="(max-width: 1023px) 100vw, 400px" draggable={false} className={s.slideImg} priority />
        {nextImg && <span className={s.preload} aria-hidden><Img src={nextImg} fill sizes="(max-width: 1023px) 100vw, 400px" /></span>}
        <div className={s.tap} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onCancel} aria-hidden />
        <div className={s.top}>
          <div className={s.bars}>
            {story.slides.map((_, i) => (
              <span key={i} className={s.bar}>
                <span className={s.barFill} style={{ width: i < pos.sl ? '100%' : i > pos.sl ? '0%' : `${(prog * 100).toFixed(2)}%` }} />
              </span>
            ))}
          </div>
          <div className={s.head}>
            <Img src={story.cover} w={32} h={32} className={s.avatar} />
            <b className={s.storyTitle}>{story.title}</b>
            {showPause && <span className={s.pause} role="img" aria-label="Пауза"><span /><span /></span>}
            <button ref={closeRef} type="button" className={s.close} aria-label="Закрыть" onClick={close}>
              <Cross size={14} color="var(--ink-1)" />
            </button>
          </div>
          <div className={s.text} aria-live="polite">
            <h2 className={s.title}>{slide.title}</h2>
            <p className={s.body}>{slide.text}</p>
          </div>
        </div>
        {cta && (
          <div className={s.cta}>
            <MartButton label={ctaLabel} variant="primary" size={56} full onClick={onCta} />
          </div>
        )}
      </div>
      {desktop && (
        <button type="button" className={[s.arrow, s.arrowNext].join(' ')} aria-label={pos.si < stories.length - 1 ? 'Следующая история' : 'Закрыть сторис'} onClick={nextStory}>
          <Chevron size={10} color="var(--ink-1)" direction="right" />
        </button>
      )}
    </div>
  );

  return isPreview ? view : createPortal(view, document.body);
}
