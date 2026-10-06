'use client';
// Самовывоз: список точек города, синхронный с маркерами карты (site/MartMethodModal.dc.html).
// При известной геолокации — расстояние, сортировка «сначала ближние» и метка «Ближайшая»; иначе — по алфавиту.
import { useEffect, useRef } from 'react';
import { plural } from '@/lib/domain/format';
import type { PickupPoint } from '@/lib/types';
import type { LatLng } from './types';
import s from '../MartMethodModal.module.css';
import { GEO } from '@/lib/copy';
import { RadioMark } from '../ui/Marks';

/** Расстояние по гаверсинусу, км. */
const km = (a: LatLng, b: LatLng) => {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const distText = (d: number) => (d < 1 ? Math.round(d * 1000) + ' м' : d.toFixed(1).replace('.', ',') + ' км');

export function PickupList({ points, selected, geo, cityName, loaded = true, onPick, onAskGeo }: {
  points: PickupPoint[];
  selected: string | null;
  geo: LatLng | null;
  cityName: string;
  /** false — точки ещё грузятся (не показываем «нет точек»). */
  loaded?: boolean;
  onPick: (id: string) => void;
  onAskGeo: () => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  const rows = points
    .map(p => ({ ...p, d: geo ? km(geo, p) : null }))
    .sort((a, b) => (a.d != null && b.d != null ? a.d - b.d : a.name.localeCompare(b.name, 'ru')));

  // Выбрали маркер на карте — прокрутить список к точке.
  useEffect(() => {
    const l = list.current; if (!l || !selected) return;
    const el = l.querySelector<HTMLElement>(`[data-store="${CSS.escape(selected)}"]`);
    if (!el) return;
    const top = el.offsetTop - l.offsetTop;
    if (top < l.scrollTop || top + el.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = top - 8;
  }, [selected, points.length]);

  return (
    <div className={s.pickup}>
      {loaded && points.length === 0 && (
        <div className={s.warn}>{GEO.noPickupPoints(cityName)}</div>
      )}
      {points.length > 0 && (
        <div className={s.count}>
          <span>{rows.length} {plural(rows.length, 'точка', 'точки', 'точек')} · {geo ? 'сначала ближние' : 'по алфавиту'}</span>
          {!geo && (
            <button type="button" className={s.nearBtn} onClick={onAskGeo}>
              <span className={s.geoIcon} aria-hidden />{GEO.nearest}
            </button>
          )}
        </div>
      )}
      <div ref={list} className={s.stores} role="radiogroup" aria-label="Точки самовывоза">
        {rows.map((p, i) => {
          const sel = p.id === selected;
          return (
            <button key={p.id} type="button" role="radio" aria-checked={sel} data-store={p.id}
              className={`${s.store} ${sel ? s.sel : ''}`} onClick={() => onPick(p.id)}>
              <span className={s.storeIco} aria-hidden><span className={s.storePin} /></span>
              <span className={s.storeText}>
                <span className={s.storeName}><span>{p.name}</span>{geo && i === 0 && <span className={s.nearest}>Ближайшая</span>}</span>
                <span className={s.storeMeta}>
                  {p.d != null && <span className={s.storeDist}>{distText(p.d)}</span>}
                  <span>{p.hours}</span>
                </span>
              </span>
              <RadioMark on={sel} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
