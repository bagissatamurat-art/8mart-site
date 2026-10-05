'use client';
// Галерея быстрого просмотра. Desktop — большое фото + стрелки + счётчик + миниатюры 64×64;
// mobile — свайп-лента со scroll-snap и точками. Нет фото → полосатый плейсхолдер (как в референсе).
import { useEffect, useRef } from 'react';
import { HeartIcon } from '../ui/HeartIcon';
import s from '../MartProductView.module.css';

/** null — плейсхолдер вместо фото. */
export type Slide = string | null;

const PH_TEXT = 'фото товара';

function Photo({ src, alt, small }: { src: Slide; alt: string; small?: boolean }) {
  if (src) return <img src={src} alt={alt} className={s.photoImg} />;
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
}

export function Gallery({ slides, idx, name, mobile, fav, onFav, onIdx, resetKey }: GalleryProps) {
  const n = slides.length, multi = n > 1;
  const stripRef = useRef<HTMLDivElement>(null);

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
            <div key={i} className={s.slide} aria-hidden={i !== idx || undefined}><Photo src={src} alt={name} /></div>
          ))}
        </div>
        {multi && (
          <div className={s.dots} aria-hidden>
            {slides.map((_, i) => <span key={i} className={`${s.dot} ${i === idx ? s.dotOn : ''}`} />)}
          </div>
        )}
      </div>
    );
  }

  const step = (d: number) => onIdx((idx + d + n) % n);
  return (
    <div className={s.gallery}>
      <div className={s.main}>
        <Photo src={slides[idx] ?? null} alt={name} />
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
