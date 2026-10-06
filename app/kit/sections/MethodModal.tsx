'use client';
// Витрина: MartMethodModal — живые модалки по кнопкам + статичные состояния в рамках (без оверлея, карта-заглушка).
import { useState } from 'react';
import { MartButton } from '@/components/MartButton';
import { MartMethodModal, type MethodValue, type Suggestion } from '@/components/MartMethodModal';
import { AddressSearch } from '@/components/method/AddressSearch';
import { CITIES, PICKUP_POINTS } from '@/lib/mock';
import { KitItem, KitPanel, KitSection } from '../Kit';

// Демо-подсказки (форма ответа /api/geo/suggest)
const DEMO_SUGGESTIONS: Suggestion[] = [
  { title: 'улица Кабанбай батыра, 11', subtitle: 'район Есиль · Астана', lat: 51.1166, lng: 71.4398, hasHouse: true },
  { title: 'улица Кабанбай батыра, 15/1', subtitle: 'район Есиль · Астана', lat: 51.1152, lng: 71.4411, hasHouse: true },
  { title: 'улица Кабанбай батыра', subtitle: 'район Есиль · Астана', lat: 51.1201, lng: 71.4350, hasHouse: false },
  { title: 'улица Кабанбай батыра, 2', subtitle: 'район Алматы · Астана', lat: 51.1301, lng: 71.4302, hasHouse: true },
];
const GEO = { lat: 51.1282, lng: 71.4307 };
const noop = () => {};

type Live = null | 'delivery' | 'pickup' | 'addressOnly' | 'mobile';

/** Рамка статичного образца. */
function Frame({ w, h, children, page }: { w: number; h?: number; children: React.ReactNode; page?: boolean }) {
  return (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <div style={{
        width: w, height: h, border: '1px solid var(--border)', borderRadius: 'var(--r-24)', overflow: 'hidden', position: 'relative',
        background: page ? 'var(--surface-page)' : 'var(--surface-card)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>{children}</div>
    </div>
  );
}

export default function MethodModalSection() {
  const [live, setLive] = useState<Live>(null);
  const [last, setLast] = useState<MethodValue | null>(null);
  const close = () => setLive(null);
  const done = (v: MethodValue) => { setLast(v); setLive(null); };

  return (
    <KitSection id="method" title="Способ получения · MartMethodModal"
      note="Карта — Mapbox GL в iframe (public/map.html), токен NEXT_PUBLIC_MAPBOX_TOKEN; без токена — заглушка с пином / точками. Подсказки и адрес по пину — GET /api/geo/suggest, /api/geo/reverse (DaData на сервере); без ключей DADATA_* — «Подсказки недоступны». Статичные образцы ниже — без карты и без сети.">
      <KitPanel layout="row">
        <MartButton label="Доставка" variant="ghost" size={44} onClick={() => setLive('delivery')} />
        <MartButton label="Самовывоз" variant="ghost" size={44} onClick={() => setLive('pickup')} />
        <MartButton label="Адрес (кабинет)" variant="ghost" size={44} onClick={() => setLive('addressOnly')} />
        <MartButton label="Mobile" variant="ghost" size={44} onClick={() => setLive('mobile')} />
        {last && <code style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-2)', wordBreak: 'break-all' }}>onConfirm → {JSON.stringify(last)}</code>}
      </KitPanel>

      <MartMethodModal open={live === 'delivery'} mode="desktop" onClose={close} onConfirm={done} />
      <MartMethodModal open={live === 'pickup'} mode="desktop" initial={{ method: 'pickup', city: 'astana' }} onClose={close} onConfirm={done} />
      <MartMethodModal open={live === 'addressOnly'} mode="auto" addressOnly title="Новый адрес" subtitle="Сохраним его в кабинете"
        ctaLabel="Сохранить адрес" onClose={close} onConfirm={done} />
      <MartMethodModal open={live === 'mobile'} mode="mobile" onClose={close} onConfirm={done} />

      <KitPanel>
        <KitItem label="Доставка · адрес по пину, desktop (на весь экран — здесь в рамке 960×600)">
          <Frame w={962}>
            <MartMethodModal open inline staticMap mode="desktop" onClose={noop} onConfirm={noop}
              initial={{ method: 'delivery', city: 'astana', address: 'улица Кабанбай батыра, 11', lat: 51.1166, lng: 71.4398 }} />
          </Frame>
        </KitItem>
        <KitItem label="Самовывоз · выбрана точка, геолокация известна">
          <Frame w={962}>
            <MartMethodModal open inline staticMap mode="desktop" userGeo={GEO} onClose={noop} onConfirm={noop}
              initial={{ method: 'pickup', city: 'astana', pickupPointId: PICKUP_POINTS[1].id }} />
          </Frame>
        </KitItem>
      </KitPanel>

      <KitPanel layout="grid" min={390}>
        {([['suggestOpen', 'Поиск адреса · подсказки, совпадение выделено'], ['suggestLoading', 'Поиск адреса · загрузка'],
          ['suggestEmpty', 'Поиск адреса · ничего не нашли'], ['suggestError', 'Поиск адреса · сервис недоступен (503)']] as const).map(([st, label]) => (
          <KitItem key={st} label={label}>
            <Frame w={390} h={560}>
              <AddressSearch open inline mobile value="Кабанбай 1" cities={CITIES} city={CITIES[0]} onCity={noop} onPick={noop} onClose={noop}
                demoState={st} demoSuggestions={DEMO_SUGGESTIONS} />
            </Frame>
          </KitItem>
        ))}
      </KitPanel>

      <KitPanel layout="row" style={{ alignItems: 'flex-start' }}>
        <KitItem label="Mobile 390 · доставка, на весь экран">
          <Frame w={390} h={844} page>
            <MartMethodModal open inline staticMap mode="mobile" onClose={noop} onConfirm={noop}
              initial={{ method: 'delivery', city: 'astana', address: 'улица Кабанбай батыра, 11' }} />
          </Frame>
        </KitItem>
        <KitItem label="Mobile 390 · самовывоз">
          <Frame w={390} h={844} page>
            <MartMethodModal open inline staticMap mode="mobile" onClose={noop} onConfirm={noop}
              initial={{ method: 'pickup', city: 'astana', pickupPointId: PICKUP_POINTS[1].id }} />
          </Frame>
        </KitItem>
      </KitPanel>
    </KitSection>
  );
}
