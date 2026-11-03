'use client';
// Миниатюра видео поверх галереи товара (справа сверху, ~1/4 ширины, 9:16): беззвучное превью по кругу. «Уменьшить
// движение», медленная сеть или экономия трафика — только обложка. Крестик скрывает миниатюру до конца сессии;
// нажатие — плеер на весь экран (MartVideoPlayer). Место (отступы, ширину) задаёт галерея через className.
import { useState } from 'react';
import type { ProductVideo } from '@/lib/types';
import { VIDEO } from '@/lib/copy';
import { useVideoAutoplay } from '@/lib/hooks/useVideoAutoplay';
import { Cross } from '../ui/Cross';
import { Img } from '../ui/Img';
import s from '../MartVideoPlayer.module.css';

export interface VideoThumbProps {
  video: ProductVideo;
  onOpen: () => void;
  onHide: () => void;
  /** Витрина: только обложка, как при «уменьшить движение». */
  still?: boolean;
  className?: string;
}

export function VideoThumb({ video, onOpen, onHide, still, className }: VideoThumbProps) {
  const autoplay = useVideoAutoplay() && !still;
  // Файлы ролика пропали (заменили, а страница из кэша) — миниатюру не показываем.
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    <div className={[s.thumb, className].filter(Boolean).join(' ')}>
      <button type="button" className={s.thumbOpen} onClick={onOpen} aria-label={VIDEO.open}>
        <Img src={video.poster} alt="" fill sizes="120px" quality={60} className={s.thumbMedia} />
        {autoplay && (
          <video className={s.thumbMedia} src={video.preview} poster={video.poster} muted playsInline loop autoPlay preload="metadata"
            disablePictureInPicture aria-hidden onError={() => setBroken(true)} />
        )}
        <span className={s.thumbPlay} aria-hidden><span /></span>
      </button>
      <button type="button" className={s.thumbHide} onClick={onHide} aria-label={VIDEO.hide}>
        <Cross size={10} color="#fff" />
      </button>
    </div>
  );
}
