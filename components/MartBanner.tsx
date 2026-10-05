// MartBanner — COMPONENTS.md → «Баннер главной»; референс site/01 Главная и каталог.dc.html.
// Desktop: баннер 2/3 ширины × 260 (r24) + справа тёмная плашка «Бесплатная доставка от …». Mobile: 358×140 (r20), без кнопки.
import Link from 'next/link';
import { DELIVERY } from '@/lib/config';
import { tg } from '@/lib/domain/format';
import type { Banner } from '@/lib/types';
import s from './MartBanner.module.css';
import { Img } from '@/components/ui/Img';

/** Деньги в свободном тексте — «тг» без точки. */

export interface MartBannerProps {
  banner: Banner;
  mode?: 'desktop' | 'mobile';
  /** Короткая подпись для mobile (в референсе «Привезём сегодня»); нет — берётся banner.text. */
  textShort?: string;
  className?: string;
}

export function MartBanner({ banner, mode = 'desktop', textShort, className }: MartBannerProps) {
  const desktop = mode === 'desktop';
  const link = (
    <Link href={banner.href} className={[s.banner, desktop ? s.desktop : s.mobile, !desktop && className].filter(Boolean).join(' ')}>
      <Img src={banner.img} fill priority sizes={desktop ? '(max-width: 1023px) 0px, 720px' : '(max-width: 1023px) 100vw, 0px'} className={s.img} />
      <b className={s.title}>{banner.title}</b>
      <span className={s.text}>{desktop ? banner.text : (textShort ?? banner.textShort ?? banner.text)}</span>
      {desktop && banner.cta && <span className={s.pill}>{banner.cta}</span>}
    </Link>
  );
  if (!desktop) return link;
  return (
    <div className={[s.grid, className].filter(Boolean).join(' ')}>
      {link}
      <div className={s.plaque}>
        <span className={s.plaqueTitle}>Бесплатная доставка<br />от {tg(DELIVERY.freeFrom)}</span>
        <span className={s.plaqueNote}>Иначе {tg(DELIVERY.fee)} · {DELIVERY.etaMin}–{DELIVERY.etaMax} минут</span>
      </div>
    </div>
  );
}
