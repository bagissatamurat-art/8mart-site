'use client';
// MartProductView — быстрый просмотр / страница товара. COMPONENTS.md → MartProductView,
// DESIGN_RULES.md → «Карточка товара (быстрый просмотр)»; референс site/MartProductView.dc.html и «08 Товар.dc.html».
// Desktop — модалка 1040 (галерея слева sticky, миниатюры, стрелки, ←→); mobile — sheet 94% (свайп-галерея с точками,
// CTA закреплён снизу). page=true — та же разметка без оверлея и крестика (/product/[id]).
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { bonusText, cartKey, deliveryConditions, discountPct, money } from '@/lib/domain';
import type { Category, Method, Product, ProductDetail } from '@/lib/types';
import { setFavorite, useIsFavorite } from '@/lib/store/favorites';
import { Badge } from './ui/Badge';
import { Cross, Chevron } from './ui/Cross';
import { HeartIcon } from './ui/HeartIcon';
import { Gallery, type Slide } from './product/Gallery';
import { Colors, Cta, Description, Packs, Sizes, Specs, Ways } from './product/Sections';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { modalAbove, useModal } from '@/lib/hooks/useModal';
import { useMounted } from '@/lib/hooks/useMounted';
import s from './MartProductView.module.css';
import { STATUS } from '@/lib/copy';
import { asset } from '@/lib/basePath';

export interface MartProductViewProps {
  product: ProductDetail;
  /** enter — полная анимация входа; swap — модалка подменяет скелетон (затемнение уже есть): проявляется только содержимое. */
  appear?: 'enter' | 'swap';
  /** Товары той же group (фасовки). Берутся только с совпадающим group; меньше двух — блок скрыт. */
  group?: Product[];
  /** Для подписи «Категория · Подкатегория» над названием. */
  categories?: Category[];
  /** Выбранный способ получения — первым в блоке условий с меткой «Ваш способ». */
  method?: Method | null;
  /** Количество в корзине по ключу cartKey(id|variantId, цвет). */
  qtyFor?: (key: string) => number;
  onQty?: (key: string, qty: number) => void;
  onClose?: () => void;
  /** Переключение фасовки — владелец загружает другой товар. */
  onPickGroup?: (id: string) => void;
  /** Страница товара: без оверлея, крестика и ссылки «Страница товара». */
  page?: boolean;
  /** auto — по брейкпоинту 1024. */
  mode?: 'desktop' | 'mobile' | 'auto';
  /** Витрина: оверлей position:absolute внутри родителя, без портала, блокировки скролла и ловушки фокуса. */
  contained?: boolean;
  cartHref?: string;
}

export function MartProductView(props: MartProductViewProps) {
  const isMobile = useIsMobile();
  const mode = props.mode ?? 'auto';
  const mobile = mode === 'mobile' || (mode === 'auto' && isMobile);
  // Смена товара (фасовка) сбрасывает выбор размера/цвета, фото и раскрытые блоки — как reset() в референсе.
  return <View key={props.product.id} {...props} mobile={mobile} />;
}

const productUrl = (id: string) => `/product/${encodeURIComponent(id)}`;

