'use client';
// Выбор времени доставки в оформлении (03): дни — ряд карточек «Сегодня / 13 окт», интервалы выбранного дня — сеткой.
// Выбранное — розовым (primary-50 + контур primary), не чёрным. Данные — getDeliverySlots() (в проде — бэкенд).
import { useRef } from 'react';
import type { SlotDay } from '@/lib/domain';
import s from './SlotPicker.module.css';

export interface SlotPickerProps {
  days: SlotDay[];
  /** id выбранного слота */
  value: string;
  onChange: (id: string) => void;
  /** Подпись группы для экранного диктора: «Когда доставить курьером». */
  label: string;
  compact?: boolean;
}

export function SlotPicker({ days, value, onChange, label, compact }: SlotPickerProps) {
  const dayIdx = Math.max(0, days.findIndex(d => d.slots.some(x => x.id === value)));
  const day = days[dayIdx];
  const grid = useRef<HTMLDivElement>(null);
  if (!day) return null;

  // Стрелки внутри группы — как у радиокнопок.
  const arrows = (e: React.KeyboardEvent, list: string[], cur: string, pick: (id: string) => void, root: HTMLElement | null) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = (list.indexOf(cur) + step + list.length) % list.length;
    pick(list[i]);
    requestAnimationFrame(() => root?.querySelectorAll<HTMLElement>('[role=radio]')[i]?.focus());
  };

  return (
    <div className={`${s.box} ${compact ? s.compact : ''}`}>
      {days.length > 1 && (
        <div className={s.days} role="radiogroup" aria-label={`${label}: день`}
          onKeyDown={e => arrows(e, days.map(d => d.id), day.id, id => onChange(days.find(d => d.id === id)!.slots[0].id), e.currentTarget)}>
          {days.map(d => {
            const on = d === day;
            return (
              <button key={d.id} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
                className={`${s.day} ${on ? s.on : ''}`} onClick={() => !on && onChange(d.slots[0].id)}>
                <span className={s.dayTitle}>{d.title}</span>
                <span className={s.dayDate}>{d.date}</span>
              </button>
            );
          })}
        </div>
      )}
      <div ref={grid} className={s.slots} role="radiogroup" aria-label={`${label}: время, ${day.title.toLowerCase()} ${day.date}`}
        onKeyDown={e => arrows(e, day.slots.map(x => x.id), value, onChange, grid.current)}>
        {day.slots.map(x => {
          const on = x.id === value;
          return (
            <button key={x.id} type="button" role="radio" aria-checked={on} tabIndex={on || (!day.slots.some(y => y.id === value) && x === day.slots[0]) ? 0 : -1}
              className={`${s.slot} ${on ? s.on : ''} ${x.sub ? s.asap : ''}`} onClick={() => onChange(x.id)}>
              <span className={s.slotLabel}>{x.label}</span>
              {x.sub && <span className={s.slotSub}>{x.sub}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
