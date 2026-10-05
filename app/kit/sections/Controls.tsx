'use client';
// Кнопка, инпут, промокод, отправления, счётчик, чипы — состав и порядок как в site/UI Kit.dc.html (+ интерактивные образцы).
import { useState } from 'react';
import { MartButton } from '@/components/MartButton';
import { MartInput } from '@/components/MartInput';
import { MartPromo, type PromoStatus } from '@/components/MartPromo';
import { MartShipmentHead, MartSplitChoice } from '@/components/MartShipments';
import { MartStepper } from '@/components/MartStepper';
import { MartChip } from '@/components/MartChip';
import { checkPromo } from '@/lib/api';
import { money, splitOptions } from '@/lib/domain';
import { resolveCartItem } from '@/lib/api';
import { KitItem, KitPanel, KitSection } from '../Kit';

function LivePromo() {
  const [status, setStatus] = useState<PromoStatus>('idle');
  const [code, setCode] = useState('');
  const [minSum, setMinSum] = useState(0);
  const goods = 12780;
  return (
    <KitItem label={`Живой: товаров на ${money(goods)}; MART10 → minSum, SPRING → истёк`}>
      <MartPromo key={status + code} status={status} value={code} code={code} minSum={minSum} discountText={'−' + money(goods * 0.1)}
        onRemove={() => { setStatus('idle'); setCode(''); }}
        onApply={async c => {
          setCode(c.toUpperCase()); setStatus('loading');
          const r = await checkPromo(c, goods);
          if ('ok' in r && r.ok) setStatus('applied'); else if ('error' in r) { setMinSum(r.minSum || 0); setStatus(r.error); }
        }} />
    </KitItem>
  );
}

function LiveSplit() {
  const [together, setTogether] = useState(false);
  const lines = [['b1', 2], ['b6', 1], ['b4', 1]].map(([k, q]) => ({ p: resolveCartItem(k as string)!, qty: q as number }));
  return <MartSplitChoice options={splitOptions(lines, { together, goodsTotal: 18783 })} onPick={setTogether} />;
}