function View({
  product: pr, group, categories, method = null, qtyFor, onQty, onClose, onPickGroup, page = false, contained = false, appear = 'enter',
  cartHref = '/cart', mobile,
}: MartProductViewProps & { mobile: boolean }) {
  const [vid, setVid] = useState<string | null>(null);
  const [colorSel, setColorSel] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [shared, setShared] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const shareT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fav = useIsFavorite(pr.id);
  // Портал — только после гидрации (на сервере document нет).
  const mounted = useMounted();
  const modal = !page;
  const trap = modal && !contained;

  // ── Производные значения (renderVals в референсе) ──
  const vs = pr.variants?.length ? pr.variants : null;
  const v = vs ? vs.find(x => x.id === vid) || vs[0] : null;
  const colors = pr.colors?.length ? pr.colors : null;
  const color = colors ? (colorSel && colors.includes(colorSel) ? colorSel : colors[0]) : undefined;
  const baseImgs = pr.images || [];
  const imgs: Slide[] = v?.img ? [v.img, ...baseImgs.filter(i => i !== v.img)] : baseImgs.length ? baseImgs : [null];
  const cur = Math.min(idx, imgs.length - 1);
  const price = v ? v.price : pr.price;
  const key = cartKey(v ? v.id : pr.id, color);
  const qty = qtyFor?.(key) ?? 0;
  const sibs = pr.group && group
    ? group.filter(x => x.group === pr.group).sort((a, b) => parseFloat(a.pack || a.weight) - parseFloat(b.pack || b.weight))
    : [];
  const type = deliveryConditions(pr);
  const cat = categories?.find(c => c.sub.some(x => x.slug === pr.cat));
  const sub = cat?.sub.find(x => x.slug === pr.cat);
  const catName = [cat?.name, sub?.name].filter(Boolean).join(' · ');
  const pct = !v ? discountPct(pr) : 0;
  const hasUnit = !!pr.weight && !vs && pr.weight !== '1 шт';

  const toggleFav = () => setFavorite(pr.id, !fav);
  const setQ = (q: number) => onQty?.(key, q);
  const step = (d: number) => setIdx(i => (Math.min(i, imgs.length - 1) + d + imgs.length) % imgs.length);

  const share = () => {
    const url = new URL(asset(productUrl(pr.id)), location.origin).href;
    if (mobile && typeof navigator.share === 'function') navigator.share({ title: pr.name, url }).catch(() => {});
    else navigator.clipboard?.writeText(url).catch(() => {});
    clearTimeout(shareT.current);
    setShared(true);
    shareT.current = setTimeout(() => setShared(false), 1800);
  };
  useEffect(() => () => clearTimeout(shareT.current), []);

  // ── Модалка: Esc, фокус внутрь и обратно, ловушка Tab, блокировка скролла — общий слой ──
  useModal({ active: trap && mounted, ref: dialogRef, onClose });

  // ── ←→ листают фото (desktop); не из полей и не когда поверх открыт другой слой ──
  const onStep = useEffectEvent((d: number) => step(d));
  useEffect(() => {
    if (contained || mobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (modalAbove(trap ? dialogRef : undefined)) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') onStep(e.key === 'ArrowLeft' ? -1 : 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobile, contained, trap]);

  const favBtnLabel = fav ? 'Убрать из избранного' : 'В избранное';
  const cta = <Cta price={price} qty={qty} mobile={mobile} cartHref={cartHref} onQty={setQ} />;

  const info = (
    <div className={s.info}>
      <div className={s.head}>
        {(catName || type.tag) && (
          <div className={s.metaRow}>
            {catName && <span className={s.cat}>{catName}</span>}
            {type.tag && <span className={s.tag}>{type.tag}</span>}
          </div>
        )}
        <div className={s.titleRow}>
          {page ? <h1 className={s.title}>{pr.name}</h1> : <h2 className={s.title}>{pr.name}</h2>}
          {mobile && (
            <button type="button" className={s.favInline} onClick={toggleFav} aria-label={favBtnLabel} aria-pressed={fav}>
              <HeartIcon on={fav} size={22} />
            </button>
          )}
        </div>
        <div className={s.priceRow}>
          <b className={`${s.price} ${price == null ? s.priceNone : ''}`}>{money(price)}</b>
          {!v && pr.oldPrice != null && <>
            <span className={s.old}>{money(pr.oldPrice)}</span>
            {pct > 0 && <Badge tone="sale" className={s.saleBadge}>−{pct}%</Badge>}
          </>}
          {hasUnit && <span className={s.unit}>за {pr.weight}</span>}
        </div>
        {!!pr.bonus && (
          <span className={s.bonus}><span className={s.coin} aria-hidden>Б</span>{bonusText(pr.bonus)} за 1 шт</span>
        )}
        <div className={s.links}>
          <button type="button" className={`${s.link} ${shared ? s.linkDone : ''}`} onClick={share}>
            <span className={s.shareIco} aria-hidden><span /><span /><span /></span>
            <span aria-live="polite">{shared ? STATUS.linkCopied : 'Поделиться'}</span>
          </button>
          {!page && !mobile && (
            <Link href={productUrl(pr.id)} className={s.link}>Страница товара<Chevron direction="right" /></Link>
          )}
        </div>
      </div>

      {sibs.length > 1 && <Packs items={sibs} currentId={pr.id} onPick={onPickGroup} />}
      {vs && v && <Sizes variants={vs} current={v} onPick={id => { setVid(id); setIdx(0); }} />}
      {colors && color && <Colors colors={colors} current={color} note={pr.colorNote} onPick={setColorSel} />}

      {!mobile && <div className={s.ctaD}>{cta}</div>}

      <Ways type={type} method={method} />
      <Description text={pr.description || ''} />
      <Specs specs={pr.specs || []} />
    </div>
  );

  const rootCls = [s.root, mobile ? s.mobile : s.desktop, page ? s.page : s.modal, contained ? s.contained : '', appear === 'swap' ? s.swap : ''].filter(Boolean).join(' ');
  const tree = (
    <div className={rootCls} onClick={modal ? () => onClose?.() : undefined}>
      <div ref={dialogRef} className={s.dialog} onClick={e => e.stopPropagation()}
        role={modal ? 'dialog' : undefined} aria-modal={modal || undefined} aria-label={modal ? pr.name : undefined} tabIndex={modal ? -1 : undefined}>
        {modal && (
          <button type="button" className={`${s.onPhoto} ${s.close}`} onClick={() => onClose?.()} aria-label="Закрыть">
            <Cross size={14} color="var(--ink-1)" />
          </button>
        )}
        <div className={s.body}>
          <Gallery slides={imgs} idx={cur} name={pr.name} mobile={mobile} fav={fav} onFav={toggleFav} onIdx={setIdx} resetKey={v?.id} />
          {info}
        </div>
        {mobile && <div className={s.footer}>{cta}</div>}
      </div>
    </div>
  );

  if (trap) return mounted ? createPortal(tree, document.body) : null;
  return tree;
}
