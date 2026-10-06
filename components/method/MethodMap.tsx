'use client';
// Карта MartMethodModal. Сначала — картинка Mapbox Static Images (лёгкая, без Mapbox GL): пин доставки поверх,
// маркеры точек самовывоза — в самой картинке; кнопки «+ / − / моё местоположение» — те же на вид.
// Интерактивная карта (Mapbox GL в iframe public/map.html, postMessage `8mart-map` ↔ `8mart-parent`) догружается
// при первом касании модалки (или кнопок карты) — так новый посетитель не платит ~0,5 с блокировки за GL сразу.
// Нет токена / карта не загрузилась / витрина → статичная заглушка (MapFallback), модалка работает.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { geoReverse } from '@/lib/api';
import type { City, Method, PickupPoint } from '@/lib/types';
import type { LatLng } from './types';
import s from '../MartMethodModal.module.css';
import { GEO } from '@/lib/copy';
import { asset } from '@/lib/basePath';

export interface MethodMapHandle {
  /** Перелёт к точке; quiet — адрес уже известен (выбран в поиске), повторно по пину не определяем. */
  flyTo(lat: number, lng: number, zoom?: number, quiet?: string): void;
}

export interface MethodMapProps {
  mode: Method;
  city: City;
  points: PickupPoint[];
  selected: string | null;
  /** Стартовая точка и подпись (initial из стора) */
  start?: { lat: number; lng: number; label?: string } | null;
  /** id точек, закрытых сейчас — маркеры серые. */
  closed?: string[];
  /** Адрес уже известен (сохранённый, даже без координат) — при загрузке не определять его по центру карты. */
  keepAddress?: boolean;
  compact?: boolean;
  /** Без iframe — только заглушка (витрина). */
  staticMap?: boolean;
  /** Сначала картинка, интерактивная карта — по первому касанию (модалка открылась сама). Иначе — сразу интерактивная. */
  lazy?: boolean;
  geo?: LatLng | null;
  onMoving?: () => void;
  onAddress?: (a: { lat: number; lng: number; street: string; hasHouse: boolean; failed?: boolean }) => void;
  onPick?: (id: string) => void;
  onGeo?: (g: LatLng) => void;
  children?: React.ReactNode;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const STYLE = 'mapbox/streets-v12'; // как в public/map.html
const ZOOM = 15;

type MapMsg = { src?: string; id?: string; type?: string; pointId?: string; lat?: number; lng?: number; street?: string; hasHouse?: boolean; failed?: boolean };
type View = { lat: number; lng: number; zoom: number };

/** URL картинки Static Images: доставка — центр и зум; самовывоз — маркеры и «auto» (вписать все точки). */
function staticUrl(mode: Method, view: View, points: PickupPoint[], selected: string | null, closed: string[], w: number, h: number) {
  const size = `${w}x${h}@2x`;
  const q = `access_token=${TOKEN}&padding=48`;
  if (mode === 'pickup' && points.length) {
    const pins = points.map(p => `pin-${p.id === selected ? 'l' : 's'}+${closed.includes(p.id) ? 'a9a6b0' : 'ee1d74'}(${p.lng.toFixed(5)},${p.lat.toFixed(5)})`).join(',');
    return `https://api.mapbox.com/styles/v1/${STYLE}/static/${pins}/auto/${size}?${q}`;
  }
  return `https://api.mapbox.com/styles/v1/${STYLE}/static/${view.lng.toFixed(5)},${view.lat.toFixed(5)},${view.zoom}/${size}?access_token=${TOKEN}`;
}

export const MethodMap = forwardRef<MethodMapHandle, MethodMapProps>(function MethodMap(
  { mode, city, points, selected, start, keepAddress, closed, compact, staticMap, lazy, geo, onMoving, onAddress, onPick, onGeo, children }, ref,
) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [failed, setFailed] = useState(!TOKEN);
  const live = !staticMap && !failed;
  /** Интерактивная карта смонтирована (после первого касания). */
  const [interactive, setInteractive] = useState(!lazy);
  /** Адрес центра уже известен (initial или определён без GL) — интерактивной карте не нужно спрашивать его при загрузке. */
  const addressKnown = useRef(!!start?.label || !!keepAddress);
  const [ready, setReady] = useState(false);
  const [mapId] = useState(() => Math.random().toString(36).slice(2, 8));
  const [view, setView] = useState<View>(() => ({ lat: (start ?? city).lat, lng: (start ?? city).lng, zoom: ZOOM }));
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const closedList = closed ?? [];

  // Размер картинки = размер блока карты (кратно 10, не больше 1280 — предел Static Images).
  useEffect(() => {
    const el = box.current; if (!el || !live) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const w = Math.min(1280, Math.ceil(r.width / 10) * 10), h = Math.min(1280, Math.ceil(r.height / 10) * 10);
      if (w > 0 && h > 0) setSize(prev => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [live]);

  // Колбэки — через ref, чтобы слушатели не пересоздавались.
  const cb = useRef({ onMoving, onAddress, onPick, onGeo });
  cb.current = { onMoving, onAddress, onPick, onGeo };

  // ── Без GL: адрес по центру при открытии (как делала бы карта) и после смены города ──
  const reverse = (lat: number, lng: number) => {
    cb.current.onMoving?.();
    geoReverse(lat, lng)
      .then(a => cb.current.onAddress?.({ lat, lng, street: a?.address || '', hasHouse: !!a?.hasHouse }))
      .catch(() => cb.current.onAddress?.({ lat, lng, street: '', hasHouse: false, failed: true }));
  };
  const opened = useRef(false);
  useEffect(() => {
    if (!live || interactive || opened.current) return;
    opened.current = true;
    if (mode === 'delivery' && !start && !keepAddress) { addressKnown.current = true; reverse(view.lat, view.lng); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  // Догрузить интерактивную карту при первом касании модалки (или кнопок карты).
  const pendingAction = useRef<Record<string, unknown> | null>(null);
  const upgrade = (action?: Record<string, unknown>) => {
    if (action) pendingAction.current = action;
    setInteractive(true);
  };
  useEffect(() => {
    if (!live || interactive) return;
    const dialog = box.current?.closest('[role="dialog"], [role="group"]') ?? document;
    const on = () => upgrade();
    dialog.addEventListener('pointerdown', on, { once: true, capture: true });
    dialog.addEventListener('keydown', on, { once: true, capture: true });
    return () => { dialog.removeEventListener('pointerdown', on, { capture: true }); dialog.removeEventListener('keydown', on, { capture: true }); };
  }, [live, interactive]);

  const post = (m: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage({ src: '8mart-parent', ...m }, window.location.origin);
  };

  useEffect(() => {
    if (!live || !interactive) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const m = (e.data || {}) as MapMsg;
      if (m.src !== '8mart-map' || m.id !== mapId) return;
      if (m.type === 'ready') setReady(true);
      else if (m.type === 'error') setFailed(true);
      else if (m.type === 'moving') cb.current.onMoving?.();
      else if (m.type === 'address' && m.lat != null && m.lng != null) cb.current.onAddress?.({ lat: m.lat, lng: m.lng, street: m.street || '', hasHouse: !!m.hasHouse, failed: m.failed });
      else if (m.type === 'pick' && m.pointId) cb.current.onPick?.(m.pointId);
      else if (m.type === 'geo' && m.lat != null && m.lng != null) cb.current.onGeo?.({ lat: m.lat, lng: m.lng });
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [live, interactive, mapId]);

  // Смена режима / города / набора точек → перецентровать (pickup — вписать все точки, delivery — центр города).
  const firstSync = useRef(true);
  const prevCity = useRef(city.id);
  useEffect(() => {
    // Без GL: доставка — центр нового города (и его адрес); самовывоз картинка вписывает точки сама.
    if (prevCity.current !== city.id) {
      prevCity.current = city.id;
      if (!interactive) { setView({ lat: city.lat, lng: city.lng, zoom: ZOOM }); if (mode === 'delivery') reverse(city.lat, city.lng); }
    }
    if (!live || !ready) return;
    const msg: Record<string, unknown> = { mode, points, selected, closed: closedList };
    // Первая синхронизация после загрузки: точку, с которой открылась карта, не сбиваем.
    const keep = firstSync.current;
    firstSync.current = false;
    if (!keep) {
      if (mode === 'pickup' && points.length) msg.fit = true;
      else { msg.lat = city.lat; msg.lng = city.lng; msg.zoom = ZOOM; }
    } else if (mode === 'pickup' && points.length) msg.fit = true;
    post(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, ready, mode, city.id, points]);

  // Статусы точек (открыто/закрыто) поменялись — перекрасить маркеры без перецентровки карты.
  const closedKey = closedList.join(',');
  useEffect(() => {
    if (!live || !ready) return;
    post({ closed: closedList });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, ready, closedKey]);

  // Выбрали точку в списке → карта летит к ней.
  useEffect(() => {
    if (!live || !ready || mode !== 'pickup') return;
    const p = points.find(x => x.id === selected);
    post(p ? { selected, lat: p.lat, lng: p.lng, zoom: ZOOM } : { selected });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Карта готова — выполнить отложенное: перелёт (адрес выбран до загрузки) и нажатую кнопку (+ / − / геолокация).
  const pendingFly = useRef<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (!live || !ready) return;
    if (pendingFly.current) { post(pendingFly.current); pendingFly.current = null; }
    if (pendingAction.current) { post(pendingAction.current); pendingAction.current = null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, ready]);

  useImperativeHandle(ref, () => ({
    flyTo(lat, lng, zoom, quiet) {
      if (live && ready) { post({ lat, lng, zoom, quiet }); return; }
      // Без GL — просто новый центр картинки; GL (если грузится) перелетит после загрузки.
      setView({ lat, lng, zoom: zoom ?? ZOOM });
      if (live) pendingFly.current = { lat, lng, zoom, quiet };
    },
  }));

  // src интерактивной карты — от текущего центра в момент первого касания.
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (!interactive || src) return;
    const q = new URLSearchParams({ token: TOKEN, mode, lat: String(view.lat), lng: String(view.lng), zoom: String(view.zoom), id: mapId });
    if (compact) q.set('compact', '1');
    if (addressKnown.current) q.set('quiet', start?.label || '1'); // адрес центра уже определён — повторно не спрашиваем
    if (selected) q.set('selected', selected);
    setSrc(asset('/map.html') + '?' + q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  if (!live) {
    return (
      <div className={s.map}>
        <MapFallback mode={mode} points={points} selected={selected} geo={geo} onPick={onPick}
          closed={closed} note={staticMap ? undefined : GEO.mapUnavailable} />
        {children}
      </div>
    );
  }

  const showImage = !ready;
  return (
    <div ref={box} className={s.map}>
      {showImage && size && <StaticCanvas url={staticUrl(mode, view, points, selected, closedList, size.w, size.h)} onError={() => setFailed(true)} />}
      {showImage && mode === 'delivery' && (
        <>
          <div className={s.pin} aria-hidden><div className={s.pinHead} /><div className={s.pinLeg} /></div>
          <div className={s.pinShadow} aria-hidden />
        </>
      )}
      {showImage && (
        <div className={`${s.sCtl} ${compact ? s.sCtlCompact : ''}`}>
          <div className={s.sZoom}>
            <button type="button" aria-label="Приблизить" onClick={() => upgrade({ zoomBy: 1 })}><svg viewBox="0 0 20 20"><path d="M10 4.5v11M4.5 10h11" /></svg></button>
            <button type="button" aria-label="Отдалить" onClick={() => upgrade({ zoomBy: -1 })}><svg viewBox="0 0 20 20"><path d="M4.5 10h11" /></svg></button>
          </div>
          <button type="button" className={s.sLocate} aria-label="Моё местоположение" onClick={() => upgrade({ locate: true })}>
            <svg viewBox="0 0 20 20"><path d="M16.8 3.2 3.6 8.6c-.6.3-.6 1.2.1 1.4l5.1 1.3 1.3 5.1c.2.7 1.1.7 1.4.1z" /></svg>
          </button>
        </div>
      )}
      {interactive && src && (
        <iframe ref={frame} src={src} title="Карта" className={`${s.frame} ${ready ? '' : s.frameLoading}`} allow="geolocation" />
      )}
      {children}
    </div>
  );
});

/** Картинка карты на <canvas>, как и интерактивная карта (canvas) — не «главное содержимое» страницы для метрик LCP:
 *  модалка открывается поверх главной уже после загрузки. Новую картинку рисуем, когда она загрузилась (без мигания). */
function StaticCanvas({ url, onError }: { url: string; onError: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    const img = new Image();
    img.onload = () => {
      const c = ref.current; if (!live || !c) return;
      const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
      // object-fit: cover
      const k = Math.max(c.width / img.width, c.height / img.height), w = img.width * k, h = img.height * k;
      c.getContext('2d')?.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
    };
    img.onerror = () => { if (live) onError(); };
    img.src = url;
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  return <canvas ref={ref} className={s.staticMap} aria-hidden />;
}

/** Заглушка карты: «кварталы», пин по центру / точки, спроецированные в рамку по их координатам. */
function MapFallback({ mode, points, selected, geo, onPick, note, closed }: {
  mode: Method; points: PickupPoint[]; selected: string | null; geo?: LatLng | null; onPick?: (id: string) => void; note?: string; closed?: string[];
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
          <div className={s.pin} aria-hidden><div className={s.pinHead} /><div className={s.pinLeg} /></div>
          <div className={s.pinShadow} aria-hidden />
        </>
      ) : (
        <>
          {points.map(p => (
            <button key={p.id} type="button" className={`${s.pp} ${p.id === selected ? s.sel : ''} ${closed?.includes(p.id) ? s.ppClosed : ''}`} style={pos(p)}
              aria-label={p.name} aria-pressed={p.id === selected} onClick={() => onPick?.(p.id)} />
          ))}
          {geo && <span className={s.me} style={pos(geo)} aria-hidden />}
        </>
      )}
      {note && <div className={s.fallbackNote}>{note}</div>}
    </div>
  );
}
