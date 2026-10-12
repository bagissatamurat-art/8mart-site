// Картинки через next/image: AVIF/WebP, размер под место (srcset), ленивая загрузка.
// Фиксированный размер — w/h (миниатюры); тянется по контейнеру — fill + sizes (родитель position: relative).
// priority — только картинка LCP страницы (одна): preload в <head> + fetchpriority=high. eager — видна сразу (первый экран),
// но без preload. Остальные — лениво. quality — для карточек хватает 60 (список разрешённых — next.config images.qualities).
// Пока фото грузится — его размытое превью (если есть в lib/blur.ts), а не серый фон.
import Image from 'next/image';
import { BLUR } from '@/lib/blur';

/** Размытое превью (lib/blur.ts): по полному адресу или по пути /assets/… (с префиксом basePath). */
const blurOf = (src: string) => BLUR[src] ?? (src.includes('/assets/') ? BLUR[src.slice(src.indexOf('/assets/'))] : undefined);

type Props = { src: string; alt?: string; className?: string; priority?: boolean; draggable?: boolean; eager?: boolean; quality?: 60 | 75 }
  & ({ w: number; h: number; fill?: never; sizes?: string } | { fill: true; sizes: string; w?: never; h?: never });

export function Img({ src, alt = '', className, priority, draggable, eager, quality, ...p }: Props) {
  const blur = blurOf(src);
  const common = {
    src, alt, className, draggable, quality, sizes: p.sizes,
    placeholder: blur ? 'blur' as const : 'empty' as const, blurDataURL: blur,
    preload: priority || undefined, fetchPriority: priority ? 'high' as const : undefined,
    loading: priority || eager ? 'eager' as const : undefined,
  };
  return p.fill ? <Image {...common} fill /> : <Image {...common} width={p.w} height={p.h} />;
}
