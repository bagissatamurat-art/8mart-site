'use client';
// Поиск адреса — отдельное окно поверх выбора способа: поле, ниже города чипсами, подсказки с подсветкой совпадения.
// Подсказки — только в выбранном городе (точнее и меньше запросов к DaData), с 3 символов, debounce 300 мс,
// кэш «город + запрос», устаревший запрос отменяется. Mobile — на весь экран, desktop — диалог 560 по центру.
// Улица без дома → в поле «Улица, » и курсор для номера дома; с домом — окно закрывается, карта летит к дому.
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { geoSuggest } from '@/lib/api';
import { GEO } from '@/lib/copy';
import { useModal } from '@/lib/hooks/useModal';
import { useMounted } from '@/lib/hooks/useMounted';
import type { City } from '@/lib/types';
import { MartChip } from '../MartChip';
import { Chevron, Cross } from '../ui/Cross';
import { Spinner } from '../ui/Spinner';
import type { MethodDemoState, Suggestion } from './types';
import s from './AddressSearch.module.css';

const MIN_CHARS = 3;
const DEBOUNCE = 300;
const LIMIT = 8;
/** Ответы подсказок за сессию: повторный ввод того же текста в том же городе — без запроса. */
const cache = new Map<string, Suggestion[]>();

type Status = 'idle' | 'loading' | 'done' | 'error';

