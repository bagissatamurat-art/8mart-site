'use client';
// MartFilters — COMPONENTS.md → MartFilters; референсы site/MartFilters.dc.html (тело), site/07 Каталог.dc.html
// (сайдбар desktop, лист mobile, кнопка «Фильтры», чипы активных фильтров).
// Цена от–до + группы по категории (CAT_FILTERS / getFacets) + переключатели «В наличии», «Со скидкой».
// Desktop — в сайдбаре, применяется сразу, «Сбросить». Mobile — нижний лист с CTA «Показать · N товаров».
import { useId } from 'react';
import type { FilterDef } from '@/lib/config';
import type { ProductQuery } from '@/lib/types';
import { itemsTitle } from '@/lib/domain';
import { MartButton } from './MartButton';
import { MartSheet } from './MartSheet';
import { Cross } from './ui/Cross';
import s from './MartFilters.module.css';
import { CheckMark, SwitchMark } from './ui/Marks';

/** Значение фильтров: цена строками (только цифры), переключатели и выбранные значения групп по ключу группы. */
export type FiltersValue = {
  min?: string;
  max?: string;
  inStock?: boolean;
  sale?: boolean;
} & { [groupKey: string]: string[] | string | boolean | undefined };

/** Группа фильтра — форма ответа getFacets(): [значение, количество]. */
export interface FilterGroup { key: string; title: string; items: [string, number][] }

const RESERVED = new Set(['min', 'max', 'inStock', 'sale']);

/** Выбранные значения группы. */
export function groupValues(v: FiltersValue, key: string): string[] {
  const x = v[key];
  return Array.isArray(x) ? x : [];
}

/** Есть ли хоть один активный фильтр (как hasActive в MartFilters.dc.html). */
export function hasActiveFilters(v: FiltersValue): boolean {
  return Object.values(v).some(x => (Array.isArray(x) ? x.length > 0 : !!x));
}

/** Пустое значение с теми же ключами (сброс). */
export function resetFilters(v: FiltersValue): FiltersValue {
  return Object.fromEntries(Object.keys(v).map(k => [k, Array.isArray(v[k]) ? [] : typeof v[k] === 'boolean' ? false : ''])) as FiltersValue;
}

export interface FilterChip { label: string; remove: () => FiltersValue }

/** Чипы активных фильтров над сеткой (07 Каталог: цена одним чипом «от 2000 до 5000 тг», затем значения групп). */
export function filterChips(v: FiltersValue, groups: Pick<FilterGroup, 'key'>[]): FilterChip[] {
  const chips: FilterChip[] = [];
  if (v.min || v.max) {
    chips.push({ label: `${v.min ? 'от ' + v.min : ''}${v.min && v.max ? ' ' : ''}${v.max ? 'до ' + v.max : ''} тг`, remove: () => ({ ...v, min: '', max: '' }) });
  }
  groups.forEach(g => groupValues(v, g.key).forEach(val => chips.push({ label: val, remove: () => ({ ...v, [g.key]: groupValues(v, g.key).filter(x => x !== val) }) })));
  if (v.inStock) chips.push({ label: 'В наличии', remove: () => ({ ...v, inStock: false }) });
  if (v.sale) chips.push({ label: 'Со скидкой', remove: () => ({ ...v, sale: false }) });
  return chips;
}

/** Значение фильтров → параметры getProducts(). attrs — по ключу группы (так их читает lib/api.ts). */
export function filtersToQuery(v: FiltersValue, defs: Pick<FilterDef, 'key'>[]): Pick<ProductQuery, 'min' | 'max' | 'sale' | 'inStock' | 'attrs'> {
  const attrs: Record<string, string[]> = {};
  defs.forEach(d => { const vals = groupValues(v, d.key); if (vals.length) attrs[d.key] = vals; });
  return {
    min: v.min ? +v.min : undefined,
    max: v.max ? +v.max : undefined,
    sale: v.sale || undefined,
    inStock: v.inStock || undefined,
    attrs: Object.keys(attrs).length ? attrs : undefined,
  };
}

// ── Тело фильтров (MartFilters.dc.html) ──

export interface MartFiltersProps {
  value: FiltersValue;
  /** Группы из getFacets(); группа с одним значением скрыта, если в ней ничего не выбрано (07 Каталог). */
  groups: FilterGroup[];
  /** Сколько товаров найдётся — в CTA «Показать · N». */
  resultCount?: number;
  /** Текст суммы в CTA вместо числа (mobile: «4 товара»). */
  resultText?: string;
  showToggles?: boolean;
  /** Кнопки «Показать» / «Сбросить» снизу (лист mobile, витрина). В сайдбаре desktop — выключены. */
  showActions?: boolean;
  onChange: (v: FiltersValue) => void;
  /** «Сбросить»; по умолчанию — onChange(resetFilters(value)). */
  onReset?: () => void;
  onApply?: (v: FiltersValue) => void;
}

