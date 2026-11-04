'use client';
// MartProductStrip — карточка товара поверх видео (MartVideoPlayer) и сторис с товаром (MartStories). По референсу владельца
// (экран видео товара Pinduoduo, 04.11): компактная белая карточка с отступами от краёв экрана — слева квадратное фото,
// справа название в 1–2 строки, цена (у вариантов — «от …», пока размер не выбран), маленькие чипы размера в одну строку
// и «В корзину» в цвет бренда; в корзине — степпер и «В корзине». «В корзину» — через setCartQty (без способа получения —
// модалка выбора). Избранное, отзывы и «Поделиться» — колонка справа над карточкой (VideoRail). Цвет — первый из colors.
import Link from 'next/link';
import { useState } from 'react';
import { cartKey, money } from '@/lib/domain';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/store/cart';
import { setCartQty } from '@/lib/store/ui';
import { PRODUCT_STRIP } from '@/lib/copy';
import { MartButton } from './MartButton';
import { MartChip } from './MartChip';
import { MartStepper } from './MartStepper';
import { Img } from './ui/Img';
import s from './MartProductStrip.module.css';

/** Пакет с ручками — «в корзину», цветом текста. */
function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5.5 8.5h13l-1 11.5a1.5 1.5 0 0 1-1.5 1.4H8a1.5 1.5 0 0 1-1.5-1.4L5.5 8.5Z" />
      <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
    </svg>
  );
}

export interface MartProductStripProps {
  product: Product;
  /** Выбранный размер (id варианта). Нет — цена «от …» и выбор размера; в плеере — тот, что выбран в карточке. */
  variantId?: string | null;
  color?: string;
  /** Фото и название — ссылка на страницу товара (сторис: товар может быть любым). */
  link?: boolean;
  /** Количество в корзине и его изменение; по умолчанию — общая корзина сайта. */
  qtyFor?: (key: string) => number;
  onQty?: (key: string, qty: number) => void;
  cartHref?: string;
  className?: string;
}

export function MartProductStrip({ product: p, variantId = null, color, link, qtyFor, onQty, cartHref = '/cart', className }: MartProductStripProps) {
  const [vid, setVid] = useState<string | null>(variantId);
  const lines = useCart(st => st.lines);

  const vs = p.variants?.length ? p.variants : null;
  const v = vs ? vs.find(x => x.id === vid) ?? null : null;
  const key = cartKey(v ? v.id : p.id, color ?? p.colors?.[0]);
  const qty = (qtyFor ?? (k => lines[k] || 0))(key);
  const price = vs ? v?.price ?? null : p.price;
  const img = v?.img ?? p.img;
  const setQ = (q: number) => (onQty ?? setCartQty)(key, Math.max(0, q));
  const href = `/product/${encodeURIComponent(p.id)}`;

  const photo = <span className={s.photo}>{img ? <Img src={img} alt="" fill sizes="104px" quality={60} className={s.photoImg} /> : null}</span>;
  const name = <span className={s.name}>{p.name}</span>;

  let cta;
  if (vs && !v) cta = <MartButton label={PRODUCT_STRIP.chooseSize} size={44} full disabled reason={PRODUCT_STRIP.chooseSize} />;
  else if (price == null) cta = <MartButton label={PRODUCT_STRIP.noPrice} size={44} full disabled reason={PRODUCT_STRIP.noPrice} />;
  else if (qty <= 0) cta = <MartButton label={PRODUCT_STRIP.toCart} size={44} full onClick={() => setQ(1)} />;
  else cta = (
    // В корзине: степпер и круглая «в корзину» — в узкой колонке карточки подпись «В корзине» не помещается рядом со степпером
    <div className={s.inCart}>
      <MartStepper qty={qty} size={44} full onChange={setQ} />
      <Link href={cartHref} className={s.toCart} aria-label={PRODUCT_STRIP.goCart} title={PRODUCT_STRIP.goCart}><BagIcon /></Link>
    </div>
  );

  return (
    <div className={[s.root, className].filter(Boolean).join(' ')}>
      {link ? <Link href={href} className={s.photoLink} prefetch={false} tabIndex={-1} aria-hidden>{photo}</Link> : photo}
      <div className={s.body}>
        {link ? <Link href={href} className={s.nameLink} prefetch={false}>{name}</Link> : name}
        <span className={s.priceRow}>
          <b className={s.price}>{price != null ? money(price) : `от ${money(p.price)}`}</b>
          {!vs && p.oldPrice != null && <span className={s.old}>{money(p.oldPrice)}</span>}
        </span>
        {vs && (
          <div className={s.sizes} role="group" aria-label={PRODUCT_STRIP.size}>
            {vs.map(x => <MartChip key={x.id} label={x.size} selected={x.id === v?.id} onClick={() => setVid(x.id)} />)}
          </div>
        )}
        {cta}
      </div>
    </div>
  );
}
