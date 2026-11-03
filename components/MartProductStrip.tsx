'use client';
// MartProductStrip — блок товара поверх видео: в плеере видео товара (MartVideoPlayer) и в сторис с привязанным товаром.
// Фото, название, цена (у вариантов — «от …», пока размер не выбран), выбор размера, «В корзину» через setCartQty
// (без способа получения — модалка выбора). actions — «В избранное» и «Поделиться» в строке товара (сторис;
// в плеере они в колонке справа). Цвет — как в карточке по умолчанию: первый из colors.
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cartKey, money } from '@/lib/domain';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/store/cart';
import { setFavorite, useIsFavorite } from '@/lib/store/favorites';
import { setCartQty } from '@/lib/store/ui';
import { PRODUCT_STRIP, STATUS, VIDEO } from '@/lib/copy';
import { MartButton } from './MartButton';
import { MartChip } from './MartChip';
import { Cta } from './product/Sections';
import { HeartIcon } from './ui/HeartIcon';
import { Img } from './ui/Img';
import { shareProduct, ShareIcon } from './product/share';
import s from './MartProductStrip.module.css';

export interface MartProductStripProps {
  product: Product;
  /** Выбранный размер (id варианта). Нет — цена «от …» и выбор размера; в плеере — тот, что выбран в карточке. */
  variantId?: string | null;
  color?: string;
  /** «В избранное» и «Поделиться» в строке товара (сторис). */
  actions?: boolean;
  /** Фото и название — ссылка на страницу товара (сторис: товар может быть любым). */
  link?: boolean;
  mobile?: boolean;
  /** Количество в корзине и его изменение; по умолчанию — общая корзина сайта. */
  qtyFor?: (key: string) => number;
  onQty?: (key: string, qty: number) => void;
  cartHref?: string;
  className?: string;
}

export function MartProductStrip({
  product: p, variantId = null, color, actions, link, mobile = true, qtyFor, onQty, cartHref = '/cart', className,
}: MartProductStripProps) {
  const [vid, setVid] = useState<string | null>(variantId);
  const lines = useCart(st => st.lines);
  const fav = useIsFavorite(p.id);
  const [shared, setShared] = useState(false);
  const shareT = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(shareT.current), []);

  const vs = p.variants?.length ? p.variants : null;
  const v = vs ? vs.find(x => x.id === vid) ?? null : null;
  const key = cartKey(v ? v.id : p.id, color ?? p.colors?.[0]);
  const qty = (qtyFor ?? (k => lines[k] || 0))(key);
  const price = vs ? v?.price ?? null : p.price;
  const img = v?.img ?? p.img;

  const share = () => {
    shareProduct(p, mobile).then(copied => {
      if (!copied) return;
      clearTimeout(shareT.current);
      setShared(true);
      shareT.current = setTimeout(() => setShared(false), 1800);
    });
  };

  const info = (
    <>
      <span className={s.photo}>{img ? <Img src={img} alt="" fill sizes="56px" quality={60} className={s.photoImg} /> : null}</span>
      <span className={s.text}>
        <span className={s.name}>{p.name}</span>
        <span className={s.priceRow}>
          <b className={s.price}>{price != null ? money(price) : `от ${money(p.price)}`}</b>
          {!vs && p.oldPrice != null && <span className={s.old}>{money(p.oldPrice)}</span>}
        </span>
      </span>
    </>
  );
  return (
    <div className={[s.root, className].filter(Boolean).join(' ')}>
      <div className={s.head}>
        {link ? <Link href={`/product/${encodeURIComponent(p.id)}`} className={s.link} prefetch={false}>{info}</Link> : info}
        {actions && (
          <div className={s.actions}>
            <button type="button" className={s.icon} onClick={() => setFavorite(p.id, !fav)} aria-label={fav ? 'Убрать из избранного' : VIDEO.fav} aria-pressed={fav}>
              <HeartIcon on={fav} size={22} />
            </button>
            <button type="button" className={`${s.icon} ${shared ? s.iconDone : ''}`} onClick={share} aria-label={shared ? STATUS.linkCopied : VIDEO.share}>
              <ShareIcon />
            </button>
          </div>
        )}
      </div>
      {vs && (
        <div className={s.sizes} role="group" aria-label={PRODUCT_STRIP.size}>
          {vs.map(x => <MartChip key={x.id} label={x.size} selected={x.id === v?.id} onClick={() => setVid(x.id)} />)}
        </div>
      )}
      {vs && !v
        ? <MartButton label={PRODUCT_STRIP.chooseSize} size={56} full disabled reason={PRODUCT_STRIP.chooseSize} />
        : <Cta price={price} qty={qty} mobile={mobile} cartHref={cartHref} onQty={q => (onQty ?? setCartQty)(key, q)} />}
      <span className={s.live} aria-live="polite">{shared ? STATUS.linkCopied : ''}</span>
    </div>
  );
}