const escapeRe = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Подсветка: куски текста, совпавшие с началами слов запроса («каб 11» → **Каб**анбай батыра, **11**). */
export function highlight(text: string, q: string, cls: string): React.ReactNode {
  const words = (q.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).sort((a, b) => b.length - a.length);
  if (!words.length) return text;
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${words.map(escapeRe).join('|')})`, 'giu');
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i} className={cls}>{part}</mark> : part));
}

export interface AddressSearchProps {
  open: boolean;
  mobile: boolean;
  /** Текущий адрес из модалки — с него начинается поиск. */
  value: string;
  cities: City[];
  city: City | undefined;
  onCity: (id: string) => void;
  /** Выбран дом: окно закроется, адрес и координаты уходят в модалку. */
  onPick: (sg: Suggestion) => void;
  onClose: () => void;
  // ── Витрина /kit ──
  inline?: boolean;
  demoState?: MethodDemoState;
  demoSuggestions?: Suggestion[];
}

export function AddressSearch(props: AddressSearchProps) {
  if (!props.open) return null;
  return <SearchDialog {...props} />;
}

function SearchDialog({ mobile, value, cities, city, onCity, onPick, onClose, inline, demoState, demoSuggestions }: AddressSearchProps) {
  const mounted = useMounted();
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(value);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [idx, setIdx] = useState(-1);

  useModal({ active: !inline && mounted, ref: box, onClose, initialFocus: () => input.current });

  // Курсор — в конец текста (поле открывается с уже введённым адресом).
  useEffect(() => {
    const el = input.current;
    if (el && !inline) el.setSelectionRange(el.value.length, el.value.length);
  }, [inline]);

  const demo = !!demoState;
  const query = q.trim();
  useEffect(() => {
    if (demo) return;
    if (query.length < MIN_CHARS || !city) { setItems([]); setStatus('idle'); return; }
    const key = `${city.id}|${query.toLowerCase()}`;
    const hit = cache.get(key);
    if (hit) { setItems(hit); setStatus('done'); setIdx(-1); return; }
    setStatus('loading');
    const ctl = new AbortController();
    const t = setTimeout(() => {
      geoSuggest(query, city.id, ctl.signal).then(list => {
        const rows = list.slice(0, LIMIT);
        cache.set(key, rows);
        setItems(rows); setStatus('done'); setIdx(-1);
      }, () => { if (!ctl.signal.aborted) { setItems([]); setStatus('error'); } });
    }, DEBOUNCE);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [query, city, demo]);

  const list = demo ? (demoState === 'suggestOpen' ? demoSuggestions ?? [] : []) : items;
  const st: Status = demo ? (demoState === 'suggestLoading' ? 'loading' : demoState === 'suggestError' ? 'error' : 'done') : status;
  const shownQ = demo ? (value || 'Кабанбай') : query;

  function pick(sg: Suggestion) {
    if (sg.hasHouse) { onPick(sg); return; }
    // Улица без дома — дописать номер: «Улица, » и курсор в конец.
    const next = sg.title + ', ';
    setQ(next);
    requestAnimationFrame(() => { const el = input.current; if (el) { el.focus(); el.setSelectionRange(next.length, next.length); } });
  }

  function onKey(e: React.KeyboardEvent) {
    if (!list.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((idx + 1) % list.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(idx <= 0 ? list.length - 1 : idx - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(list[Math.max(0, idx)]); }
  }

  const busy = st === 'loading';
  const dialog = (
    <div ref={box} role="dialog" aria-modal={inline ? undefined : true} aria-label={GEO.searchTitle}
      className={`${s.dialog} ${mobile ? s.mobile : ''} ${inline ? s.inline : ''}`}>
      <div className={s.head}>
        {mobile && (
          <button type="button" className={s.iconBtn} aria-label="Назад" onClick={onClose}>
            <Chevron size={10} color="var(--ink-1)" direction="left" />
          </button>
        )}
        <h2 className={s.title}>{GEO.searchTitle}</h2>
        {!mobile && (
          <button type="button" className={s.iconBtn} aria-label="Закрыть" onClick={onClose}>
            <Cross size={14} color="var(--ink-1)" />
          </button>
        )}
      </div>

      <div className={s.field}>
        <span className={s.fieldPin} aria-hidden />
        <input ref={input} className={s.input} value={demo ? shownQ : q} placeholder={GEO.searchPlaceholder} autoComplete="off"
          enterKeyHint="search" role="combobox" aria-autocomplete="list" aria-expanded={list.length > 0} aria-controls={listId}
          aria-activedescendant={idx >= 0 && idx < list.length ? `${listId}-${idx}` : undefined} aria-label={GEO.searchPlaceholder}
          onChange={e => { setQ(e.target.value); setIdx(-1); }} onKeyDown={onKey} readOnly={demo} />
        {busy ? <span className={s.fieldEnd}><Spinner size={16} variant="track" /></span>
          : q && !demo && (
            <button type="button" className={`${s.fieldEnd} ${s.clear}`} aria-label="Очистить" onClick={() => { setQ(''); input.current?.focus(); }}>
              <Cross size={10} color="#fff" />
            </button>
          )}
      </div>

      {cities.length > 1 && (
        <div className={s.cities} role="group" aria-label={GEO.searchCity}>
          {cities.map(c => <MartChip key={c.id} label={c.name} selected={c.id === city?.id} onClick={() => { if (c.id !== city?.id) onCity(c.id); }} />)}
        </div>
      )}

      <div className={s.body}>
        {st === 'idle' && !list.length && city && <p className={s.hint}>{GEO.searchHint(city.name)}</p>}
        {busy && !list.length && (
          <div className={s.skeleton} aria-label="Ищем адрес" role="status">
            {[0, 1, 2, 3].map(i => <span key={i} className={s.skelRow}><span /><span /></span>)}
          </div>
        )}
        {st === 'done' && !list.length && <p className={s.hint}>{GEO.suggestEmpty(shownQ)}</p>}
        {st === 'error' && <p className={s.hint}>{GEO.suggestUnavailable}</p>}
        {list.length > 0 && (
          <div id={listId} role="listbox" aria-label="Подсказки адреса" className={`${s.list} ${busy ? s.stale : ''}`}>
            {list.map((sg, i) => (
              <button key={sg.title + sg.subtitle} id={`${listId}-${i}`} type="button" role="option" tabIndex={-1} aria-selected={i === idx}
                className={`${s.opt} ${i === idx ? s.active : ''}`} onMouseDown={e => e.preventDefault()} onMouseEnter={() => setIdx(i)} onClick={() => pick(sg)}>
                <span className={s.optPin} aria-hidden />
                <span className={s.optText}>
                  <span className={s.optTitle}>{highlight(sg.title, shownQ, s.mark)}</span>
                  <span className={s.optSub}>{sg.hasHouse ? sg.subtitle : GEO.addHouse}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={s.foot}>
        <button type="button" className={s.mapBtn} onClick={onClose}>
          <span className={s.mapIco} aria-hidden />{GEO.pickOnMap}
        </button>
      </div>
    </div>
  );

  if (inline) return dialog;
  if (!mounted) return null;
  return createPortal(
    <div className={`${s.overlay} ${mobile ? s.mobile : ''}`} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>{dialog}</div>,
    document.body,
  );
}
