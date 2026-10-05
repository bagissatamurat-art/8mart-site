'use client';
// Итоги заказа (02, 03): состав, строки стоимости, «Итого», плашка бонусов.
import { money } from '@/lib/domain';
import type { Totals } from '@/lib/domain';
import type { PlanLine } from '@/lib/domain';
import { BonusCoin } from '../ui/BonusCoin';
import s from './checkout.module.css';

/** Зелёная плашка «+N бонусов начислим после получения заказа». */
export function EarnNote({ children }: { children: React.ReactNode }) {
  return <div className={s.earn}><span className={s.coin14}><BonusCoin /></span><span>{children}</span></div>;
}

export interface SummaryLine { key: string; img?: string; name: string; qty: number; price: number | null }

/** Состав заказа: фото 48 (mobile 44), «2 × 2 890 тг.», сумма. */
export function SummaryLines({ lines, mobile }: { lines: SummaryLine[]; mobile?: boolean }) {
  return (
    <div className={s.sumLines}>
      {lines.map(l => (
        <div key={l.key} className={`${s.sumLine} ${mobile ? s.sumLineM : ''}`}>
          {l.img ? <img src={l.img} alt="" className={s.sumImg} /> : <span className={s.sumImg} />}
          <span className={s.sumText}><span className={s.ellipsis}>{l.name}</span><span className={s.sumQty}>{l.qty} × {money(l.price)}</span></span>
          <span className={s.sumSum}>{money((l.price || 0) * l.qty)}</span>
        </div>
      ))}
    </div>
  );
}

export interface TotalsRowsProps {
  totals: Pick<Totals<PlanLine>, 'goods' | 'discount' | 'fees' | 'spend' | 'progress'>;
  /** Подпись первой строки: «4 товара» (корзина) или «Товары» (оформление). */
  goodsLabel?: string;
  /** Промокод: в оформлении — плашка «MART10 · −10%», в корзине — «Скидка по промокоду». */
  promo?: { code: string; pct: number } | null;
  discountLabel?: string;
  compact?: boolean;
  /** Дополнительные строки внутри того же столбца (плашка бонусов в корзине mobile, 2b). */
  children?: React.ReactNode;
}

export function TotalsRows({ totals: t, goodsLabel = 'Товары', promo, discountLabel = 'Скидка по промокоду', compact, children }: TotalsRowsProps) {
  return (
    <div className={`${s.rows} ${compact ? s.rowsCompact : ''}`}>
      <div className={s.row}><span className={s.muted}>{goodsLabel}</span><span>{money(t.goods)}</span></div>
      {t.discount > 0 && (
        <div className={s.row}>
          {promo && goodsLabel === 'Товары'
            ? <span className={`${s.muted} ${s.promoLabel}`}>Промокод <span className={s.promoPill}>{promo.code} · −{promo.pct}%</span></span>
            : <span className={s.muted}>{discountLabel}</span>}
          <span className={s.free}>−{money(t.discount)}</span>
        </div>
      )}
      {t.fees.map(f => <div key={f.label} className={s.row}><span className={s.muted}>{f.label}</span><span className={f.free ? s.free : s.nowrap}>{f.text}</span></div>)}
      {t.spend > 0 && <div className={s.row}><span className={s.muted}>Бонусами</span><span className={s.spent}>−{money(t.spend)}</span></div>}
      {t.progress && (
        <div className={s.progress}>
          <div className={s.bar}><div className={s.fill} style={{ width: t.progress.pct + '%' }} /></div>
          <span className={s.progressText}>{t.progress.label} {money(t.progress.left).replace('тг.', 'тг')}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/** «Итого»: корзина/оформление desktop 18/24, mobile и статус 16/20; paid — «Оплачено Kaspi». */
export function TotalLine({ total, small, paid }: { total: number; small?: boolean; paid?: string }) {
  return (
    <div className={`${s.totalLine} ${small ? s.totalSmall : ''}`}>
      <b>Итого</b>
      <span className={s.totalRight}>{paid && <span className={s.paid}>{paid}</span>}<b className={s.totalSum}>{money(total)}</b></span>
    </div>
  );
}
