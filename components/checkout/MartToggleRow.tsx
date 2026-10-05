'use client';
// Строка-переключатель 56: «Списать бонусы» (tone bonus, зелёная) и «Подъём на этаж» (tone primary). Референс — 03 Оформление.
import { BonusCoin } from '../ui/BonusCoin';
import { SwitchMark } from '../ui/Marks';
import s from './checkout.module.css';

/** Переключатель 40×24 — общий индикатор из ui/Marks. */
export const MartSwitch = SwitchMark;

export interface MartToggleRowProps { title: string; sub?: string; on: boolean; tone?: 'primary' | 'bonus'; coin?: boolean; onToggle?: () => void }

export function MartToggleRow({ title, sub, on, tone = 'primary', coin, onToggle }: MartToggleRowProps) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onToggle}
      className={`${s.toggleRow} ${on ? (tone === 'bonus' ? s.toggleBonus : s.toggleOn) : ''}`}>
      {coin && <span className={s.coin20}><BonusCoin /></span>}
      <span className={s.toggleText}><span className={s.toggleTitle}>{title}</span>{sub && <span className={s.toggleSub}>{sub}</span>}</span>
      <MartSwitch on={on} tone={tone} />
    </button>
  );
}
