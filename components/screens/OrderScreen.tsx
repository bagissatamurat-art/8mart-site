'use client';
// Статус заказа — 03 Оформление.dc.html, шаг success (3a / 3b): шкала по отправлениям, поддержка, отмена до передачи в доставку.
import { useEffect, useState } from 'react';
import { MartButton } from '@/components/MartButton';
import { ConfirmDialog } from '@/components/account/ConfirmDialog';
import { OrderTrack } from '@/components/checkout/OrderTrack';
import { EarnNote, SummaryLines, TotalLine, TotalsRows } from '@/components/checkout/OrderSummary';
import { MobileTopBar } from '@/components/checkout/MobileTopBar';
import { SiteHeader } from '@/components/site/SiteHeader';
import { Skeleton } from '@/components/ui/Spinner';
import { cancelOrder, getOrder, resolveCartItem } from '@/lib/api';
import { CANCEL_BEFORE, REFUND_DAYS, SUPPORT_WA } from '@/lib/config';
import { CART, ORDER_PAGE } from '@/lib/copy';
import { bonusText, itemsTitle, money } from '@/lib/domain';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import type { Category, Order } from '@/lib/types';
import s from '@/components/site/site.module.css';
import c from './OrderScreen.module.css';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import l from '@/components/site/page.module.css';

export function OrderScreen({ id, categories }: { id: string; categories: Category[] }) {
  const mobile = useIsMobile();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [confirm, setConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  useEffect(() => { getOrder(id).then(setOrder).catch(() => setOrder(null)); }, [id]);

  if (order === undefined) return <div className={c.loading}><Skeleton h={48} r={12} w="40%" /><Skeleton h={360} r={24} /><Skeleton h={120} r={24} /></div>;
  if (order === null) return (
    <div className={c.loading}><h1 className={l.h1}>{ORDER_PAGE.notFound}</h1><MartButton label="На главную" size={56} href="/" /></div>
  );

  const kaspi = order.payment === 'kaspi', cancelled = order.status === 'cancelled', pk = order.method === 'pickup';
  const done = !cancelled && order.shipments.every(sh => sh.status === 'done');
  const canCancel = !cancelled && !order.shipments.some(sh => CANCEL_BEFORE.includes(sh.status));
  const refund = ORDER_PAGE.refund(money(order.total), kaspi, REFUND_DAYS);
  const count = order.items.reduce((sum, it) => sum + it.qty, 0);
  const title = itemsTitle(count);
  const lines = order.items.map(it => { const p = resolveCartItem(it.id); return { key: it.id, img: p?.img, name: p?.name ?? it.id, qty: it.qty, price: p?.price ?? null }; });
  const totals = {
    goods: order.goods ?? 0, discount: order.discount ?? 0, spend: order.spend ?? 0, progress: null,
    fees: (order.fees ?? []).map(f => ({ label: f.label, amount: f.amount, free: f.amount === 0, text: f.amount === 0 ? 'Бесплатно' : money(f.amount) })),
  };
  const promo = order.promo && order.promoPct ? { code: order.promo, pct: order.promoPct } : null;
  const earnText = cancelled
    ? (order.spend ? ORDER_PAGE.bonusReturn(bonusText(order.spend).slice(1)) : '')
    : order.bonus ? (done ? ORDER_PAGE.earned(bonusText(order.bonus)) : CART.earn(bonusText(order.bonus))) : '';
  const support = `https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent(ORDER_PAGE.supportText(order.id))}`;
  const doCancel = async () => {
    setCancelling(true);
    try { await cancelOrder(order.id); setOrder(await getOrder(order.id)); } finally { setCancelling(false); setConfirm(false); }
  };

  const supportLink = (
    <a href={support} target="_blank" rel="noopener" className={c.support}>
      <span className={c.supportIcon} aria-hidden><span /></span>
      <span className={c.supportText}><span>Написать в поддержку</span><span className={c.supportSub}>WhatsApp</span></span>
    </a>
  );
  const info = (
    <div className={c.info}>
      <div className={c.infoRow}><span className={c.infoLabel}>{pk ? 'Самовывоз' : 'Доставка'}</span><span className={c.infoStrong}>{order.address}</span></div>
      {order.recipient && <div className={c.infoRow}><span className={c.infoLabel}>Получатель</span><span>{order.recipient.name} · {order.recipient.phone}</span></div>}
    </div>
  );
  const summaryBody = (
    <>
      <SummaryLines lines={lines} mobile={mobile} />
      <div className={l.divider} />
      <TotalsRows compact totals={totals} promo={promo} />
      <div className={l.divider} />
      <TotalLine small total={order.total} paid={cancelled ? ORDER_PAGE.refundShort : ORDER_PAGE.paid(kaspi)} />
      {earnText && <EarnNote>{earnText}</EarnNote>}
    </>
  );
  const cancelBtn = canCancel && <button type="button" className={c.cancel} onClick={() => setConfirm(true)}>Отменить заказ</button>;
  const dialog = (
    <ConfirmDialog open={confirm} mode={mobile ? 'mobile' : 'desktop'} title={ORDER_PAGE.cancelTitle(order.id)} text={refund}
      confirmLabel="Отменить заказ" cancelLabel="Не отменять" loading={cancelling} onConfirm={doCancel} onClose={() => setConfirm(false)} />
  );

  if (mobile) {
    return (
      <div className={c.mPage}>
        <MobileTopBar title="Статус заказа" backHref="/" right={<span className={c.count}>{title}</span>} />
        <div className={c.mBody}>
          <section className={c.trackCardM}>
            <span className={c.caption}>Заказ №{order.id} · {order.date}</span>
            <OrderTrack order={order} mobile refundText={refund} />
            <div className={c.supportRowM}>{supportLink}</div>
          </section>
          <section className={c.cardM}>{info}</section>
          <section className={`${c.cardM} ${c.stack}`}><b className={c.h16}>{title}</b>{summaryBody}</section>
          <MartButton label="Продолжить покупки" variant="ghost" size={56} full href="/" />
          {cancelBtn}
        </div>
        {dialog}
      </div>
    );
  }

  return (
    <div className={s.page}>
      <SiteHeader categories={categories} mobile={false} />
      <div className={l.wrap}>
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Корзина', href: '/cart' }, { label: 'Оформление' }]} />
        <div className={l.split}>
          <main className={l.main}>
            <div className={c.titleRow}><h1 className={l.h1}>Заказ №{order.id}</h1><span className={c.date}>от {order.date}</span></div>
            <section className={c.trackCard}>
              <OrderTrack order={order} refundText={refund} />
              <div className={c.supportRow}>{supportLink}</div>
            </section>
            <section className={c.infoCard}>{info}</section>
            {cancelBtn}
          </main>
          <aside className={l.aside}>
            <b className={c.h18}>{title}</b>
            {summaryBody}
            <MartButton label="Продолжить покупки" variant="ghost" size={56} full href="/" />
          </aside>
        </div>
      </div>
      {dialog}
    </div>
  );
}
