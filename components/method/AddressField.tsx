'use client';
// Поле «Улица, дом» с подсказками адреса — DESIGN_RULES → «Подсказки адреса», логика из site/MartMethodModal.dc.html (sgSearch/sgPick/sgKey).
// С 3 символов, debounce 300 мс, до 6 вариантов в выбранном городе (GET /api/geo/suggest). ↑↓ Enter Esc, тап/клик.
import { useEffect, useId, useRef, useState } from 'react';
import { geoSuggest } from '@/lib/api';
import { MartInput } from '../MartInput';
import type { MethodDemoState, Suggestion } from './types';
import s from '../MartMethodModal.module.css';
import { GEO } from '@/lib/copy';
import { Spinner } from '../ui/Spinner';

const MIN_CHARS = 3;
const DEBOUNCE = 300;

type Status = 'idle' | 'loading' | 'done' | 'error';

export interface AddressFieldProps {
  value: string;
  onChange: (v: string) => void;
  /** id города — подсказки только в его пределах */
  city: string;
  mobile?: boolean;
  /** Выбор подсказки: карта летит к точке без повторного геокодирования. */
  onPick?: (s: Suggestion) => void;
  error?: string;
  /** Витрина: принудительное состояние списка (сеть не трогаем). */
  demoState?: MethodDemoState;
  demoSuggestions?: Suggestion[];
}

export function AddressField({ value, onChange, city, mobile, onPick, error, demoState, demoSuggestions }: AddressFieldProps) {
  const id = useId();
  const listId = id + '-list';
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [idx, setIdx] = useState(demoState === 'suggestOpen' ? 0 : -1);
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const req = useRef(0);

  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(blurTimer.current); }, []);
  // Сменили город — старые подсказки не годятся.
  useEffect(() => { req.current++; clearTimeout(timer.current); setItems([]); setStatus('idle'); setIdx(-1); }, [city]);

  function search(q: string) {
    clearTimeout(timer.current);
    const my = ++req.current;
    if (q.trim().length < MIN_CHARS) { setItems([]); setStatus('idle'); return; }
    setStatus('loading');
    timer.current = setTimeout(async () => {
      try {
        // Ответ сервера может содержать lat/lng = null (см. app/api/geo/geo.server.ts).
        const list = await geoSuggest(q.trim(), city);
        if (my !== req.current) return;
        setItems(list.slice(0, 6)); setStatus('done'); setIdx(-1);
      } catch {
        if (my !== req.current) return;
        setItems([]); setStatus('error');
      }
    }, DEBOUNCE);
  }

  function pick(sg: Suggestion) {
    req.current++; clearTimeout(timer.current);
    // Улица без дома → «Улица, » и курсор остаётся для номера дома.
    const next = sg.hasHouse ? sg.title : sg.title + ', ';
    onChange(next);
    setItems([]); setStatus('idle'); setIdx(-1); setHidden(sg.hasHouse);
    onPick?.(sg);
    if (!sg.hasHouse) requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) { el.focus(); el.setSelectionRange(next.length, next.length); }
    });
  }

  // Витрина: состояние задаётся снаружи.
  const demo = !!demoState;
  const list = demo ? (demoState === 'suggestOpen' ? demoSuggestions || [] : []) : items;
  const st: Status = demo ? (demoState === 'suggestLoading' ? 'loading' : demoState === 'suggestError' ? 'error' : 'done') : status;
  const q = value.trim();
  const open = demo || (focus && !hidden && q.length >= MIN_CHARS && st !== 'idle');
  const showLoading = st === 'loading' && !list.length;
  const showEmpty = (st === 'done' && !list.length) || st === 'error';
  const emptyText = st === 'error'
    ? GEO.suggestUnavailable
    : GEO.suggestEmpty(q);

  // MartInput не принимает aria-* комбобокса — проставляем на сам input.
  useEffect(() => {
    const el = inputRef.current; if (!el) return;
    el.setAttribute('role', 'combobox');
    el.setAttribute('aria-autocomplete', 'list');
    el.setAttribute('aria-controls', listId);
    el.setAttribute('aria-expanded', String(open && list.length > 0));
    if (open && idx >= 0 && idx < list.length) el.setAttribute('aria-activedescendant', `${listId}-${idx}`);
    else el.removeAttribute('aria-activedescendant');
  }, [open, idx, list.length, listId]);

  function onKey(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setHidden(true); return; }
    if (!list.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((idx + 1) % list.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(idx <= 0 ? list.length - 1 : idx - 1); }
    else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); pick(list[idx]); }
  }

  return (
    <div className={s.field}>
      <MartInput ref={inputRef} label="Улица, дом" required value={value} error={error} autoComplete="off"
        onChange={v => { onChange(v); setHidden(false); if (!demo) search(v); }}
        onFocus={() => { clearTimeout(blurTimer.current); setFocus(true); }}
        onBlur={() => { blurTimer.current = setTimeout(() => { setFocus(false); setIdx(-1); }, 150); }}
        onKeyDown={onKey} />
      {open && (
        <div id={listId} role={list.length ? 'listbox' : undefined} aria-label="Подсказки адреса" aria-live="polite" className={s.list}>
          {showLoading && <div className={s.status}><Spinner size={14} variant="track" />Ищем адрес…</div>}
          {showEmpty && <div className={s.empty}>{emptyText}</div>}
          {list.map((sg, i) => (
            <button key={sg.title + sg.subtitle} id={`${listId}-${i}`} type="button" role="option" tabIndex={-1} aria-selected={i === idx}
              className={`${s.opt} ${mobile ? s.mobile : ''} ${i === idx ? s.active : ''}`}
              onMouseDown={e => e.preventDefault()} onMouseEnter={() => setIdx(i)} onClick={() => pick(sg)}>
              <span className={s.optPin} aria-hidden />
              <span className={s.optText}>
                <span className={s.optTitle}>{sg.title}</span>
                {sg.subtitle && <span className={s.optSub}>{sg.subtitle}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
