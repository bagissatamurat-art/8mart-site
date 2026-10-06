// Картинки через next/image: AVIF/WebP, размер под место (srcset), ленивая загрузка.
// Фиксированный размер — w/h (миниатюры); тянется по контейнеру — fill + sizes (родитель position: relative).
import Image from 'next/image';

type Props = { src: string; alt?: string; className?: string; priority?: boolean; draggable?: boolean; /** Загрузить сразу, без ленивой загрузки (скрытая соседняя карточка). */ eager?: boolean }
  & ({ w: number; h: number; fill?: never; sizes?: string } | { fill: true; sizes: string; w?: never; h?: never });

export function Img({ src, alt = '', className, priority, draggable, eager, ...p }: Props) {
  const loading = eager && !priority ? 'eager' : undefined;
  return p.fill
    ? <Image src={src} alt={alt} fill sizes={p.sizes} className={className} priority={priority} fetchPriority={priority ? 'high' : undefined} draggable={draggable} loading={loading} />
    : <Image src={src} alt={alt} width={p.w} height={p.h} sizes={p.sizes} className={className} priority={priority} fetchPriority={priority ? 'high' : undefined} draggable={draggable} loading={loading} />;
}
