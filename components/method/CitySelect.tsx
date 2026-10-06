'use client';
// Кнопка города + выпадающий список CITIES (site/MartMethodModal.dc.html).
// variant map — плашка поверх карты; field — поле в окне поиска адреса (во всю ширину, с подписью «Город»).
import { useEffect, useId, useRef, useState } from 'react';
import type { City } from '@/lib/types';
import { Check, Chevron } from '../ui/Cross';
import s from '../MartMethodModal.module.css';
import { GEO } from '@/lib/copy';

export function CitySelect({ cities, value, onChange, variant = 'map' }: { cities: City[]; value: City; onChange: (id: string) => void; variant?: 'map' | 'field' }) {
  const field = variant === 'field';
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Клик мимо — закрыть.
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [open]);

  // Открыли — фокус на выбранный город.
  useEffect(() => {
    if (open) root.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
  }, [open]);

  function onKey(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); btn.current?.focus(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const opts = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])];
      const i = opts.indexOf(document.activeElement as HTMLButtonElement);
      opts[(i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length]?.focus();
    }
  }

  return (
    <div className={`${s.cityWrap} ${field ? s.cityField : ''}`} ref={root} onKeyDown={onKey}>
      <button ref={btn} type="button" className={s.cityBtn} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? menuId : undefined}
        aria-label={`Город: ${value.name}`} onClick={() => setOpen(!open)}>
        {field
          ? <><span className={s.cityText}><span className={s.cityLabel}>{GEO.searchCity}</span>{value.name}</span><span className={`${s.cityChev} ${open ? s.cityChevUp : ''}`}><Chevron /></span></>
          : <><span className={s.cityDot} aria-hidden />{value.name}<Chevron /></>}
      </button>
      {open && (
        <div id={menuId} role="listbox" aria-label="Город" className={s.cityMenu}>
          {cities.map(c => {
            const sel = c.id === value.id;
            return (
              <button key={c.id} type="button" role="option" aria-selected={sel} className={`${s.cityOpt} ${sel ? s.sel : ''}`}
                onClick={() => { setOpen(false); btn.current?.focus(); if (!sel) onChange(c.id); }}>
                {c.name}{sel && <Check />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
