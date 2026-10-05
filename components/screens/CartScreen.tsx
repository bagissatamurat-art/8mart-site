'use client';
// Корзина — 02 Корзина.dc.html: 2a (1440) и 2b (390).
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MartButton } from '@/components/MartButton';
import { MartCartLine } from '@/components/MartCartLine';
import { MartProductCard } from '@/components/MartProductCard';
import { MartPromo } from '@/components/MartPromo';
import { MartShipmentHead, MartSplitChoice } from '@/components/MartShipments';
import { EarnNote, TotalLine, TotalsRows } from '@/components/checkout/OrderSummary';
import { MethodCard, MobileTopBar } from '@/components/checkout/MobileTopBar';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteTabBar } from '@/components/site/SiteTabBar';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Spinner';
import { getUpsell } from '@/lib/api';
import { CART, CART_ALERT, CTA_BLOCKED, METHOD_NONE } from '@/lib/copy';
import { bonusText, itemsTitle, money, orderTotals, splitOptions } from '@/lib/domain';
import { useCartLines } from '@/lib/hooks/useCartLines';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { usePromo } from '@/lib/hooks/usePromo';
import { useCart } from '@/lib/store/cart';
import { useMethod } from '@/lib/store/method';
import { setCartQty, useUi } from '@/lib/store/ui';
import type { Category, Product } from '@/lib/types';
import s from '@/components/site/site.module.css';
import c from './CartScreen.module.css';

