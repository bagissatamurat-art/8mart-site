'use client';
// MartChip — COMPONENTS.md → MartChip; референс site/MartChip.dc.html.
import { Cross } from './ui/Cross';
import s from './MartChip.module.css';

export interface MartChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  /** Крестик справа (активные фильтры). */
  removable?: boolean;
  count?: number;
  size?: 36 | 40;
  onClick?: () => void;
}

export function MartChip({ label, selected, disabled, removable, count, size = 36, onClick }: MartChipProps) {
  return (
    <button type="button" className={`${s.chip} ${selected ? s.selected : ''}`} style={{ height: size }} disabled={disabled}
      aria-pressed={removable ? undefined : !!selected} aria-label={removable ? `${label} — убрать` : undefined} onClick={onClick}>
      <span>{label}</span>
      {count != null && <span className={s.count}>{count}</span>}
      {removable && <span className={s.x}><Cross size={12} color="currentColor" /></span>}
    </button>
  );
}