export default function Controls() {
  const [qty, setQty] = useState(1);
  const [qtyMax, setQtyMax] = useState(4);
  const [chip, setChip] = useState('Все');
  const [phone, setPhone] = useState('');
  return (
    <>
      <KitSection id="button" title="Кнопка · MartButton"
        note="Основной CTA всегда «текст · разделитель · сумма». Kaspi — официальный SVG кнопки как есть (без суммы), радиус pill; логотип Kaspi (assets/kaspi-logo.svg) — в способах оплаты. Disabled с причиной в title.">
        <KitPanel>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <MartButton label="Primary" />
            <MartButton label="Secondary" variant="secondary" />
            <MartButton label="Ghost" variant="ghost" />
            <MartButton label="Удалить" variant="danger" />
            <MartButton variant="kaspi" />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <MartButton label="56" size={56} /><MartButton label="44" size={44} /><MartButton label="40" size={40} /><MartButton label="36" size={36} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <MartButton label="Оформить" amount="4 090 тг." />
            <MartButton label="Focus" focused />
            <MartButton label="Оформить" amount="4 090 тг." disabled reason="Примите условия оферты" />
            <MartButton label="Оформить" loading />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <MartButton label="Secondary 44" variant="secondary" size={44} />
            <MartButton label="Ghost 40" variant="ghost" size={40} />
            <MartButton label="Danger 36" variant="danger" size={36} />
            <MartButton label="Disabled 44" size={44} disabled />
            <MartButton label="Loading" variant="secondary" size={44} loading />
            <MartButton variant="kaspi" size={44} />
          </div>
        </KitPanel>
      </KitSection>

      <KitSection id="input" title="Инпут · MartInput"
        note="Плавающий лейбл, высота 56 (textarea 84), кольцо фокуса кастомное. Очистка × — только в фокусе и когда заполнено; у телефона очистки нет. Обязательное — красная *.">
        <KitPanel layout="grid" min={260}>
          <MartInput label="Имя" />
          <MartInput label="Имя" defaultValue="Айгерим" focused />
          <MartInput label="Телефон" type="phone" required defaultValue="+7 (700) 133-90-71" />
          <MartInput label="Телефон" type="phone" required defaultValue="+7 (700) 1" error="Введите номер полностью" />
          <MartInput label="Квартира" defaultValue="14" disabled />
          <MartInput label="Код из WhatsApp" type="code" defaultValue="4 8 2" hint="Отправили на +7 (700) 133-90-71" />
          <MartInput label="Комментарий курьеру" type="textarea" />
          <MartInput label="Комментарий курьеру" type="textarea" defaultValue="Позвоните за 10 минут, домофон не работает" focused />
          <KitItem label={`Живой телефон: маска, 8 → +7, Backspace по маске · значение: «${phone}»`}>
            <MartInput label="Телефон" type="phone" required value={phone} onChange={setPhone} />
          </KitItem>
          <MartInput label="Обязательное" required error />
        </KitPanel>
      </KitSection>

      <KitSection id="promo" title="Промокод · MartPromo">
        <KitPanel layout="grid" min={320}>
          <MartPromo status="idle" />
          <MartPromo status="applied" code="MART10" discountText="−1 278 тг." />
          <MartPromo status="notFound" value="MART50" />
          <MartPromo status="expired" value="SPRING" />
          <MartPromo status="minSum" value="BIG20" minSum={15000} />
          <MartPromo status="loading" value="MART10" />
          <LivePromo />
        </KitPanel>
      </KitSection>

      <KitSection id="shipments" title="Отправления · MartShipmentHead, MartSplitChoice">
        <KitPanel style={{ gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
            <MartShipmentHead kind="courier" label="Доставка 1 из 2" when="Сегодня, за 60–90 минут" meta="Курьер · 2 товара" feeText="1 000 тг." />
            <MartShipmentHead kind="cargo" label="Доставка 2 из 2" when="Завтра, 9:00–21:00" meta="Газель · 125 кг · разгрузка у подъезда" feeText="3 000 тг." />
            <MartShipmentHead kind="cargo" method="pickup" label="Самовывоз 2 из 2" when="Завтра с 9:00" meta="Склад, ш. Коргалжын, 3 · поможем погрузить" feeText="Бесплатно" />
            <MartShipmentHead kind="courier" method="pickup" label="Самовывоз 1 из 2" when="Сегодня, через 30 минут" meta="пр. Туран, 37 · храним 24 часа" feeText="Бесплатно" compact />
          </div>
          <LiveSplit />
          <MartSplitChoice method="pickup" compact options={[
            { id: 'split', together: false, title: 'Забрать в два приёма', sub: 'Сегодня — 2 товара в выбранной точке, завтра — 2 товара со склада', feeText: 'Бесплатно', sel: true },
            { id: 'together', together: true, title: 'Всё завтра со склада', sub: 'Склад, ш. Коргалжын, 3, с 9:00', feeText: 'Бесплатно', sel: false },
          ]} />
        </KitPanel>
      </KitSection>

      <KitSection id="stepper" title="Счётчик · MartStepper">
        <KitPanel layout="row" style={{ gap: 16 }}>
          <MartStepper qty={qty} size={44} onChange={q => setQty(Math.max(0, q))} />
          <MartStepper qty={2} size={44} tone="neutral" />
          <MartStepper qty={3} size={36} />
          <MartStepper qty={qtyMax} max={5} size={36} tone="neutral" onChange={q => setQtyMax(Math.max(0, q))} />
          <MartStepper qty={1} size={44} disabled />
          <MartStepper qty={2} size={36} full />
        </KitPanel>
      </KitSection>

      <KitSection id="chips" title="Чипы · MartChip">
        <KitPanel layout="row" style={{ gap: 8 }}>
          {['Все', 'Гортензии'].map(l => <MartChip key={l} label={l} selected={chip === l} onClick={() => setChip(l)} />)}
          <MartChip label="Розы" count={12} selected={chip === 'Розы'} onClick={() => setChip('Розы')} />
          <MartChip label="25 кг" removable />
          <MartChip label="Нет в наличии" disabled />
          <MartChip label="40" size={40} />
        </KitPanel>
      </KitSection>
    </>
  );
}
