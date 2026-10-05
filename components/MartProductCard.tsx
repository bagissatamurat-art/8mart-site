'use client';
// MartProductCard — COMPONENTS.md → MartProductCard; референс site/MartProductCard.dc.html.
// Название ровно 2 строки, низ прижат — в сетке с align-items: stretch карточки одной высоты.
import Link from 'next/link';
import { money, discountPct, groupDigits } from '@/lib/domain';
import type { Product } from '@/lib/types';
import { setFavorite, useIsFavorite } from '@/lib/store/favorites';
import { MartStepper } from './MartStepper';
import { Badge } from './ui/Badge';
import { BonusTag } from './ui/BonusCoin';
import { HeartIcon } from './ui/HeartIcon';
import s from './MartProductCard.module.css';
import { Img } from '@/components/ui/Img';
import { useChangeTick } from '@/lib/hooks/useChangeTick';

export interface MartProductCardProps {
  product: Product;
  qty?: number;
  soldOut?: boolean;
  /** Переопределяет общий стор избранного (витрина). */
  favorite?: boolean;
  onFavorite?: (id: string, on: boolean) => void;
  onOpen?: (product: Product) => void;
  onQty?: (id: string, qty: number) => void;
}

export function MartProductCard({ product: p, qty = 0, soldOut, favorite, onFavorite, onOpen, onQty }: MartProductCardProps) {
  const storeFav = useIsFavorite(p.id);
  const fav = favorite ?? storeFav;
  const hasPrice = p.price != null;
  const pct = discountPct(p);
  const open = () => onOpen?.(p);
  // Отклик только на действие: сердце — при добавлении в избранное, степпер — когда товар впервые положили.
  const heart = useChangeTick(fav, n => n);
  const stepIn = useChangeTick(qty > 0, n => n);
  return (
    <article className={`${s.card} ${soldOut ? s.sold : ''}`} onClick={open}>
      <div className={s.photo}>
        {p.img ? <Img src={p.img} alt={p.name} fill sizes="(max-width: 1023px) 50vw, 220px" className={s.img} /> : <span className={s.ph}>фото товара</span>}
        {pct > 0 && !soldOut && <Badge tone="sale" className={s.disc}>−{pct}%</Badge>}
        {p.badge && !soldOut && <Badge tone="onPhoto" className={s.badge}>{p.badge}</Badge>}
        <button type="button" className={s.fav} aria-label={fav ? 'Убрать из избранного' : 'В избранное'} aria-pressed={fav}
          onClick={e => { e.stopPropagation(); if (favorite === undefined) setFavorite(p.id, !fav); onFavorite?.(p.id, !fav); }}>
          <span key={heart} className={heart ? s.heartPop : s.heartBox}><HeartIcon on={fav} /></span>
        </button>
        {soldOut && <Badge tone="dark" className={s.soldBadge}>Раскупили</Badge>}
      </div>
      <div className={s.body}>
        <div className={s.priceRow}>
          {/* Кнопка-обёртка названия даёт карточке доступный фокус и Enter → быстрый просмотр */}
          <span className={s.price}>{(p.variants ? 'от ' : '') + money(p.price)}</span>
          {p.oldPrice != null && !soldOut && <span className={s.old}>{money(p.oldPrice)}</span>}
        </div>
        <Link href={`/product/${p.id}`} className={s.nameBtn} prefetch={false}
          onClick={e => { e.stopPropagation(); if (onOpen && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) { e.preventDefault(); open(); } }}>
          <span className={s.name}>{p.name}</span>
        </Link>
        <div className={s.metaRow}>
          <span className={s.weight}>{p.weight}</span>
          {!!p.bonus && !soldOut && <BonusTag pill><span>+</span><span>{groupDigits(p.bonus)}</span></BonusTag>}
        </div>
      </div>
      {soldOut ? <div className={s.stub}>Нет в наличии</div>
        : !hasPrice ? <div className={s.stub}>Цена не задана</div>
        : p.variants ? <button type="button" className={s.add} onClick={e => { e.stopPropagation(); open(); }}>Выбрать размер</button>
        : qty > 0 ? <span className={stepIn ? s.stepIn : s.stepBox}><MartStepper qty={qty} size={36} full onChange={q => onQty?.(p.id, Math.max(0, q))} /></span>
        : <button type="button" className={s.add} onClick={e => { e.stopPropagation(); onQty?.(p.id, 1); }}>В корзину</button>}
    </article>
  );
}
