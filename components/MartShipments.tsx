'use client';
// MartShipmentHead / MartSplitChoice — COMPONENTS.md; референсы site/MartShipmentHead.dc.html, site/MartSplitChoice.dc.html.
// Данные — planShipments() / splitOptions() из lib/domain.
import type { Method, ShipmentKind } from '@/lib/types';
import type { SplitOption } from '@/lib/domain';
import s from './MartShipments.module.css';
import { RadioMark } from './ui/Marks';

export interface MartShipmentHeadProps {
  kind: ShipmentKind;
  method?: Method;
  /** «Доставка 1 из 2» */
  label: string;
  when: string;
  meta?: string;
  feeText?: string;
  compact?: boolean;
}

export function MartShipmentHead({ kind, method = 'delivery', label, when, meta, feeText, compact }: MartShipmentHeadProps) {
  const cargo = kind === 'cargo', pk = method === 'pickup';
  return (
    <div className={s.head}>
      <div className={s.headCol}>
        <span className={s.tagRow}>
          <span className={`${s.tag} ${cargo ? s.tagCargo : ''}`}>{pk ? (cargo ? 'Склад' : 'Точка') : (cargo ? 'Газель' : 'Курьер')}</span>
          <span className={s.label}>{label}</span>
        </span>
        <b className={s.when} style={{ fontSize: compact ? 16 : 18 }}>{when}</b>
        {meta && <span className={s.meta}>{meta}</span>}
      </div>
      {feeText && <span className={`${s.fee} ${feeText === 'Бесплатно' ? s.free : ''}`}>{feeText}</span>}
    </div>
  );
}

export interface MartSplitChoiceProps {
  options: SplitOption[];
  method?: Method;
  compact?: boolean;
  onPick?: (together: boolean) => void;
}

export function MartSplitChoice({ options, method = 'delivery', compact, onPick }: MartSplitChoiceProps) {
  const pk = method === 'pickup';
  return (
    <div className={s.split}>
      <div className={s.splitHead}>
        <b style={{ fontSize: compact ? 16 : 18 }}>{pk ? 'Как забрать заказ' : 'Как привезти заказ'}</b>
        <span className={s.meta}>{pk ? 'Тяжёлые товары выдаём только со склада, с завтрашнего дня' : 'Тяжёлые товары возим Газелью — только на следующий день'}</span>
      </div>
      <div className={s.grid} role="radiogroup" style={{ gridTemplateColumns: compact ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))' }}>
        {options.map(o => (
          <button key={o.id} type="button" role="radio" aria-checked={o.sel} className={`${s.opt} ${o.sel ? s.sel : ''}`} onClick={() => onPick?.(o.together)}>
            <RadioMark on={o.sel} strong className={s.radio} />
            <span className={s.optBody}>
              <span className={s.optTop}><span className={s.optTitle}>{o.title}</span><span className={`${s.optFee} ${o.feeText === 'Бесплатно' ? s.free : ''}`}>{o.feeText}</span></span>
              <span className={s.meta}>{o.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
