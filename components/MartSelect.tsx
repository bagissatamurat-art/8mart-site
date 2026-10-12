'use client';
// MartSelect — выпадающий список в виде поля (56, r16, рамка, подпись сверху), как MartInput.
// Время доставки в оформлении, город в поиске адреса. Список открывается вниз, если снизу мало места — вверх.
// Клавиатура: ↑↓ по пунктам, Enter/пробел — выбрать, Esc — закрыть (Esc модалки при этом не срабатывает).
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Check, Chevron } from './ui/Cross';
import s from './MartSelect.module.css';

export interface SelectOption {
  id: string;
  label: string;
  /** Подпись справа: «~30 мин». */
  sub?: string;
}

export interface MartSelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  /** Для экранного диктора, если подпись поля короче смысла: «Время доставки курьером». */
  ariaLabel?: string;
  disabled?: boolean;
}

/** Высота списка, при которой ещё открываем вниз. */
const MENU_MAX = 320;

export function MartSelect({ label, options, value, onChange, ariaLabel, disabled }: MartSelectProps) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const cur = options.find(o => o.id === value);

  // Клик мимо — закрыть.
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [open]);

  // Куда открыть — до отрисовки списка; затем фокус на выбранный пункт.
  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom, above = r.top;
    setUp(below < Math.min(MENU_MAX, options.length * 46 + 16) && above > below);
    root.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus({ preventScroll: true });
  }, [open, options.length]);

  function close(focusBtn = true) { setOpen(false); if (focusBtn) btn.current?.focus(); }

  function onKey(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') { setOpen(false); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const opts = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])];
      const i = opts.indexOf(document.activeElement as HTMLButtonElement);
      opts[(i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length]?.focus();
    }
  }

  return (
    <div className={s.wrap} ref={root} onKeyDown={onKey}>
      <button ref={btn} type="button" className={s.btn} disabled={disabled} aria-haspopup="listbox" aria-expanded={open}
        aria-controls={open ? menuId : undefined} aria-label={`${ariaLabel ?? label}: ${cur ? cur.label + (cur.sub ? `, ${cur.sub}` : '') : 'не выбрано'}`}
        onClick={() => setOpen(!open)}>
        <span className={s.text}>
          <span className={s.label}>{label}</span>
          <span className={s.value}>{cur?.label ?? '—'}{cur?.sub && <span className={s.valueSub}> · {cur.sub}</span>}</span>
        </span>
        <span className={`${s.chev} ${open ? s.chevUp : ''}`}><Chevron /></span>
      </button>
      {open && (
        <div id={menuId} role="listbox" aria-label={ariaLabel ?? label} className={`${s.menu} ${up ? s.up : ''}`}>
          {options.map(o => {
            const sel = o.id === value;
            return (
              <button key={o.id} type="button" role="option" aria-selected={sel} className={`${s.opt} ${sel ? s.sel : ''}`}
                onClick={() => { close(); if (!sel) onChange(o.id); }}>
                <span className={s.optLabel}>{o.label}</span>
                {o.sub && <span className={s.optSub}>{o.sub}</span>}
                <span className={s.optCheck}>{sel && <Check />}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
