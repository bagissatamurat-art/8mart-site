'use client';
// MartStories — COMPONENTS.md → MartStories; референс site/MartStories.dc.html.
// Ряд миниатюр + просмотрщик (desktop — карточка 400×711 на затемнении со стрелками, mobile — на весь экран).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
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
/** Сдвиг, после которого касание — уже перетаскивание, а не тап (px). */
const DRAG_START = 8;
/** Перелистывание: слайд — смена фото и текста, история — въезд карточки сбоку. */
const EASE = 'cubic-bezier(.2,.8,.2,1)';
const SLIDE_MS = 280;
/** Смена истории — лента едет на ширину карточки; с середины свайпа — пропорционально оставшемуся пути. */
const STORY_MS = 340;
/** Зазор между соседними историями в ленте (px) — как --story-gap в CSS. */
const STORY_GAP = 12;
/** Флик: быстрый короткий свайп тоже листает (px/мс). */
const FLICK_V = 0.45;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  /** Фото прошлого слайда под новым, пока новое проявляется. */
  const [under, setUnder] = useState<string | null>(null);
  /** Какой слайд показывает соседняя история слева: «назад» тапом попадает на её последний слайд, свайпом — на первый. */
  const [ghostPrevSl, setGhostPrevSl] = useState(0);

  // Актуальные значения для rAF и обработчиков без пересоздания.
  const posRef = useRef(pos); posRef.current = pos;
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const progRef = useRef(prog);
  const holdingRef = useRef(false);
  const downRef = useRef({ t: 0, x: 0, y: 0 });
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  /** Лента едет к соседней истории — таймер слайда стоит, повторные переходы ждут. */
  const sliding = useRef<Animation | null>(null);
  const layerRef = useRef<HTMLSpanElement>(null);
  /** Видео-слайд (сторис 8mart.kz): прогресс — по времени видео, конец видео — следующий слайд. */
  const videoRef = useRef<HTMLVideoElement>(null);
  /** Видео не загрузилось — слайд идёт по таймеру, как фото (обложка остаётся). */
  const [videoFailed, setVideoFailed] = useState(false);
  /** Звук — выключен по умолчанию (автозапуск со звуком браузеры блокируют); выбор держится до закрытия. */
  const [muted, setMuted] = useState(true);
  const textRef = useRef<HTMLDivElement>(null);
  const trans = useRef<{ story: boolean; dir: number } | null>(null);
  const anims = useRef<Animation[]>([]);
  const drag = useRef<{ axis: 'x' | 'y' | null; dx: number; dy: number; t: number; v: number }>({ axis: null, dx: 0, dy: 0, t: 0, v: 0 });
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose); onCloseRef.current = onClose;

  const close = useCallback(() => { if (!isPreview) onCloseRef.current?.(); }, [isPreview]);

  const go = useCallback((si: number, sl: number) => {
    const cur = posRef.current;
    if (si !== cur.si) trans.current = { story: true, dir: si > cur.si ? 1 : -1 };
    else if (sl !== cur.sl) { trans.current = { story: false, dir: sl > cur.sl ? 1 : -1 }; setUnder(stories[cur.si].slides[cur.sl]?.img ?? null); }
    progRef.current = 0;
    setProg(0);
    setVideoFailed(false);
    setCopied(false);
    if (copyTimer.current) { clearTimeout(copyTimer.current); copyTimer.current = undefined; setPaused(false); }
    setPos({ si, sl });
  }, [stories]);

  /** Переход к соседней истории: лента с текущей и соседними карточками едет на ширину карточки
   *  (со свайпа — от места, где отпустили палец), потом состояние переключается без мигания. */
  const switchStory = useCallback((si: number, sl: number, fromPx = 0) => {
    if (sliding.current) return;
    const dir = si > posRef.current.si ? 1 : -1;
    const track = trackRef.current, stage = stageRef.current;
    if (!track || !stage || reducedMotion()) { if (track) track.style.transform = ''; go(si, sl); return; }
    if (dir < 0) flushSync(() => setGhostPrevSl(sl));
    const w = stage.clientWidth + STORY_GAP;
    const to = -dir * w;
    track.style.transform = '';
    const a = track.animate([{ transform: `translateX(${fromPx}px)` }, { transform: `translateX(${to}px)` }],
      { duration: Math.max(160, STORY_MS * Math.abs(to - fromPx) / w), easing: EASE, fill: 'forwards' });
    sliding.current = a;
    a.finished.then(() => go(si, sl), () => { /* закрыли во время перехода */ });
  }, [go]);

  const next = useCallback(() => {
    const { si, sl } = posRef.current;
    if (sl < stories[si].slides.length - 1) go(si, sl + 1);
    else if (si < stories.length - 1) switchStory(si + 1, 0);
    else close(); // после последней — закрыть
  }, [stories, go, switchStory, close]);

  const prev = useCallback(() => {
    const { si, sl } = posRef.current;
    if (sl > 0) go(si, sl - 1);
    else if (si > 0) switchStory(si - 1, stories[si - 1].slides.length - 1);
    else go(0, 0);
  }, [stories, go, switchStory]);

  const nextStory = useCallback((fromPx = 0) => {
    const { si } = posRef.current;
    if (si < stories.length - 1) switchStory(si + 1, 0, fromPx); else close();
  }, [stories, switchStory, close]);

  const prevStory = useCallback((fromPx = 0) => {
    const { si } = posRef.current;
    if (si > 0) switchStory(si - 1, 0, fromPx);
  }, [switchStory]);

  // Автопереход: STORY_DURATION на слайд (видео — его длительность); пауза — Пробел, удержание, «Код скопирован».
  useEffect(() => {
    if (isPreview) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last; last = now;
      const v = videoRef.current;
      if (v) {
        // Видео: прогресс — его время; пока буферизуется — стоит.
        if (v.ended) { next(); return; }
        if (v.duration > 0) { const p = v.currentTime / v.duration; if (p !== progRef.current) { progRef.current = p; setProg(p); } }
      } else if (!pausedRef.current && !holdingRef.current && !sliding.current) {
        const sec = stories[posRef.current.si]?.slides[posRef.current.sl]?.duration;
        const p = progRef.current + dt / (sec ? sec * 1000 : STORY_DURATION);
        if (p >= 1) { next(); return; }
        progRef.current = p;
        setProg(p);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pos, isPreview, next, stories, videoFailed]);

  // Перелистывание. Слайд: новое фото проявляется поверх прошлого (crossfade), текст всплывает на 8px.
  // История: карточка въезжает со стороны направления (вперёд — справа). Без анимации при reduced motion.
  useLayoutEffect(() => {
    // Лента доехала до соседней истории: состояние переключено — снимаем сдвиг в том же кадре, без мигания.
    if (sliding.current) { sliding.current.cancel(); sliding.current = null; setGhostPrevSl(0); }
    if (trackRef.current) trackRef.current.style.transform = '';
    const t = trans.current;
    trans.current = null;
    if (!t) return;
    anims.current.forEach(a => a.cancel());
    anims.current = [];
    if (reducedMotion()) { setUnder(null); return; }
    const opts = { duration: t.story ? STORY_MS : SLIDE_MS, easing: EASE };
    if (t.story) { setUnder(null); return; } // лента уже доехала — новая история стоит на месте
    const img = layerRef.current?.animate([{ opacity: 0, transform: 'scale(1.03)' }, { opacity: 1, transform: 'none' }], opts);
    const txt = textRef.current?.animate([{ opacity: 0, transform: `translateY(8px)` }, { opacity: 1, transform: 'none' }], opts);
    anims.current = [img, txt].filter((a): a is Animation => !!a);
    if (img) img.finished.then(() => setUnder(null), () => { /* прервано следующим перелистыванием */ });
    else setUnder(null);
  }, [pos]);

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

  useEffect(() => () => { clearTimeout(copyTimer.current); clearTimeout(holdTimer.current); sliding.current?.cancel(); }, []);

  // Видео стоит на паузе вместе со сторис (Пробел, удержание, «Код скопирован»).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused || held) v.pause();
    else v.play().catch(() => { /* автозапуск запрещён — играет по первому касанию */ });
  }, [paused, held, pos, videoFailed]);

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
  // Вбок: лента идёт за пальцем, соседняя история въезжает рядом; дальше порога или флик — доезжает к ней.
  // Вниз: вся сцена уходит вниз и закрывается. Не дотянул — пружинит обратно.
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (sliding.current) return;
    holdingRef.current = true;
    downRef.current = { t: performance.now(), x: e.clientX, y: e.clientY };
    drag.current = { axis: null, dx: 0, dy: 0, t: performance.now(), v: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => { if (holdingRef.current) setHeld(true); }, HOLD_MS);
  };
  /** Свайп за край (назад с первой истории): тянется туго. */
  const resist = (dx: number) => {
    const { si } = posRef.current;
    return dx > 0 && si === 0 ? dx / 3 : dx < 0 && si === stories.length - 1 ? dx / 3 : dx;
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current, stage = stageRef.current;
    if (!holdingRef.current || !track || !stage) return;
    const d = downRef.current, g = drag.current;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!g.axis) {
      if (Math.hypot(dx, dy) < DRAG_START) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : dy > 0 ? 'y' : null;
      if (!g.axis) return;
      clearTimeout(holdTimer.current);
      setHeld(false);
      anims.current.forEach(a => a.cancel());
    }
    const now = performance.now();
    g.v = (dx - g.dx) / Math.max(1, now - g.t); g.t = now;
    g.dx = dx; g.dy = dy;
    if (g.axis === 'x') track.style.transform = `translateX(${resist(dx)}px)`;
    else {
      const y = Math.max(0, dy);
      stage.style.transform = `translateY(${y}px) scale(${1 - Math.min(y, 400) / 2000})`;
    }
  };
  const springBack = (el: HTMLElement | null) => {
    if (!el || !el.style.transform) return;
    const from = el.style.transform;
    el.style.transform = '';
    if (!reducedMotion()) el.animate([{ transform: from }, { transform: 'none' }], { duration: 220, easing: EASE });
  };
  const onCancel = () => {
    holdingRef.current = false; clearTimeout(holdTimer.current); setHeld(false);
    if (drag.current.axis) { drag.current.axis = null; springBack(trackRef.current); springBack(stageRef.current); }
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const wasHold = holdingRef.current;
    const g = { ...drag.current };
    drag.current.axis = null;
    holdingRef.current = false; clearTimeout(holdTimer.current); setHeld(false);
    if (!wasHold) return;
    const stage = stageRef.current;
    if (g.axis === 'y') {
      if (g.dy > SWIPE_CLOSE && stage && !reducedMotion()) {
        const from = stage.style.transform;
        stage.style.transform = '';
        stage.animate([{ transform: from }, { transform: 'translateY(100%)', opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' })
          .finished.then(close, close);
      } else if (g.dy > SWIPE_CLOSE) close();
      else springBack(stage);
      return;
    }
    if (g.axis === 'x') {
      const { si } = posRef.current;
      const flick = Math.abs(g.v) > FLICK_V && Math.sign(g.v) === Math.sign(g.dx);
      const pass = Math.abs(g.dx) > SWIPE_SIDE || flick;
      const from = resist(g.dx);
      if (pass && g.dx < 0 && si < stories.length - 1) nextStory(from);
      else if (pass && g.dx > 0 && si > 0) prevStory(from);
      else if (pass && g.dx < 0) close(); // влево с последней истории — закрыть
      else springBack(trackRef.current);
      return;
    }
    const d = downRef.current;
    if (performance.now() - d.t > HOLD_MS) return; // было удержание — только пауза
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX - r.left < r.width / 3) prev(); else next();
  };

  const showPause = paused || held;
  const video = !isPreview && !videoFailed ? slide.video : undefined;
  const hasText = !!(slide.title || slide.text);

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
        <button type="button" className={[s.arrow, s.arrowPrev].join(' ')} aria-label="Предыдущая история" disabled={noPrev} onClick={() => prevStory()}>
          <Chevron size={10} color="var(--ink-1)" direction="left" />
        </button>
      )}
      <div ref={stageRef} className={[s.stage, desktop ? s.cardDesktop : s.cardMobile].join(' ')}>
      <div ref={trackRef} className={s.track}>
      {!isPreview && stories[pos.si - 1] && <Ghost story={stories[pos.si - 1]} sl={ghostPrevSl} side="prev" />}
      {!isPreview && stories[pos.si + 1] && <Ghost story={stories[pos.si + 1]} sl={0} side="next" />}
      <div ref={cardRef} className={s.card}>
        {under && <span className={s.layer} aria-hidden><Img src={under} fill sizes="(max-width: 1023px) 100vw, 400px" draggable={false} className={s.slideImg} /></span>}
        <span ref={layerRef} className={s.layer}><Img src={slide.img} fill sizes="(max-width: 1023px) 100vw, 400px" draggable={false} className={s.slideImg} priority /></span>
        {video && (
          <video key={video} ref={videoRef} className={s.slideImg} src={video} muted={muted} playsInline autoPlay preload="auto"
            disablePictureInPicture onError={() => setVideoFailed(true)} aria-hidden />
        )}
        {nextImg && <span className={s.preload} aria-hidden><Img src={nextImg} fill sizes="(max-width: 1023px) 100vw, 400px" /></span>}
        <div className={s.tap} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} aria-hidden />
        <div className={`${s.top} ${hasText ? '' : s.topBare}`}>
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
            {video && (
              <button type="button" className={s.close} aria-label={muted ? 'Включить звук' : 'Выключить звук'} aria-pressed={!muted} onClick={() => setMuted(m => !m)}>
                <SoundIcon muted={muted} />
              </button>
            )}
            <button ref={closeRef} type="button" className={s.close} aria-label="Закрыть" onClick={close}>
              <Cross size={14} color="var(--ink-1)" />
            </button>
          </div>
          {hasText && (
            <div ref={textRef} className={s.text} aria-live="polite">
              <h2 className={s.title}>{slide.title}</h2>
              <p className={s.body}>{slide.text}</p>
            </div>
          )}
        </div>
        {cta && (
          <div className={s.cta}>
            <MartButton label={ctaLabel} variant="primary" size={56} full onClick={onCta} />
          </div>
        )}
      </div>
      </div>
      </div>
      {desktop && (
        <button type="button" className={[s.arrow, s.arrowNext].join(' ')} aria-label={pos.si < stories.length - 1 ? 'Следующая история' : 'Закрыть сторис'} onClick={() => nextStory()}>
          <Chevron size={10} color="var(--ink-1)" direction="right" />
        </button>
      )}
    </div>
  );

  return isPreview ? view : createPortal(view, document.body);
}

