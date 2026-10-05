'use client';
// MartCartLine — COMPONENTS.md → MartCartLine; референс site/MartCartLine.dc.html.
// Сетка «фото · текст · сумма/степпер». soldOut: фон #F7F7F8, «Нет в наличии в вашем филиале», только удалить.
import { bonusText, money } from '@/lib/domain';
import type { CartProduct } from '@/lib/types';
import { MartStepper } from './MartStepper';
import { Badge } from './ui/Badge';
import { BonusTag } from './ui/BonusCoin';
import { Cross } from './ui/Cross';
import s from './MartCartLine.module.css';
import { Img } from '@/components/ui/Img';

export interface MartCartLineProps {
  product: CartProduct;
  qty: number;
  max?: number;
  soldOut?: boolean;
  compact?: boolean;
  onChange?: (id: string, qty: number) => void;
}

export function MartCartLine({ product: p, qty, max = 99, soldOut, compact, onChange }: MartCartLineProps) {
  const remove = () => onChange?.(p.id, 0);
  return (
    <div className={`${s.line} ${compact ? s.compact : ''} ${soldOut ? s.sold : ''}`}>
      <div className={s.photo}>
        {p.img && <Img src={p.img} w={compact ? 64 : 80} h={compact ? 64 : 80} className={s.img} />}
        {soldOut && <Badge tone="dark" className={s.soldBadge}>Раскупили</Badge>}
      </div>
      <div className={s.text}>
        <span className={s.name}>{p.name}</span>
        <span className={s.meta}>{soldOut ? 'Нет в наличии в вашем филиале' : `${p.pack || p.weight || ''} · ${money(p.price)} за шт`}</span>
        {!!p.bonus && !soldOut && <BonusTag>{bonusText(p.bonus * qty)}</BonusTag>}
        {soldOut && <button type="button" className={s.removeLink} onClick={remove}>Удалить из корзины</button>}
      </div>
      <div className={s.side}>
        {soldOut ? (
          <>
            <span className={s.meta}>не учитывается</span>
            <button type="button" className={s.removeBtn} aria-label="Удалить" onClick={remove}><Cross size={12} /></button>
          </>
        ) : (
          <>
            <span className={s.sums}>
              <span className={s.sum}>{money((p.price || 0) * qty)}</span>
              {!!p.oldPrice && <span className={s.old}>{money(p.oldPrice * qty)}</span>}
            </span>
            <MartStepper qty={qty} size={36} tone="neutral" max={max} onChange={q => onChange?.(p.id, q)} />
          </>
        )}
      </div>
    </div>
  );
}
