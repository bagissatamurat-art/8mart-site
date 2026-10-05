'use client';
// Строка-переключатель 56: «Списать бонусы» (tone bonus, зелёная) и «Подъём на этаж» (tone primary). Референс — 03 Оформление.
import { BonusCoin } from '../ui/BonusCoin';
import s from './checkout.module.css';

export function MartSwitch({ on, tone = 'primary' }: { on: boolean; tone?: 'primary' | 'bonus' }) {
  return <span className={`${s.switch} ${on ? (tone === 'bonus' ? s.switchBonus : s.switchOn) : ''}`} aria-hidden><span className={s.knob} /></span>;
}

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
