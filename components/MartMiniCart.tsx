'use client';
// MartMiniCart — COMPONENTS.md → MartMiniCart (desktop, колонка 340, sticky top 16); референс site/MartMiniCart.dc.html.
// Доставка — planShipments(); прогресс до бесплатной доставки — только курьер.
import Link from 'next/link';
import { useMemo } from 'react';
import { DELIVERY } from '@/lib/config';
import { itemsTitle, money, planShipments } from '@/lib/domain';
import { resolveCartItem } from '@/lib/api';
import type { Method } from '@/lib/types';
import { MartStepper } from './MartStepper';
import { MartButton } from './MartButton';
import s from './MartMiniCart.module.css';
import { asset } from '@/lib/basePath';
import { Img } from '@/components/ui/Img';

export interface MartMiniCartProps {
  /** { [lineKey]: qty } */
  cart: Record<string, number>;
  method?: Method;
  together?: boolean;
  cartHref?: string;
  listMax?: string;
  onChange?: (key: string, qty: number) => void;
  sticky?: boolean;
}

export function MartMiniCart({ cart, method = 'delivery', together, cartHref = '/cart', listMax = '288px', onChange, sticky }: MartMiniCartProps) {
  const lines = useMemo(() => Object.keys(cart).map(k => { const p = resolveCartItem(k); return p ? { p, qty: cart[k] } : null; })
    .filter((l): l is NonNullable<typeof l> => !!l), [cart]);
  const goods = lines.reduce((sum, l) => sum + (l.p.price || 0) * l.qty, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const plan = lines.length ? planShipments(lines, { method, together, goodsTotal: goods }) : null;
  const fees = method === 'pickup' ? [{ label: 'Самовывоз', text: 'Бесплатно', free: true }]
    : (plan?.list || []).map(x => ({ label: x.feeLabel, text: x.feeText, free: x.fee === 0 }));
  const left = Math.max(0, DELIVERY.freeFrom - goods);
  const showProgress = method !== 'pickup' && !!plan?.hasCourierFee;

  return (
    <aside className={`${s.box} ${sticky ? s.sticky : ''}`} aria-label="Корзина">
      {count === 0 ? (
        <div className={s.empty}>
          <span className={s.emptyPic}><Img src={asset('/assets/empty-cart.png')} w={60} h={60} /></span>
          <b className={s.emptyTitle}>Корзина пуста</b>
          <span className={s.emptyText}>Добавьте товары — покажем сумму и доставку здесь</span>
        </div>
      ) : (
        <>
          <div className={s.head}><b className={s.title}>{itemsTitle(count)}</b><Link href={cartHref} className={s.open}>Открыть</Link></div>
          <div className={s.list} style={{ maxHeight: listMax }}>
            {lines.map(l => (
              <div key={l.p.id} className={s.row}>
                {l.p.img ? <Img src={l.p.img} w={56} h={56} className={s.thumb} /> : <span className={s.thumb} />}
                <span className={s.rowText}><span className={s.rowName}>{l.p.name}</span><span className={s.rowSum}>{money((l.p.price || 0) * l.qty)}</span></span>
                <MartStepper qty={l.qty} size={36} tone="neutral" onChange={q => onChange?.(l.p.id, q)} />
              </div>
            ))}
          </div>
          <div className={s.divider} />
          <div className={s.totals}>
            <div className={s.tRow}><span className={s.muted}>Товары</span><span>{money(goods)}</span></div>
            {fees.map(f => <div key={f.label} className={s.tRow}><span className={s.muted}>{f.label}</span><span className={f.free ? s.free : s.nowrap}>{f.text}</span></div>)}
          </div>
          {showProgress && (
            <div className={s.progress}>
              <div className={s.bar}><div className={s.fill} style={{ width: Math.min(100, Math.round(goods / DELIVERY.freeFrom * 100)) + '%' }} /></div>
              <span className={s.progressText}>{(plan!.multi ? 'До бесплатной доставки курьером ' : 'До бесплатной доставки ') + money(left).replace('тг.', 'тг')}</span>
            </div>
          )}
          <MartButton label="Оформить" amount={money(goods + (plan?.fee || 0))} size={56} full href={cartHref} />
        </>
      )}
    </aside>
  );
}
