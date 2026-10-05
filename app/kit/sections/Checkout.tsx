'use client';
// Корзина и оформление (этап 3): переключатели, оферта, оплата, итоги, шкала статуса, шапка экрана mobile.
import { useState } from 'react';
import { MartToggleRow } from '@/components/checkout/MartToggleRow';
import { MartCheckbox } from '@/components/checkout/MartCheckbox';
import { MartPayment } from '@/components/checkout/MartPayment';
import { EarnNote, SummaryLines, TotalLine, TotalsRows } from '@/components/checkout/OrderSummary';
import { OrderTrack } from '@/components/checkout/OrderTrack';
import { MethodCard, MobileTopBar } from '@/components/checkout/MobileTopBar';
import { Alert } from '@/components/ui/Alert';
import { CARDS, ORDERS, PRODUCTS } from '@/lib/mock';
import { CART, CART_ALERT, ORDER_PAGE } from '@/lib/copy';
import { cartItem, orderTotals } from '@/lib/domain';
import type { Order } from '@/lib/types';
import { KitItem, KitPanel, KitSection } from '../Kit';
import ks from './sections.module.css';

const lines = [['b1', 2], ['b6', 1], ['b4', 1]].map(([k, q]) => ({ p: cartItem(k as string, PRODUCTS)!, qty: q as number }));
const totals = orderTotals({ lines, plan: { method: 'delivery' }, promoPct: 10, useBonus: true, balance: 1236, maxPart: 30 });
const summary = lines.map(l => ({ key: l.p.id, img: l.p.img, name: l.p.name, qty: l.qty, price: l.p.price }));
const base = ORDERS[0];
const order = (patch: Partial<Order>, shipments?: Order['shipments']): Order => ({ ...base, ...patch, shipments: shipments ?? base.shipments });

export default function Checkout() {
  const [bonus, setBonus] = useState(true);
  const [lift, setLift] = useState(false);
  const [offer, setOffer] = useState(false);
  const [pay, setPay] = useState('kaspi');
  const [payCard, setPayCard] = useState('c1');
  return (
    <>
      <KitSection id="checkout-controls" title="Оформление · переключатели, оферта, оплата"
        note="Строка-переключатель 56 r16: бонусы — зелёная, подъём на этаж — розовая. Оплата: только Kaspi и карта; у вошедшего — «Сохранённые карты» и «Новой картой» с пунктиром.">
        <KitPanel layout="grid" min={320}>
          <KitItem label="списать бонусы · вкл/выкл"><MartToggleRow tone="bonus" coin on={bonus} onToggle={() => setBonus(v => !v)} title="Списать 1 236 бонусов" sub="На счёте 1 236 · до 30% суммы товаров" /></KitItem>
          <KitItem label="подъём на этаж"><MartToggleRow on={lift} onToggle={() => setLift(v => !v)} title="Подъём на этаж" sub="200 тг за единицу за этаж · 2 шт., 7 этаж — 2 400 тг." /></KitItem>
          <KitItem label="оферта"><MartCheckbox checked={offer} onChange={setOffer}>Согласен с <a href="#">условиями оферты</a> и возврата</MartCheckbox></KitItem>
          <KitItem label="алерт с действием · mobile"><Alert tone="danger" compact action={{ label: CART.removeSold, onClick: () => {} }}>{CART_ALERT.soldOut}</Alert></KitItem>
        </KitPanel>
        <KitPanel layout="grid" min={420}>
          <KitItem label="desktop · гость / Kaspi"><MartPayment value={pay} onChange={setPay} /></KitItem>
          <KitItem label="desktop · сохранённые карты"><MartPayment value={payCard} cards={CARDS} onChange={setPayCard} /></KitItem>
          <KitItem label="mobile · новая карта"><div style={{ maxWidth: 358 }}><MartPayment value="card" cards={CARDS} mobile onChange={() => {}} /></div></KitItem>
        </KitPanel>
      </KitSection>

      <KitSection id="checkout-summary" title="Итоги заказа · OrderSummary" note="Корзина: «Скидка по промокоду» + прогресс до бесплатной доставки. Оформление: плашка промокода, «Бонусами», без прогресса. Статус: «Оплачено Kaspi» / «Возврат».">
        <KitPanel layout="grid" min={340}>
          <KitItem label="корзина (02)"><div className={ks.stack}>
            <TotalsRows totals={{ ...totals, spend: 0 }} goodsLabel="4 товара" promo={{ code: 'MART10', pct: 10 }} />
            <TotalLine total={totals.total + totals.spend} />
            <EarnNote>{CART.earn('+609 бонусов')}</EarnNote>
          </div></KitItem>
          <KitItem label="оформление (03)"><div className={ks.stack}>
            <SummaryLines lines={summary} />
            <TotalsRows totals={{ ...totals, progress: null }} promo={{ code: 'MART10', pct: 10 }} />
            <TotalLine total={totals.total} />
          </div></KitItem>
          <KitItem label="статус (03, success)"><div className={ks.stack}>
            <TotalLine small total={totals.total} paid={ORDER_PAGE.paid(true)} />
            <TotalLine small total={totals.total} paid={ORDER_PAGE.refundShort} />
            <EarnNote>{ORDER_PAGE.earned('+609 бонусов')}</EarnNote>
          </div></KitItem>
        </KitPanel>
      </KitSection>

      <KitSection id="order-track" title="Статус заказа · OrderTrack" note="Своя шкала на каждое отправление; текущий этап — розовое кольцо и подпись; курьер в пути — «Позвонить». Отмена — «Заказ принят → Заказ отменён».">
        <KitPanel layout="grid" min={480}>
          <KitItem label="доставка · курьер в пути + Газель собирается"><OrderTrack order={base} /></KitItem>
          <KitItem label="самовывоз · принят"><OrderTrack order={order({ method: 'pickup' }, [{ kind: 'courier', status: 'accepted', eta: '14:45', times: ['14:05'] }])} /></KitItem>
          <KitItem label="доставлен"><OrderTrack order={order({ status: 'done' }, [{ kind: 'courier', status: 'done', times: ['14:05', '14:07', '14:32', '15:18'] }])} /></KitItem>
          <KitItem label="отменён"><OrderTrack order={order({ status: 'cancelled' }, [{ kind: 'courier', status: 'cancelled', times: ['14:05', '14:12'] }])} refundText={ORDER_PAGE.refund('22 783 тг.', true, '1–3 рабочих дней')} /></KitItem>
          <KitItem label="mobile · Газель в пути"><div style={{ maxWidth: 358 }}><OrderTrack mobile order={order({}, [{ kind: 'cargo', status: 'onway', eta: '27 сентября, 9:00–13:00', times: ['14:05', '27 сент., 08:10', '27 сент., 10:20'], courier: { name: 'Нурлан, Газель · 456 DEF 01', phone: '+77001112233' } }])} /></div></KitItem>
        </KitPanel>
      </KitSection>

      <KitSection id="topbar" title="Шапка экрана mobile · MobileTopBar, MethodCard">
        <KitPanel layout="grid" min={390}>
          <div className={ks.phone}><MobileTopBar title="Корзина" sub="4 товара" right={<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>Очистить</span>}>
            <MethodCard mobile label="Доставка" address="Астана, Кабанбай батыра, 11" onChange={() => {}} />
          </MobileTopBar></div>
          <div className={ks.phone}><MobileTopBar title="Оформление" right={<span style={{ fontSize: 14, color: 'var(--ink-3)' }}>4 товара</span>} /></div>
        </KitPanel>
      </KitSection>
    </>
  );
}
