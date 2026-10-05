'use client';
// MartSort — сортировка списка каталога; референс site/07 Каталог.dc.html.
// Desktop: pill 36 с полной подписью → выпадающий listbox 240 (строки 44, выбранная — с галочкой).
// Mobile: pill 36 с короткой подписью → нижний лист «Сортировка» с радио-строками 56. Варианты — SORTS из lib/config.
import { useEffect, useId, useRef, useState } from 'react';
import { SORTS } from '@/lib/config';
import type { SortId } from '@/lib/types';
import { MartSheet } from './MartSheet';
import { Check, Chevron } from './ui/Cross';
import s from './MartSort.module.css';

type SortList = [SortId, string][];

/** Короткая подпись для кнопки mobile: «Популярные», «Дешевле», «Дороже», «Со скидкой», «С бонусами». */
export function sortShortLabel(id: SortId, sorts: SortList = SORTS): string {
  const cur = sorts.find(x => x[0] === id) || sorts[0];
  return cur[0] === 'popular' ? 'Популярные' : cur[1].replace('Сначала ', '').replace(/^./, c => c.toUpperCase());
}

export interface MartSortProps {
  value: SortId;
  onChange: (id: SortId) => void;
  sorts?: SortList;
  /** Управляемое открытие (витрина). Без него — своё состояние. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Desktop: кнопка + выпадающий список. ↑↓ Home End — по пунктам, Enter/Пробел — выбрать, Esc и клик мимо — закрыть. */
export function MartSort({ value, onChange, sorts = SORTS, open: openProp, onOpenChange }: MartSortProps) {
  const [inner, setInner] = useState(false);
  const open = openProp ?? inner;
  const setOpen = (o: boolean) => { setInner(o); onOpenChange?.(o); };
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const opts = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();
  const cur = sorts.find(x => x[0] === value) || sorts[0];
  const selIdx = Math.max(0, sorts.findIndex(x => x[0] === value));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  });

  const toggle = () => {
    const next = !open; setOpen(next);
    if (next) requestAnimationFrame(() => opts.current[selIdx]?.focus());
  };
  const pick = (id: SortId) => { onChange(id); setOpen(false); btn.current?.focus(); };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = sorts.length;
    const go = (j: number) => { e.preventDefault(); opts.current[(j + n) % n]?.focus(); };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(n - 1);
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); btn.current?.focus(); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className={s.wrap} ref={root}>
      <button ref={btn} type="button" className={s.trigger} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${uid}-list` : undefined}
        onClick={toggle} onKeyDown={e => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); toggle(); } }}>
        {cur[1]}<Chevron size={7} />
      </button>
      {open && (
        <div role="listbox" id={`${uid}-list`} aria-label="Сортировка" className={s.menu}>
          {sorts.map(([id, label], i) => {
            const sel = id === value;
            return (
              <button key={id} ref={el => { opts.current[i] = el; }} type="button" role="option" aria-selected={sel} tabIndex={sel ? 0 : -1}
                className={`${s.option} ${sel ? s.optionOn : ''}`} onClick={() => pick(id)} onKeyDown={e => onKey(e, i)}>
                {label}{sel && <Check />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Mobile: pill-кнопка с короткой подписью, открывает MartSortSheet. */
export function MartSortButton({ value, sorts = SORTS, onClick }: { value: SortId; sorts?: SortList; onClick?: () => void }) {
  return (
    <button type="button" className={s.mBtn} onClick={onClick} aria-haspopup="dialog" aria-label={`Сортировка: ${sortShortLabel(value, sorts)}`}>
      {sortShortLabel(value, sorts)}<Chevron size={6} />
    </button>
  );
}

export interface MartSortSheetProps {
  open: boolean;
  onClose: () => void;
  value: SortId;
  onChange: (id: SortId) => void;
  sorts?: SortList;
  contained?: boolean;
  autoFocus?: boolean;
}

/** Mobile: лист «Сортировка», радио-строки 56. Выбор сразу применяется и закрывает лист. */
export function MartSortSheet({ open, onClose, value, onChange, sorts = SORTS, contained, autoFocus }: MartSortSheetProps) {
  const uid = useId();
  return (
    <MartSheet open={open} onClose={onClose} labelledBy={`${uid}-h`} gap={8} maxHeight="none" contained={contained} autoFocus={autoFocus}>
      <b className={s.sheetTitle} id={`${uid}-h`}>Сортировка</b>
      <div role="radiogroup" aria-labelledby={`${uid}-h`} className={s.radios}>
        {sorts.map(([id, label]) => {
          const sel = id === value;
          return (
            <button key={id} type="button" role="radio" aria-checked={sel} className={`${s.radioRow} ${sel ? s.radioRowOn : ''}`}
              onClick={() => { onChange(id); onClose(); }}>
              {label}
              <span className={s.radio} aria-hidden><span className={s.dot} /></span>
            </button>
          );
        })}
      </div>
    </MartSheet>
  );
}
