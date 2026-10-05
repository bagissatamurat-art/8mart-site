'use client';
// Мои заказы: активные сверху (шкала этапов + «Следить за заказом»), ниже история (статус, бонусы, «Подробнее», «Повторить»).
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ORDER_STATUS } from '@/lib/config';
import { bonusText, money, plural } from '@/lib/domain';
import { resolveCartItem } from '@/lib/api';
import type { Order } from '@/lib/types';
import { MartButton } from '../MartButton';
import { BonusCoin } from '../ui/BonusCoin';
import { isActiveOrder, orderSteps, statusLabel } from './sections';
import s from '../MartAccount.module.css';
import { EMPTY } from '@/lib/copy';

export interface AccountOrdersProps {
  orders: Order[];
  mobile: boolean;
  orderHref: (id: string) => string;
  onOpenOrder?: (id: string) => void;
  /** «Повторить» — положить товары заказа в корзину. Promise → кнопка в загрузке до ответа. */
  onRepeat?: (order: Order) => void | Promise<unknown>;
}

export function AccountOrders({ orders, mobile, orderHref, onOpenOrder, onRepeat }: AccountOrdersProps) {
  const active = orders.filter(isActiveOrder);
  const past = orders.filter(o => !isActiveOrder(o));
  if (!orders.length) {
    return (
      <div className={`${s.card} ${s.empty}`}>
        <p className={s.emptyTitle}>{EMPTY.orders.title}</p>
        <p className={s.emptyText}>{EMPTY.orders.text}</p>
      </div>
    );
  }
  return (
    <>
      {active.map(o => <ActiveOrder key={o.id} o={o} mobile={mobile} href={orderHref(o.id)} onOpen={onOpenOrder} />)}
      {mobile && past.length > 0 && <h2 className={s.groupTitle}>История</h2>}
      {past.map(o => <PastOrder key={o.id} o={o} href={orderHref(o.id)} onOpen={onOpenOrder} onRepeat={onRepeat} />)}
    </>
  );
}

function ActiveOrder({ o, mobile, href, onOpen }: { o: Order; mobile: boolean; href: string; onOpen?: (id: string) => void }) {
  const pickup = o.method === 'pickup';
  return (
    <article className={`${s.card} ${s.accent} ${s.activeCard}`}>
      <div className={s.activeHead}>
        <div className={s.col}>
          <span className={s.orderNo}>Заказ №{o.id} · {o.date}</span>
          <h3 className={s.activeTitle}>{statusLabel(o)}</h3>
          <span className={s.activeAddr}>{(pickup ? 'Самовывоз · ' : 'Доставка · ') + o.address}</span>
        </div>
        {o.eta && (
          <div className={s.eta}>
            <span className={s.etaLabel}>{pickup ? 'Будет готов к' : 'Привезём к'}</span>
            <b className={s.etaValue}>{o.eta}</b>
          </div>
        )}
      </div>
      <ol className={s.steps} aria-label="Этапы заказа">
        {orderSteps(o).map(st => (
          <li key={st.label} className={`${s.step} ${s[`step_${st.state}`]}`} aria-current={st.state === 'current' ? 'step' : undefined}>
            <span className={s.stepBar} />{st.label}
          </li>
        ))}
      </ol>
      <span className={s.track} onClick={() => onOpen?.(o.id)}>
        <MartButton label="Следить за заказом" size={44} full={mobile} href={href} />
      </span>
    </article>
  );
}

type RepeatState = 'loading' | 'done' | null;

function PastOrder({ o, href, onOpen, onRepeat }: { o: Order; href: string; onOpen?: (id: string) => void; onRepeat?: AccountOrdersProps['onRepeat'] }) {
  const [re, setRe] = useState<RepeatState>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const cancelled = o.status === 'cancelled';
  const tone = ORDER_STATUS[o.status].tone;
  const thumbs = o.items.slice(0, 4).map(it => resolveCartItem(it.id));
  const n = o.items.length;
  const earned = o.status === 'done' ? o.bonus : 0;

  const repeat = async () => {
    if (re) return;
    setRe('loading');
    try { await onRepeat?.(o); if (alive.current) setRe('done'); }
    catch { if (alive.current) setRe(null); }
  };

  return (
    <article className={`${s.card} ${s.past}`}>
      <div className={s.pastMain}>
        <div className={s.pastHead}>
          <b className={s.pastNo}>№{o.id}</b>
          <span className={s.date}>{o.date}</span>
          <span className={`${s.chip} ${s[`tone_${tone}`]}`}>{statusLabel(o)}</span>
          {earned > 0 && <span className={s.bonusChip}><BonusCoin />{bonusText(earned)}</span>}
        </div>
        <div className={s.thumbs}>
          {thumbs.map((p, i) => p?.img
            ? <img key={i} src={p.img} alt="" className={`${s.thumb} ${cancelled ? s.dim : ''}`} />
            : <span key={i} className={`${s.thumb} ${cancelled ? s.dim : ''}`} aria-hidden />)}
          {n > 4 && <span className={s.more}>+{n - 4}</span>}
        </div>
        <span className={s.meta13}>{n} {plural(n, 'позиция', 'позиции', 'позиций')} · {o.method === 'pickup' ? 'Самовывоз' : 'Доставка'}, {o.address}</span>
      </div>
      <div className={s.pastActs}>
        <b className={`${s.sum} ${cancelled ? s.sumCancelled : ''}`}>
          {cancelled && <span className="visually-hidden">Отменён, сумма </span>}{money(o.total)}
        </b>
        <div className={s.btns}>
          <Link href={href} className={s.moreLink} onClick={() => onOpen?.(o.id)} aria-label={`Подробнее о заказе №${o.id}`}>Подробнее</Link>
          <MartButton label={re === 'done' ? 'В корзине' : 'Повторить'} variant="secondary" size={40} loading={re === 'loading'} onClick={repeat}
            aria-label={re === 'done' ? `Товары заказа №${o.id} в корзине` : `Повторить заказ №${o.id}`} />
        </div>
      </div>
    </article>
  );
}
