'use client';
// MartMethodModal — COMPONENTS.md → MartMethodModal; DESIGN_RULES → «Выбор способа получения», «Подсказки адреса».
// Референс: site/MartMethodModal.dc.html, «04 Выбор способа получения.dc.html», карта — public/map.html (порт site/map.html).
// На весь экран: desktop — карта на всё окно, панель 420 справа; mobile — карта сверху (доставка — всё, что выше панели;
// самовывоз — четверть экрана, остальное список точек). Адрес ищется в отдельном окне (AddressSearch) по выбранному городу.
// Подъезд и квартира — на оформлении; здесь только в addressOnly (адресная книга кабинета).
// Закрыть можно всегда: крестик, Esc, клик по фону. addressOnly — режим для кабинета (без свича, с полем «Название»).
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getCities, getPickupPoints } from '@/lib/api';
import { DELIVERY } from '@/lib/config';
import { tg } from '@/lib/domain/format';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useModal } from '@/lib/hooks/useModal';
import { useMounted } from '@/lib/hooks/useMounted';
import type { City, Method, PickupPoint } from '@/lib/types';
import { MartButton } from './MartButton';
import { MartInput } from './MartInput';
import { Cross } from './ui/Cross';
import { AddressField } from './method/AddressField';
import { AddressSearch } from './method/AddressSearch';
import { CitySelect } from './method/CitySelect';
import { MethodMap, type MethodMapHandle } from './method/MethodMap';
import { PickupList } from './method/PickupList';
import type { LatLng, MethodValue, Suggestion } from './method/types';
import s from './MartMethodModal.module.css';

export type { MethodValue, MethodDemoState, Suggestion } from './method/types';

export interface MartMethodModalProps {
  open: boolean;
  /** auto — по брейкпоинту 1024 (ниже — sheet). */
  mode?: 'desktop' | 'mobile' | 'auto';
  /** Текущее значение стора `method` — с него стартует модалка. */
  initial?: Partial<MethodValue>;
  /** Кабинет: только адрес доставки, без свича, с полем «Название». */
  addressOnly?: boolean;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onClose: () => void;
  onConfirm: (value: MethodValue) => void;
  // ── Витрина /kit ──
  /** Рендер в потоке страницы: без оверлея, портала, фокус-ловушки и блокировки скролла. */
  inline?: boolean;
  /** Не грузить Mapbox — показать заглушку карты. */
  staticMap?: boolean;
  /** Известная геолокация (расстояния до точек и «Ближайшая»). */
  userGeo?: LatLng | null;
}

const NO_POINTS: PickupPoint[] = [];

export function MartMethodModal(props: MartMethodModalProps) {
  if (!props.open) return null;
  return <MethodDialog {...props} />;
}

