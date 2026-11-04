'use client';
// VideoFloat — плавающая миниатюра видео товара (решение владельца 04.11) на странице товара и в быстром просмотре.
// Поверх страницы (position: fixed): при прокрутке стоит на месте экрана, а не уезжает с фото. Перетаскивается пальцем
// и мышью по всей карточке (на компьютере — по колонке галереи), но не на шапку и не на нижнюю «В корзину»; отпустили —
// плавно «магнитится» к ближайшему левому или правому краю, по вертикали остаётся, где отпустили. Место — до конца сессии
// (sessionStorage 8mart.videoFloat). Нажатие без перемещения — плеер (MartVideoPlayer), крестик — скрыть до конца сессии,
// стрелки на клавиатуре — передвинуть. Внутри — беззвучное превью по кругу; «уменьшить движение» или явная экономия
// трафика (Save-Data) — только обложка и без анимации магнита. Автозапуск запрещён (iPhone в режиме энергосбережения) —
// превью запускается с первым касанием страницы.
// contained — витрина: внутри родителя (position: absolute) — координаты считаются от него; место не сохраняется.
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { ProductVideo } from '@/lib/types';
import { VIDEO } from '@/lib/copy';
import { VIDEO_FLOAT, VIDEO_FLOAT_KEY } from '@/lib/config';
import {
  FLOAT_START, floatClamp, floatFits, floatIntersect, floatPlace, floatSnap, parseFloatPos,
  type FloatBounds, type FloatPoint, type FloatPos,
} from '@/lib/videoFloat';
import { useVideoAutoplay } from '@/lib/hooks/useVideoAutoplay';
import { Cross } from '../ui/Cross';
import { Img } from '../ui/Img';
import s from '../MartVideoPlayer.module.css';