export function CartScreen({ categories }: { categories: Category[] }) {
  const mobile = useIsMobile();
  const { lines, ready } = useCartLines();
  const cart = useCart(st => st.lines);
  const together = useCart(st => st.together);
  const setTogether = useCart(st => st.setTogether);
  const clear = useCart(st => st.clear);
  const promo = useCart(st => st.promo);
  const method = useMethod(st => st.method);
  const label = useMethod(st => st.label);
  const openMethod = useUi(st => st.openMethod);
  const openQuickView = useUi(st => st.openQuickView);
  const [upsell, setUpsell] = useState<Product[]>([]);
  useEffect(() => { getUpsell(Object.keys(cart)).then(setUpsell); }, [cart]);

  const planOpts = { method: method || 'delivery', together, pickupPoint: method === 'pickup' ? label : '' } as const;
  const t = orderTotals({ lines, plan: planOpts, promoPct: promo?.pct ?? 0 });
  const promoField = usePromo(t.goods, t.discount);
  const reason = !method ? CTA_BLOCKED.method : t.hasSoldOut ? CTA_BLOCKED.soldOut : '';
  const disabled = !!reason || t.count === 0;
  const removeSold = () => lines.filter(l => l.soldOut).forEach(l => setCartQty(l.p.id, 0));
  const methodLabel = method === 'pickup' ? 'Самовывоз' : method === 'delivery' ? 'Доставка' : METHOD_NONE.label;
  const address = method ? label : METHOD_NONE.address;
  const empty = ready && lines.length === 0;
  const title = itemsTitle(t.count);
  const cta = <MartButton label="Оформить" amount={money(t.total)} size={56} full disabled={disabled} reason={reason} href="/checkout" />;
  const reasonText = disabled && reason ? <span className={mobile ? c.reasonM : c.reason}>{reason}</span> : null;

  const shipments = t.plan.list.map(sh => (
    <div key={sh.id} className={mobile ? c.shipM : c.ship}>
      <div className={mobile ? c.shipHeadM : c.shipHead}>
        <MartShipmentHead kind={sh.kind} method={method || 'delivery'} label={sh.label} when={sh.when} meta={sh.meta} feeText={sh.feeText} compact={mobile} />
      </div>
      <div className={mobile ? c.shipDivM : c.shipDiv} />
      {sh.lines.map(l => <MartCartLine key={l.p.id} product={l.p} qty={l.qty} soldOut={l.soldOut} compact={mobile} onChange={setCartQty} />)}
    </div>
  ));
  const split = t.plan.canSplit && (
    <div className={mobile ? c.cardM : c.card}>
      <MartSplitChoice compact={mobile} method={method || 'delivery'} onPick={setTogether}
        options={splitOptions(lines, { ...planOpts, goodsTotal: t.afterDiscount })} />
    </div>
  );
  const alert = t.hasSoldOut && <Alert tone="danger" compact={mobile} action={{ label: CART.removeSold, onClick: removeSold }}>{CART_ALERT.soldOut}</Alert>;
  const earn = t.earn > 0 && <EarnNote>{CART.earn(bonusText(t.earn))}</EarnNote>;

  if (mobile) {
    return (
      <div className={c.mPage}>
        <MobileTopBar title="Корзина" sub={title} backHref="/" right={!empty && lines.length > 0 ? <button type="button" className={c.clear} onClick={clear}>{CART.clearShort}</button> : undefined}>
          {!empty && lines.length > 0 && <MethodCard mobile label={methodLabel} address={address} onChange={openMethod} />}
        </MobileTopBar>
        {!ready ? <div className={c.mBody}><Skeleton h={200} r={20} /><Skeleton h={120} r={20} /></div>
          : empty ? (
            <div className={c.emptyM}>
              <span className={c.emptyPicM}><img src="/assets/empty-cart.png" alt="" /></span>
              <b className={c.emptyTitleM}>{CART.empty.title}</b>
              <span className={c.emptyText}>{CART.empty.textMobile}</span>
              <MartButton label="В каталог" size={56} href="/catalog" />
            </div>
          ) : (
            <>
              <div className={c.mBody}>
                {alert}{split}{shipments}
                <div className={`${c.cardM} ${c.stack12}`}>
                  <MartPromo key={promoField.promoKey} {...promoField.props} />
                  <TotalsRows compact totals={t} goodsLabel={title} promo={promo} discountLabel="Промокод">{earn}</TotalsRows>
                </div>
              </div>
              <div className={c.ctaBar}>{reasonText}{cta}</div>
            </>
          )}
        <SiteTabBar active="cart" count={ready ? t.count : undefined} />
      </div>
    );
  }

  return (
    <div className={s.page}>
      <SiteHeader categories={categories} mobile={false} />
      <div className={c.wrap}>
        <nav className={c.crumbs} aria-label="Навигация"><Link href="/">Главная</Link><span aria-hidden>·</span><span className={c.current} aria-current="page">Корзина</span></nav>
        {!ready ? <div className={c.grid}><Skeleton h={320} r={24} /><Skeleton h={420} r={24} /></div>
          : empty ? (
            <div className={c.empty}>
              <span className={c.emptyPic}><img src="/assets/empty-cart.png" alt="" /></span>
              <h1 className={c.emptyTitle}>{CART.empty.title}</h1>
              <span className={c.emptyText}>{CART.empty.text}</span>
              <MartButton label="В каталог" size={56} href="/catalog" />
            </div>
          ) : (
            <div className={c.grid}>
              <main className={c.main}>
                <div className={c.titleRow}>
                  <h1 className={c.h1}>Корзина <span className={c.h1Sub}>· {title}</span></h1>
                  <button type="button" className={c.clear} onClick={clear}>{CART.clear}</button>
                </div>
                {alert}{split}{shipments}
                {upsell.length > 0 && (
                  <section className={c.upsell} aria-label={CART.upsell}>
                    <h2 className={c.h2}>{CART.upsell}</h2>
                    <div className={c.upsellGrid}>
                      {upsell.map(p => <MartProductCard key={p.id} product={p} qty={cart[p.id] || 0} onQty={setCartQty} onOpen={x => openQuickView(x.id)} />)}
                    </div>
                  </section>
                )}
              </main>
              <aside className={c.aside}>
                <MethodCard label={methodLabel} address={address} onChange={openMethod} />
                <MartPromo key={promoField.promoKey} {...promoField.props} />
                <div className={c.divider} />
                <TotalsRows totals={t} goodsLabel={title} promo={promo} />
                <div className={c.divider} />
                <TotalLine total={t.total} />
                {earn}
                {cta}
                {reasonText}
              </aside>
            </div>
          )}
      </div>
    </div>
  );
}
