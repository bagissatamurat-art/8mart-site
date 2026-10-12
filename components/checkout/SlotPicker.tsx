'use client';
// Выбор времени доставки в оформлении (03): дни — ряд карточек «Сегодня / 13 окт», время выбранного дня — выпадающим списком.
// Выбранный день — розовым (primary-50 + контур primary). Данные — getDeliverySlots() (в проде — бэкенд).
import type { SlotDay } from '@/lib/domain';
import { MartSelect } from '../MartSelect';
import s from './SlotPicker.module.css';

export interface SlotPickerProps {
  days: SlotDay[];
  /** id выбранного слота */
  value: string;
  onChange: (id: string) => void;
  /** Подпись для экранного диктора: «Когда доставить курьером». */
  label: string;
}

export function SlotPicker({ days, value, onChange, label }: SlotPickerProps) {
  const day = days.find(d => d.slots.some(x => x.id === value)) ?? days[0];
  if (!day) return null;

  // Стрелки по дням — как у радиокнопок.
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = (days.indexOf(day) + step + days.length) % days.length;
    onChange(days[i].slots[0].id);
    const root = e.currentTarget;
    requestAnimationFrame(() => root.querySelectorAll<HTMLElement>('[role=radio]')[i]?.focus());
  };

  return (
    <div className={s.box}>
      {days.length > 1 && (
        <div className={s.days} role="radiogroup" aria-label={`${label}: день`} onKeyDown={onKey}>
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
      <MartSelect label="Время" ariaLabel={`${label}, ${day.title.toLowerCase()} ${day.date}`} value={value} onChange={onChange}
        options={day.slots.map(x => ({ id: x.id, label: x.label, sub: x.sub }))} />
    </div>
  );
}
