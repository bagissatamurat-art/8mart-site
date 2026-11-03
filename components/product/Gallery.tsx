'use client';
// Галерея быстрого просмотра. Desktop — большое фото + стрелки + счётчик + миниатюры 64×64;
// mobile — свайп-лента со scroll-snap и точками. Нет фото → полосатый плейсхолдер (как в референсе).
// Есть видео — его миниатюра справа сверху поверх фото (VideoThumb).
import { useEffect, useRef } from 'react';
import type { ProductVideo } from '@/lib/types';
import { HeartIcon } from '../ui/HeartIcon';
import { VideoThumb } from './VideoThumb';
import s from '../MartProductView.module.css';
import { Img } from '@/components/ui/Img';

/** null — плейсхолдер вместо фото. */
export type Slide = string | null;

const PH_TEXT = 'фото товара';

/** lcp — первое фото на странице товара (предзагрузка); near — соседнее в ленте (без ленивой загрузки). */
function Photo({ src, alt, small, lcp, near }: { src: Slide; alt: string; small?: boolean; lcp?: boolean; near?: boolean }) {
  if (src) return <Img src={src} alt={alt} fill sizes={small ? '64px' : '(max-width: 1023px) 100vw, 460px'} priority={lcp} eager={near} className={s.photoImg} />;
  return <span className={small ? s.phSmall : s.ph}>{small ? null : PH_TEXT}</span>;
}

export interface GalleryProps {
  slides: Slide[];
  idx: number;
  name: string;
  mobile: boolean;
  fav: boolean;
  onFav: () => void;
  onIdx: (i: number) => void;
  /** Меняется при смене размера — лента прокручивается к началу. */
  resetKey?: string;
  /** Страница товара: первое фото — LCP (предзагрузка). В быстром просмотре — нет. */
  page?: boolean;
  /** Видео товара: миниатюра поверх фото; нажатие — плеер, крестик — скрыть до конца сессии. */
  video?: ProductVideo | null;
  onVideo?: () => void;
  onHideVideo?: () => void;
}

export function Gallery({ slides, idx, name, mobile, fav, onFav, onIdx, resetKey, page, video, onVideo, onHideVideo }: GalleryProps) {
  const n = slides.length, multi = n > 1;
  const stripRef = useRef<HTMLDivElement>(null);
  // В листе (mobile, не страница) справа сверху — крестик окна: миниатюра ниже него.
  const thumb = (cls: string | undefined) => video && onVideo
    ? <VideoThumb video={video} onOpen={onVideo} onHide={() => onHideVideo?.()} className={cls} /> : null;

  useEffect(() => { if (stripRef.current) stripRef.current.scrollLeft = 0; }, [resetKey]);

  if (mobile) {
    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget, i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      if (i !== idx) onIdx(i);
    };
    return (
      <div className={s.galleryM}>
        <div ref={stripRef} className={s.strip} onScroll={onScroll} aria-label={`Фото товара, ${idx + 1} из ${n}`}>
          {slides.map((src, i) => (
            <div key={i} className={s.slide} aria-hidden={i !== idx || undefined}><Photo src={src} alt={name} lcp={page && i === 0} near={Math.abs(i - idx) <= 1} /></div>
          ))}
        </div>
        {multi && (
          <div className={s.dots} aria-hidden>
            {slides.map((_, i) => <span key={i} className={`${s.dot} ${i === idx ? s.dotOn : ''}`} />)}
          </div>
        )}
        {thumb(page ? s.videoThumbM : s.videoThumbSheet)}
      </div>
    );
  }

  const step = (d: number) => onIdx((idx + d + n) % n);
  return (
    <div className={s.gallery}>
      <div className={s.main}>
        <Photo src={slides[idx] ?? null} alt={name} lcp={page && idx === 0} near />
        <button type="button" className={`${s.onPhoto} ${s.favOnPhoto}`} onClick={onFav}
          aria-label={fav ? 'Убрать из избранного' : 'В избранное'} aria-pressed={fav}>
          <HeartIcon on={fav} size={22} />
        </button>
        {multi && <>
          <button type="button" className={`${s.onPhoto} ${s.arrow} ${s.arrowL}`} onClick={() => step(-1)} aria-label="Предыдущее фото">
            <span className={s.arrowIcoL} />
          </button>
          <button type="button" className={`${s.onPhoto} ${s.arrow} ${s.arrowR}`} onClick={() => step(1)} aria-label="Следующее фото">
            <span className={s.arrowIcoR} />
          </button>
          <span className={s.counter} aria-live="polite">{idx + 1} / {n}</span>
        </>}
        {thumb(s.videoThumbD)}
      </div>
      {multi && (
        <div className={s.thumbs}>
          {slides.map((src, i) => (
            <button key={i} type="button" className={`${s.thumb} ${i === idx ? s.thumbOn : ''}`} onClick={() => onIdx(i)}
              aria-label={`Фото ${i + 1}`} aria-current={i === idx || undefined}>
              <Photo src={src} alt="" small />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
