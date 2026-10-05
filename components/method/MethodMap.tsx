'use client';
// Карта MartMethodModal: Mapbox GL в iframe (public/map.html), сообщения postMessage `8mart-map` ↔ `8mart-parent`.
// Логика синхронизации — sync() из site/MartMethodModal.dc.html. Нет токена / карта не загрузилась / витрина →
// статичная заглушка: пин по центру (доставка) или точки списка (самовывоз), остальная модалка работает.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { City, Method, PickupPoint } from '@/lib/types';
import type { LatLng } from './types';
import s from '../MartMethodModal.module.css';
import { GEO } from '@/lib/copy';
import { asset } from '@/lib/basePath';

export interface MethodMapHandle {
  /** Перелёт к точке; quiet — подпись над пином без повторного геокодирования. */
  flyTo(lat: number, lng: number, zoom?: number, quiet?: string): void;
  /** Запросить геолокацию (кнопка «Показать ближайшие»). */
  locate(): void;
}

export interface MethodMapProps {
  mode: Method;
  city: City;
  points: PickupPoint[];
  selected: string | null;
  /** Стартовая точка и подпись (initial из стора) */
  start?: { lat: number; lng: number; label?: string } | null;
  compact?: boolean;
  /** Без iframe — только заглушка (витрина). */
  staticMap?: boolean;
  /** Подпись над пином в заглушке (адрес) */
  label?: string;
  geo?: LatLng | null;
  onMoving?: () => void;
  onAddress?: (a: { lat: number; lng: number; street: string; failed?: boolean }) => void;
  onPick?: (id: string) => void;
  onGeo?: (g: LatLng) => void;
  children?: React.ReactNode;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

type MapMsg = { src?: string; id?: string; type?: string; pointId?: string; lat?: number; lng?: number; street?: string; failed?: boolean };

export const MethodMap = forwardRef<MethodMapHandle, MethodMapProps>(function MethodMap(
  { mode, city, points, selected, start, compact, staticMap, label, geo, onMoving, onAddress, onPick, onGeo, children }, ref,
) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [failed, setFailed] = useState(!TOKEN);
  const [ready, setReady] = useState(false);
  const live = !staticMap && !failed;
  const [mapId] = useState(() => Math.random().toString(36).slice(2, 8));
  // src фиксируется один раз — дальше режим/город меняем сообщениями, без перезагрузки карты.
  const [src] = useState(() => {
    const c = start ?? city;
    const q = new URLSearchParams({ token: TOKEN, mode, lat: String(c.lat), lng: String(c.lng), zoom: '15', id: mapId });
    if (compact) q.set('compact', '1');
    if (start?.label) q.set('quiet', start.label);
    if (selected) q.set('selected', selected);
    return asset('/map.html') + '?' + q;
  });

  const post = (m: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage({ src: '8mart-parent', ...m }, window.location.origin);
  };

  // Колбэки — через ref, чтобы слушатель сообщений не пересоздавался.
  const cb = useRef({ onMoving, onAddress, onPick, onGeo });
  cb.current = { onMoving, onAddress, onPick, onGeo };

  useEffect(() => {
    if (!live) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const m = (e.data || {}) as MapMsg;
      if (m.src !== '8mart-map' || m.id !== mapId) return;
      if (m.type === 'ready') setReady(true);
      else if (m.type === 'error') setFailed(true);
      else if (m.type === 'moving') cb.current.onMoving?.();
      else if (m.type === 'address' && m.lat != null && m.lng != null) cb.current.onAddress?.({ lat: m.lat, lng: m.lng, street: m.street || '', failed: m.failed });
      else if (m.type === 'pick' && m.pointId) cb.current.onPick?.(m.pointId);
      else if (m.type === 'geo' && m.lat != null && m.lng != null) cb.current.onGeo?.({ lat: m.lat, lng: m.lng });
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [live, mapId]);

  // Смена режима / города / набора точек → перецентровать (pickup — вписать все точки, delivery — центр города).
  const firstSync = useRef(true);
  useEffect(() => {
    if (!live || !ready) return;
    const msg: Record<string, unknown> = { mode, points, selected };
    // Первая синхронизация после загрузки: стартовую точку из initial не сбиваем.
    const keep = firstSync.current && !!start;
    firstSync.current = false;
    if (!keep) {
      if (mode === 'pickup' && points.length) msg.fit = true;
      else { msg.lat = city.lat; msg.lng = city.lng; msg.zoom = 15; }
    }
    post(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, ready, mode, city.id, points]);

  // Выбрали точку в списке → карта летит к ней.
  useEffect(() => {
    if (!live || !ready || mode !== 'pickup') return;
    const p = points.find(x => x.id === selected);
    post(p ? { selected, lat: p.lat, lng: p.lng, zoom: 15 } : { selected });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useImperativeHandle(ref, () => ({
    flyTo(lat, lng, zoom, quiet) { if (live && ready) post({ lat, lng, zoom, quiet }); },
    locate() {
      if (live && ready) { post({ locate: true }); return; }
      navigator.geolocation?.getCurrentPosition(p => cb.current.onGeo?.({ lat: p.coords.latitude, lng: p.coords.longitude }));
    },
  }));

  return (
    <div className={s.map}>
      {live
        ? <iframe ref={frame} src={src} title="Карта" className={s.frame} allow="geolocation" />
        : <MapFallback mode={mode} points={points} selected={selected} geo={geo} onPick={onPick}
            label={label} note={staticMap ? undefined : GEO.mapUnavailable} />}
      {children}
    </div>
  );
});

/** Заглушка карты: «кварталы», пин по центру / точки, спроецированные в рамку по их координатам. */
function MapFallback({ mode, points, selected, geo, onPick, label, note }: {
  mode: Method; points: PickupPoint[]; selected: string | null; geo?: LatLng | null; onPick?: (id: string) => void; label?: string; note?: string;
}) {
  const all = [...points, ...(geo && mode === 'pickup' ? [geo] : [])];
  const lats = all.map(p => p.lat), lngs = all.map(p => p.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  // Поля 15% по краям; сверху больше — там кнопка города.
  const pos = (p: LatLng) => ({
    left: `${15 + (maxLng === minLng ? .5 : (p.lng - minLng) / (maxLng - minLng)) * 70}%`,
    top: `${25 + (maxLat === minLat ? .5 : (maxLat - p.lat) / (maxLat - minLat)) * 60}%`,
  });
  return (
    <div className={s.fallback}>
      {mode === 'delivery' ? (
        <>
          <div className={`${s.tip} ${label ? '' : s.muted}`}>{label || 'Двигайте карту, чтобы указать дом'}</div>
          <div className={s.pin} aria-hidden><div className={s.pinHead} /><div className={s.pinLeg} /></div>
          <div className={s.pinShadow} aria-hidden />
        </>
      ) : (
        <>
          {points.map(p => (
            <button key={p.id} type="button" className={`${s.pp} ${p.id === selected ? s.sel : ''}`} style={pos(p)}
              aria-label={p.name} aria-pressed={p.id === selected} onClick={() => onPick?.(p.id)} />
          ))}
          {geo && <span className={s.me} style={pos(geo)} aria-hidden />}
        </>
      )}
      {note && <div className={s.fallbackNote}>{note}</div>}
    </div>
  );
}