/** Соседняя история в ленте: та же карточка без событий — видна, пока свайпаешь или лента едет к ней. */
function Ghost({ story, sl, side }: { story: Story; sl: number; side: 'prev' | 'next' }) {
  const slide = story.slides[sl] ?? story.slides[0];
  return (
    <div className={`${s.card} ${side === 'prev' ? s.ghostPrev : s.ghostNext}`} aria-hidden inert>
      <span className={s.layer}><Img src={slide.img} fill sizes="(max-width: 1023px) 100vw, 400px" draggable={false} className={s.slideImg} eager /></span>
      <div className={s.top}>
        <div className={s.bars}>
          {story.slides.map((_, i) => <span key={i} className={s.bar}><span className={s.barFill} style={{ width: i < sl ? '100%' : '0%' }} /></span>)}
        </div>
        <div className={s.head}>
          <Img src={story.cover} w={32} h={32} className={s.avatar} />
          <b className={s.storyTitle}>{story.title}</b>
          <span className={s.close}><Cross size={14} color="var(--ink-1)" /></span>
        </div>
        <div className={s.text}>
          <h2 className={s.title}>{slide.title}</h2>
          <p className={s.body}>{slide.text}</p>
        </div>
      </div>
      {slide.cta && <div className={s.cta}><MartButton label={slide.cta.label} variant="primary" size={56} full /></div>}
    </div>
  );
}

/** Динамик: со звуком — волны, без звука — крест. */
function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="var(--ink-1)" />
      {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />}
    </svg>
  );
}
