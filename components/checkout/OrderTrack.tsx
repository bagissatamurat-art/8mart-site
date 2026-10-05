'use client';
// Шкала статуса заказа (03, шаг success): своя шкала на каждое отправление; отмена — «Заказ принят → Заказ отменён».
import { ORDER_PAGE, ORDER_STAGES } from '@/lib/copy';
import { itemsTitle } from '@/lib/domain';
import { resolveCartItem } from '@/lib/api';
import type { Order, OrderShipment, OrderStatus } from '@/lib/types';
import { MartButton } from '../MartButton';
import { Check } from '../ui/Cross';
import s from './checkout.module.css';

const STEP: Record<OrderStatus, number> = { accepted: 0, assembling: 1, onway: 2, ready: 2, done: 3, cancelled: -1 };

interface Stage { title: string; sub: string; time: string; state: 'done' | 'current' | 'todo' | 'bad' }

function eta(sh: OrderShipment, pk: boolean, cur: number): [string, string] | null {
  if (sh.kind === 'cargo') {
    if (pk) return cur < 2 ? ['Можно забрать', sh.eta ?? ''] : cur === 2 && sh.until ? ['Храним до', sh.until] : null;
    return cur < 3 && sh.eta ? ['Привезём', sh.eta] : null;
  }
  if (pk) return cur < 2 && sh.eta ? ['Будет готов к', sh.eta] : cur === 2 && sh.until ? ['Можно забрать до', sh.until] : null;
  return cur < 3 && sh.eta ? ['Привезём к', sh.eta] : null;
}

function Stages({ stages, mobile }: { stages: Stage[]; mobile?: boolean }) {
  return (
    <ol className={s.stages}>
      {stages.map((st, i) => (
        <li key={i} className={`${s.stage} ${mobile ? s.stageM : ''}`} aria-current={st.state === 'current' ? 'step' : undefined}>
          <div className={s.stageRail}>
            <span className={`${s.dotS} ${s['dot_' + st.state]}`}>
              {st.state === 'done' && <Check color="#fff" />}
              {st.state === 'current' && <span className={s.dotInner} />}
            </span>
            {i < stages.length - 1 && <span className={`${s.rail} ${st.state === 'done' && stages[i + 1].state !== 'todo' && stages[i + 1].state !== 'bad' ? s.railDone : ''}`} />}
          </div>
          <div className={s.stageText} style={{ paddingBottom: i < stages.length - 1 ? 20 : 0 }}>
            <span className={`${s.stageTitle} ${st.state === 'todo' ? s.stageTodo : ''} ${st.state === 'current' || st.state === 'bad' ? s.stageBold : ''}`}>{st.title}</span>
            {st.state === 'current' && <span className={s.stageSub}>{st.sub}</span>}
          </div>
          <span className={s.stageTime}>{st.time}</span>
        </li>
      ))}
    </ol>
  );
}

export function OrderTrack({ order, mobile, refundText }: { order: Order; mobile?: boolean; /** «Вернём … на Kaspi …» для отменённого заказа */ refundText?: string }) {
  const pk = order.method === 'pickup';
  if (order.status === 'cancelled') {
    const times = order.shipments[0]?.times ?? [];
    return (
      <div className={s.track}>
        <div className={`${s.trackHead} ${mobile ? s.trackHeadM : ''}`}><div className={s.trackTitleCol}>
          <span className={`${s.trackTitle} ${s.trackBad}`}>{ORDER_PAGE.cancelled}</span>
          {refundText && <span className={s.trackSub}>{refundText.replace('Вернём', 'Вернём деньги —')}</span>}
        </div></div>
        <Stages mobile={mobile} stages={[
          { title: ORDER_PAGE.acceptedStage, sub: '', time: times[0] ?? '', state: 'done' },
          { title: ORDER_PAGE.cancelledStage, sub: '', time: times[1] ?? '', state: 'bad' },
        ]} />
      </div>
    );
  }
  const multi = order.shipments.length > 1;
  return (
    <>
      {order.shipments.map((sh, i) => {
        const cur = Math.max(0, STEP[sh.status]);
        const defs = ORDER_STAGES[`${pk ? 'p' : 'd'}${sh.kind}` as const];
        const stages: Stage[] = defs.map(([title, sub], j) => ({ title, sub, time: j <= cur ? sh.times?.[j] ?? '' : '',
          state: j < cur || (j === cur && cur === 3) ? 'done' : j === cur ? 'current' : 'todo' }));
        const e = eta(sh, pk, cur);
        const qty = order.items.reduce((sum, it) => sum + ((resolveCartItem(it.id)?.delivery === 'cargo') === (sh.kind === 'cargo') ? it.qty : 0), 0);
        const tag = pk ? (sh.kind === 'cargo' ? 'Склад' : 'Точка') : (sh.kind === 'cargo' ? 'Газель' : 'Курьер');
        const label = (pk ? 'Самовывоз ' : 'Доставка ') + (i + 1) + ' из ' + order.shipments.length + ' · ' + itemsTitle(qty);
        return (
          <div key={i} className={`${s.track} ${i < order.shipments.length - 1 ? s.trackSep : ''}`}>
            {multi && <span className={s.tagRow}><span className={`${s.tag} ${sh.kind === 'cargo' ? s.tagCargo : ''}`}>{tag}</span><span className={s.tagLabel}>{label}</span></span>}
            <div className={`${s.trackHead} ${mobile ? s.trackHeadM : ''}`}>
              <div className={s.trackTitleCol}>
                <span className={`${s.trackTitle} ${cur === 3 ? s.trackOk : ''}`}>{defs[cur][0]}</span>
                <span className={s.trackSub}>{cur === 3 ? ORDER_PAGE.done(pk, multi) : defs[cur][1]}</span>
              </div>
              {e && <div className={s.eta}><span className={s.etaLabel}>{e[0]}</span><b className={s.etaText}>{e[1]}</b></div>}
            </div>
            <Stages stages={stages} mobile={mobile} />
            {!pk && cur === 2 && sh.courier && (
              <div className={s.courier}>
                <span className={s.courierText}><span className={s.courierLabel}>{sh.kind === 'cargo' ? 'Водитель' : 'Курьер'}</span><b>{sh.courier.name}</b></span>
                <MartButton label="Позвонить" variant="ghost" size={44} href={`tel:${sh.courier.phone}`} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