function MethodDialog({
  mode = 'auto', initial, addressOnly, title, subtitle, ctaLabel, onClose, onConfirm,
  inline, staticMap, userGeo,
}: MartMethodModalProps) {
  const autoMobile = useIsMobile();
  const mounted = useMounted();
  const mobile = mode === 'mobile' || (mode === 'auto' && autoMobile);
  const titleId = useId(), subId = useId();
  const card = useRef<HTMLDivElement>(null);
  const map = useRef<MethodMapHandle>(null);

  const [cities, setCities] = useState<City[]>([]);
  const [tab, setTab] = useState<Method>(addressOnly ? 'delivery' : initial?.method ?? 'delivery');
  const [cityId, setCityId] = useState(initial?.city || 'astana');
  const [street, setStreet] = useState(initial?.method !== 'pickup' ? initial?.address ?? '' : '');
  const [entrance, setEntrance] = useState(initial?.entrance ?? '');
  const [flat, setFlat] = useState(initial?.flat ?? '');
  const [addrTitle, setAddrTitle] = useState(initial?.title ?? '');
  const [store, setStore] = useState<string | null>(initial?.pickupPointId ?? null);
  const [pos, setPos] = useState<LatLng | null>(
    initial?.method !== 'pickup' && initial?.lat != null && initial?.lng != null ? { lat: initial.lat, lng: initial.lng } : null);
  const [geo, setGeo] = useState<LatLng | null>(userGeo ?? null);
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [pointsLoaded, setPointsLoaded] = useState(false);
  // Стартовая точка карты — только из initial (доставка с координатами), фиксируется при открытии.
  const [start] = useState(() => (pos ? { ...pos, label: street || undefined } : null));

  useEffect(() => { let on = true; getCities().then(c => on && setCities(c)); return () => { on = false; }; }, []);
  // initial.city может прийти названием — приводим к id.
  const city = cities.find(c => c.id === cityId || c.name === cityId) ?? cities[0];
  const cid = city?.id;

  useEffect(() => {
    if (!cid) return;
    let on = true;
    setPointsLoaded(false);
    getPickupPoints(cid).then(p => { if (on) { setPoints(p); setPointsLoaded(true); } });
    return () => { on = false; };
  }, [cid]);

  // Esc (после списков подсказок и городов — они гасят свой Esc), ловушка фокуса, блокировка прокрутки.
  useModal({ active: !inline, ref: card, onClose });

  const [searchOpen, setSearchOpen] = useState(false);
  /** Пин двигают — адрес определяется (лоадер в поле; на самой карте — в пине). */
  const [locating, setLocating] = useState(false);
  const addrBtn = useRef<HTMLButtonElement>(null);

  const pickCity = (id: string) => {
    setCityId(id); setStore(null); setStreet(''); setPos(null);
  };

  const onAddress = useCallback((a: { lat: number; lng: number; street: string }) => {
    setLocating(false);
    setPos({ lat: a.lat, lng: a.lng });
    if (a.street) setStreet(a.street);
  }, []);

  // Дом выбран в поиске: адрес — в поле, карта летит к дому без повторного определения адреса по пину.
  const onSuggest = (sg: Suggestion) => {
    setStreet(sg.title);
    setSearchOpen(false);
    if (sg.lat == null || sg.lng == null) return;
    setPos({ lat: sg.lat, lng: sg.lng });
    map.current?.flyTo(sg.lat, sg.lng, 17, sg.title);
  };
  const closeSearch = () => { setSearchOpen(false); };

  const isD = tab === 'delivery';
  const point = points.find(p => p.id === store) ?? null;
  const ok = isD ? street.trim().length > 2 : !!point;

  const confirm = () => {
    if (!ok || !city) return;
    onConfirm(isD
      ? { method: 'delivery', city: city.id, address: street.trim(), lat: pos?.lat ?? null, lng: pos?.lng ?? null, pickupPointId: null,
          ...(addressOnly ? { entrance, flat, title: addrTitle } : {}) }
      : { method: 'pickup', city: city.id, address: point!.name, lat: point!.lat, lng: point!.lng, pickupPointId: point!.id });
  };

  const body = (
    <div ref={card} role={inline ? 'group' : 'dialog'} aria-modal={inline ? undefined : true} aria-labelledby={titleId} aria-describedby={subId} tabIndex={-1}
      className={`${s.card} ${inline ? s.inline : ''} ${inline && mobile ? s.mobile : ''} ${tab === 'pickup' ? s.pickupMode : ''}`}>
      <button type="button" className={s.close} aria-label="Закрыть" onClick={onClose}><Cross size={14} color="var(--ink-1)" /></button>

      {city ? (
        <MethodMap ref={map} mode={tab} city={city} points={tab === 'pickup' ? points : NO_POINTS} selected={store} start={start}
          compact={mobile} staticMap={staticMap} geo={geo}
          onMoving={() => setLocating(true)} onAddress={onAddress} onPick={setStore} onGeo={setGeo}>
          <div className={s.mapTools}><CitySelect cities={cities} value={city} onChange={pickCity} /></div>
        </MethodMap>
      ) : <div className={s.map} />}

      <div className={s.panel}>
        <div className={s.head}>
          <h2 id={titleId} className={s.title}>{title ?? 'Как получить заказ?'}</h2>
          <p id={subId} className={s.subtitle}>{subtitle ?? 'Цены и наличие зависят от филиала'}</p>
        </div>

        {!addressOnly && (
          <div className={s.tabs} role="radiogroup" aria-label="Способ получения">
            {(['delivery', 'pickup'] as const).map(m => (
              <button key={m} type="button" role="radio" aria-checked={tab === m} className={`${s.tab} ${tab === m ? s.on : ''}`}
                onClick={() => setTab(m)}>{m === 'delivery' ? 'Доставка' : 'Самовывоз'}</button>
            ))}
          </div>
        )}
        {addressOnly && <MartInput label="Название" value={addrTitle} onChange={setAddrTitle} hint="Например, Дом или Объект" />}

        {isD ? (
          <div className={s.scroll}>
            <AddressField ref={addrBtn} value={street} busy={locating} onOpen={() => setSearchOpen(true)} />
            {addressOnly && (
              <div className={s.pair}>
                <MartInput label="Подъезд" value={entrance} onChange={setEntrance} />
                <MartInput label="Квартира, офис" value={flat} onChange={setFlat} />
              </div>
            )}
            <div className={s.fee}>Доставка {tg(DELIVERY.fee)}, бесплатно от {tg(DELIVERY.freeFrom)} · {DELIVERY.etaMin}–{DELIVERY.etaMax} мин</div>
          </div>
        ) : (
          <PickupList points={points} selected={store} geo={geo} cityName={city?.name ?? ''} loaded={pointsLoaded}
            onPick={setStore} onAskGeo={() => map.current?.locate()} />
        )}

        <div className={s.cta}>
          <MartButton label={ctaLabel ?? (isD ? 'Доставить сюда' : 'Заберу здесь')} size={56} full disabled={!ok}
            reason={isD ? 'Укажите улицу и дом' : 'Выберите точку на карте или в списке'} onClick={confirm} />
        </div>
      </div>
      <AddressSearch open={searchOpen} mobile={mobile} value={street} cities={cities} city={city}
        onCity={id => { pickCity(id); }} onPick={onSuggest} onClose={closeSearch} />
    </div>
  );

  if (inline) return body;
  if (!mounted) return null;
  return createPortal(
    <div className={`${s.overlay} ${mobile ? s.mobile : ''}`} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      {body}
    </div>,
    document.body,
  );
}