export function MartFilters({ value: v, groups, resultCount = 0, resultText, showToggles = true, showActions = true, onChange, onReset, onApply }: MartFiltersProps) {
  const uid = useId();
  const digits = (x: string) => x.replace(/\D/g, '');
  const toggle = (k: string, l: string) => {
    const arr = groupValues(v, k);
    onChange({ ...v, [k]: arr.includes(l) ? arr.filter(x => x !== l) : arr.concat(l) });
  };
  const reset = () => (onReset ? onReset() : onChange(resetFilters(v)));
  const shown = groups.filter(g => !RESERVED.has(g.key) && (g.items.length > 1 || groupValues(v, g.key).length > 0));
  const active = hasActiveFilters(v);

  return (
    <div className={s.root}>
      <div className={s.block}>
        <b className={s.title} id={`${uid}-price`}>Цена, тг</b>
        <div className={s.price} role="group" aria-labelledby={`${uid}-price`}>
          <label className={s.field}>
            <span className={s.prefix}>от</span>
            <input value={v.min ?? ''} onChange={e => onChange({ ...v, min: digits(e.target.value) })} inputMode="numeric" aria-label="Цена от, тг" />
          </label>
          <label className={s.field}>
            <span className={s.prefix}>до</span>
            <input value={v.max ?? ''} onChange={e => onChange({ ...v, max: digits(e.target.value) })} inputMode="numeric" aria-label="Цена до, тг" />
          </label>
        </div>
      </div>

      {shown.map(g => {
        const sel = groupValues(v, g.key);
        return (
          <div key={g.key} className={s.group} role="group" aria-labelledby={`${uid}-${g.key}`}>
            <b className={`${s.title} ${s.groupTitle}`} id={`${uid}-${g.key}`}>{g.title}</b>
            {g.items.map(([label, count]) => {
              const on = sel.includes(label);
              return (
                <button key={label} type="button" role="checkbox" aria-checked={on} className={s.row} onClick={() => toggle(g.key, label)}>
                  <span className={s.rowLabel}>
                    <CheckMark on={on} />
                    {label}
                  </span>
                  <span className={s.count}>{count}</span>
                </button>
              );
            })}
          </div>
        );
      })}

      {showToggles && (
        <div className={s.group}>
          <SwitchRow label="Только в наличии" on={!!v.inStock} onClick={() => onChange({ ...v, inStock: !v.inStock })} />
          <SwitchRow label="Со скидкой" on={!!v.sale} onClick={() => onChange({ ...v, sale: !v.sale })} />
        </div>
      )}

      {showActions && (
        <div className={s.actions}>
          <MartButton label="Показать" amount={resultText ?? `${resultCount}`} size={44} full onClick={() => onApply?.(v)} />
          {active && <MartButton label="Сбросить" variant="ghost" size={44} full onClick={reset} />}
        </div>
      )}
    </div>
  );
}

function SwitchRow({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={s.row} onClick={onClick}>
      <span>{label}</span>
      <SwitchMark on={on} />
    </button>
  );
}

// ── Desktop: сайдбар под категориями (07 Каталог, 1440) ──

export interface MartFiltersPanelProps extends Omit<MartFiltersProps, 'showActions'> {
  className?: string;
}

/** Белая панель r24 p20: заголовок «Фильтры» + «Сбросить» (когда что-то выбрано). Применяется сразу через onChange. */
export function MartFiltersPanel({ className, ...props }: MartFiltersPanelProps) {
  const uid = useId();
  const reset = () => (props.onReset ? props.onReset() : props.onChange(resetFilters(props.value)));
  return (
    <aside className={[s.panel, className].filter(Boolean).join(' ')} aria-labelledby={`${uid}-h`}>
      <div className={s.head}>
        <b className={s.panelTitle} id={`${uid}-h`}>Фильтры</b>
        {hasActiveFilters(props.value) && <button type="button" className={s.resetLink} onClick={reset}>Сбросить</button>}
      </div>
      <MartFilters {...props} showActions={false} />
    </aside>
  );
}

// ── Mobile: нижний лист (07 Каталог, 390) ──

export interface MartFiltersSheetProps extends Omit<MartFiltersProps, 'showActions' | 'resultText'> {
  open: boolean;
  onClose: () => void;
  /** Внутри родителя (витрина /kit). */
  contained?: boolean;
  autoFocus?: boolean;
}

/** Лист «Фильтры»: крестик 40, тело фильтров, CTA «Показать · N товаров» закрывает лист. */
export function MartFiltersSheet({ open, onClose, contained, autoFocus, onApply, ...props }: MartFiltersSheetProps) {
  const uid = useId();
  return (
    <MartSheet open={open} onClose={onClose} labelledBy={`${uid}-h`} contained={contained} autoFocus={autoFocus}>
      <div className={s.sheetHead}>
        <b className={s.sheetTitle} id={`${uid}-h`}>Фильтры</b>
        <button type="button" className={s.close} onClick={onClose} aria-label="Закрыть"><Cross size={14} color="var(--ink-1)" /></button>
      </div>
      <MartFilters {...props} resultText={itemsTitle(props.resultCount ?? 0)} showActions onApply={v => { onApply?.(v); onClose(); }} />
    </MartSheet>
  );
}

// ── Mobile: кнопка «Фильтры» над списком ──

/** Pill 36: без фильтров — контур, с фильтрами — розовая заливка и счётчик. */
/** icon — три полоски слева (05 Поиск, 1c); в 07 Каталог кнопка без иконки. */
export function MartFiltersButton({ count = 0, onClick, icon }: { count?: number; onClick?: () => void; icon?: boolean }) {
  const on = count > 0;
  return (
    <button type="button" className={`${s.fBtn} ${on ? s.fBtnOn : ''}`} onClick={onClick} aria-haspopup="dialog"
      aria-label={on ? `Фильтры, выбрано: ${count}` : undefined}>
      {icon && <span className={s.fIcon} aria-hidden><span /><span /><span /></span>}
      Фильтры
      {on && <span className={s.fBadge} aria-hidden>{count}</span>}
    </button>
  );
}