export interface VideoFloatProps {
  video: ProductVideo;
  onOpen: () => void;
  onHide: () => void;
  /** Где миниатюре можно стоять (координаты окна) — считается заново при прокрутке и изменении размеров. null — спрятать. */
  bounds: () => FloatBounds | null;
  /** Ширина, px; высота — 9:16. */
  width?: number;
  /** Плеер открыт поверх — превью на паузе. */
  paused?: boolean;
  /** Витрина: только обложка, как при «уменьшить движение». */
  still?: boolean;
  /** Витрина: внутри родителя (position: absolute), место не сохраняется. */
  contained?: boolean;
  className?: string;
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(.2,.8,.2,1)'; // = --ease-out
/** Шаг по вертикали стрелками — доля пути. */
const KEY_STEP = 0.1;
const same = (a: FloatPoint | null, b: FloatPoint | null) => a === b || (!!a && !!b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5);

function readPos(): FloatPos {
  try { return parseFloatPos(sessionStorage.getItem(VIDEO_FLOAT_KEY)) ?? FLOAT_START; } catch { return FLOAT_START; }
}
function savePos(p: FloatPos) {
  try { sessionStorage.setItem(VIDEO_FLOAT_KEY, JSON.stringify(p)); } catch { /* приватный режим — до перезагрузки */ }
}

export function VideoFloat({ video, onOpen, onHide, bounds, width = VIDEO_FLOAT.width, paused, still, contained, className }: VideoFloatProps) {
  const size = { w: width, h: Math.round(width * 16 / 9) };
  const gap = VIDEO_FLOAT.gap;
  const autoplay = useVideoAutoplay() && !still;
  const hintId = useId();
  const root = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLVideoElement>(null);
  /** Сторона и доля пути — в ref: рисуем по pt, а положение нужно обработчикам прокрутки и перетаскивания. */
  const pos = useRef<FloatPos>(FLOAT_START);
  /** Где стоит (координаты окна); null — не измерено или не помещается. */
  const [pt, setPt] = useState<FloatPoint | null>(null);
  const [dragging, setDragging] = useState(false);
  // Файлы ролика пропали (заменили, а страница из кэша) — миниатюру не показываем.
  const [broken, setBroken] = useState(false);
  const drag = useRef<{ id: number; sx: number; sy: number; from: FloatPoint; at: FloatPoint; moved: boolean } | null>(null);
  /** После перетаскивания браузер может прислать click — плеер он не открывает. */
  const dragged = useRef(false);
  const anim = useRef<Animation | null>(null);
  // Границы считает родитель по своим ref — берём свежую функцию каждого рендера.
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  /** Смещение родителя (витрина): миниатюра рисуется от него, а считаем всё в координатах окна. */
  const toCss = (p: FloatPoint) => {
    const r = contained ? (root.current?.offsetParent as HTMLElement | null)?.getBoundingClientRect() : null;
    return `translate3d(${Math.round(p.x - (r?.left ?? 0))}px, ${Math.round(p.y - (r?.top ?? 0))}px, 0)`;
  };
  /** Границы, если миниатюра в них помещается с отступами; иначе null. */
  const measure = (): FloatBounds | null => {
    const b = boundsRef.current();
    return b && floatFits(b.clip ? floatIntersect(b.zone, b.clip) : b.zone, size, gap) ? b : null;
  };
  const place = () => {
    if (drag.current?.moved) return; // тащат — не мешаем
    const b = measure();
    const next = b ? floatPlace(pos.current, b, size, gap) : null;
    setPt(prev => (same(prev, next) ? prev : next));
  };

  // Место из сессии; позиция — до первой отрисовки, дальше — при прокрутке (любой, в том числе внутри окна), размерах окна
  // и раскладки страницы (догрузились фото). Ещё раз — следующим кадром: родитель, смонтированный тем же коммитом
  // (смена раскладки телефон → компьютер), привязывает свои ref уже после эффектов миниатюры.
  useLayoutEffect(() => {
    if (!contained) pos.current = readPos();
    place();
    let raf = requestAnimationFrame(place);
    const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
    const ro = new ResizeObserver(later);
    ro.observe(document.body);
    window.addEventListener('resize', later);
    document.addEventListener('scroll', later, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', later);
      document.removeEventListener('scroll', later, { capture: true });
    };
  }, [contained, width]);
  // Родитель перерисовался (выбрали размер, нижняя кнопка стала степпером) — границы могли сдвинуться.
  useLayoutEffect(() => { place(); });

  // Превью: беззвучно и по кругу. Браузер не дал запустить сам — запускаем с первым касанием страницы (это жест).
  useEffect(() => {
    const v = media.current;
    if (!v) return;
    if (paused) { v.pause(); return; }
    v.muted = true;
    v.defaultMuted = true;
    let armed = false;
    const kick = () => { v.play().catch(() => { /* ещё не загрузилось — autoPlay запустит сам */ }); };
    v.play().catch(() => {
      armed = true;
      document.addEventListener('pointerdown', kick, { capture: true, once: true });
      document.addEventListener('keydown', kick, { capture: true, once: true });
    });
    return () => {
      if (!armed) return;
      document.removeEventListener('pointerdown', kick, { capture: true });
      document.removeEventListener('keydown', kick, { capture: true });
    };
  }, [autoplay, paused, video.preview]);

  /** Новое положение: сохранить и плавно доехать от from (где отпустили или где стояла). */
  const moveTo = (next: FloatPos, from: FloatPoint | null) => {
    pos.current = next;
    if (!contained) savePos(next);
    const b = measure(), el = root.current;
    if (!b || !el) return;
    const to = floatPlace(next, b, size, gap);
    setPt(to);
    anim.current?.cancel();
    el.style.transform = toCss(to); // после перетаскивания transform ставили руками — возвращаем в согласие с pt
    if (from && !same(from, to) && !reducedMotion()) {
      anim.current = el.animate([{ transform: toCss(from) }, { transform: toCss(to) }], { duration: VIDEO_FLOAT.snapMs, easing: EASE });
    }
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    dragged.current = false;
    if (e.button !== 0 || !pt || (e.target as HTMLElement).closest('[data-float-hide]')) return;
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, from: pt, at: pt, moved: false };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current, el = root.current;
    if (!d || d.id !== e.pointerId || !el) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < VIDEO_FLOAT.dragStart) return;
      d.moved = true;
      // Дальше — перетаскивание: события у миниатюры, даже если палец или мышь ушли с неё; клик по кнопке не случится.
      el.setPointerCapture?.(e.pointerId);
      anim.current?.cancel();
      setDragging(true);
    }
    const b = measure();
    if (!b) return;
    d.at = floatClamp({ x: d.from.x + dx, y: d.from.y + dy }, b.clip ? floatIntersect(b.zone, b.clip) : b.zone, size, gap);
    el.style.transform = toCss(d.at);
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return; // нажатие без перемещения — плеер откроет click по кнопке
    dragged.current = true;
    setDragging(false);
    const b = measure();
    if (b) moveTo(floatSnap(d.at, b, size, gap), d.at);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-float-hide]')) return;
    const p = pos.current;
    const next: FloatPos | null = e.key === 'ArrowLeft' ? { ...p, side: 'left' } : e.key === 'ArrowRight' ? { ...p, side: 'right' }
      : e.key === 'ArrowUp' ? { ...p, t: Math.max(0, p.t - KEY_STEP) } : e.key === 'ArrowDown' ? { ...p, t: Math.min(1, p.t + KEY_STEP) } : null;
    if (!next) return;
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation(); // ←→ листают фото на компьютере — на миниатюре они двигают её
    moveTo(next, pt);
  };

  if (broken) return null;
  return (
    <div ref={root} className={[s.float, contained && s.floatIn, dragging && s.floatDrag, className].filter(Boolean).join(' ')}
      style={{ width: size.w, height: size.h, transform: pt ? toCss(pt) : undefined, visibility: pt ? undefined : 'hidden' }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}>
      <button type="button" className={s.thumbOpen} aria-label={VIDEO.open} aria-describedby={hintId}
        onClick={() => { if (dragged.current) { dragged.current = false; return; } onOpen(); }}>
        <Img src={video.poster} alt="" fill sizes={`${size.w}px`} quality={60} className={s.thumbMedia} draggable={false} />
        {autoplay && (
          <video ref={media} className={s.thumbMedia} src={video.preview} poster={video.poster} muted playsInline loop autoPlay preload="auto"
            disablePictureInPicture aria-hidden onError={() => setBroken(true)} />
        )}
        <span className={s.thumbPlay} aria-hidden><span /></span>
      </button>
      <button type="button" data-float-hide className={s.thumbHide} onClick={onHide} aria-label={VIDEO.hide}>
        <Cross size={10} color="#fff" />
      </button>
      <span id={hintId} className={s.srOnly}>{VIDEO.move}</span>
    </div>
  );
}
