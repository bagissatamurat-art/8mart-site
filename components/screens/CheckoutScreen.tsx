'use client';
// Оформление — 03 Оформление.dc.html: 3a (1440) и 3b (390). Вход → получатель → способ и отправления → оплата → оферта → CTA.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { MartAuth } from '@/components/MartAuth';
import { MartButton } from '@/components/MartButton';
import { MartChip } from '@/components/MartChip';
import { MartInput } from '@/components/MartInput';
import { MartPromo } from '@/components/MartPromo';
import { MartShipmentHead, MartSplitChoice } from '@/components/MartShipments';
import { MartCheckbox } from '@/components/checkout/MartCheckbox';
import { MartPayment } from '@/components/checkout/MartPayment';
import { MartToggleRow } from '@/components/checkout/MartToggleRow';
import { EarnNote, SummaryLines, TotalLine, TotalsRows } from '@/components/checkout/OrderSummary';
import { MobileTopBar } from '@/components/checkout/MobileTopBar';
import { SiteHeader } from '@/components/site/SiteHeader';
import { Skeleton } from '@/components/ui/Spinner';
import { createOrder, getBonus, getCards } from '@/lib/api';
import { SHIPPING } from '@/lib/config';
import { CART, CHECKOUT, CTA_BLOCKED } from '@/lib/copy';
import { bonusText, groupDigits, itemsTitle, money, orderTotals, splitOptions } from '@/lib/domain';
import { useCartLines } from '@/lib/hooks/useCartLines';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { usePromo } from '@/lib/hooks/usePromo';
import { useAuth } from '@/lib/store/auth';
import { useCart } from '@/lib/store/cart';
import { useMethod } from '@/lib/store/method';
import { useUi } from '@/lib/store/ui';
import type { Bonus, Card, Category } from '@/lib/types';
import s from '@/components/site/site.module.css';
import c from './CheckoutScreen.module.css';

export function CheckoutScreen({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const mobile = useIsMobile();
  const { lines, ready } = useCartLines();
  const cart = useCart(st => st.lines);
  const together = useCart(st => st.together);
  const setTogether = useCart(st => st.setTogether);
  const promo = useCart(st => st.promo);
  const clear = useCart(st => st.clear);
  const m = useMethod();
  const openMethod = useUi(st => st.openMethod);
  const user = useAuth(st => st.user);
  const login = useAuth(st => st.login);

  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [entrance, setEntrance] = useState(''), [floor, setFloor] = useState(''), [flat, setFlat] = useState('');
  const [comment, setComment] = useState('');
  const [slot, setSlot] = useState('asap');
  const [cargoDay, setCargoDay] = useState(0), [cargoInt, setCargoInt] = useState(0);
  const [lift, setLift] = useState(false);
  const [useBonus, setUseBonus] = useState(false);
  const [pay, setPay] = useState('kaspi');
  const [offer, setOffer] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [bonus, setBonus] = useState<Bonus | null>(null);
  /** Заказ создан — корзина очищается, но назад в /cart не уводим. */
  const placed = useRef(false);

  // Пустая корзина или не выбран способ — назад в корзину.
  useEffect(() => { if (ready && !placed.current && (!lines.length || !m.method)) router.replace('/cart'); }, [ready, lines.length, m.method, router]);
  useEffect(() => { setEntrance(e => e || m.entrance || ''); setFlat(f => f || m.flat || ''); }, [m.entrance, m.flat]);
  useEffect(() => {
    if (!user) return;
    setName(n => n || user.name);
    getCards().then(cs => setCards(cs));
    getBonus().then(setBonus);
  }, [user]);

  const method = m.method || 'delivery', pk = method === 'pickup';
  const planOpts = { method, together, pickupPoint: pk ? m.label : '', floor, lift };
  const t = orderTotals({ lines, plan: planOpts, promoPct: promo?.pct ?? 0, useBonus: !!user && useBonus, balance: bonus?.balance ?? 0, maxPart: bonus?.maxPart ?? 0 });
  const promoField = usePromo(t.goods, t.discount);
  const reason = !name.trim() ? CHECKOUT.nameRequired : !offer ? CTA_BLOCKED.offer : t.hasSoldOut ? CTA_BLOCKED.soldOut : '';
  const kaspi = pay === 'kaspi';
  const cargo = t.plan.list.find(x => x.isCargo);
  const floorN = parseInt(floor, 10) || 0;
  const liftSub = !cargo ? '' : floorN > 1
    ? CHECKOUT.liftSub.priced(money(SHIPPING.cargo.liftFee).replace('тг.', 'тг'), cargo.cargoUnits, floorN, money(SHIPPING.cargo.liftFee * cargo.cargoUnits * (floorN - 1)))
    : floorN === 1 ? CHECKOUT.liftSub.firstFloor : CHECKOUT.liftSub.noFloor;

  const place = async () => {
    if (reason || !user) { setNameTouched(true); return; }
    setPlacing(true);
    try {
      const { id } = await createOrder({
        cart, method, city: m.city, address: m.address, pickupPointId: m.pickupPointId, entrance, floor, flat, comment,
        recipient: { name: name.trim(), phone: user.phone }, together, courierSlot: slot, cargoDay, cargoInterval: cargoInt, lift,
        promo: promo?.code, useBonus, payment: kaspi ? 'kaspi' : 'card', cardId: kaspi || pay === 'card' ? null : pay,
      });
      placed.current = true;
      router.push(`/order/${id}`);
      clear();
    } catch { setPlacing(false); }
  };

  const summary = lines.filter(l => !l.soldOut).map(l => ({ key: l.p.id, img: l.p.img, name: l.p.name, qty: l.qty, price: l.p.price }));
  const title = itemsTitle(t.count);
  const earn = t.earn > 0 && <EarnNote>{CART.earn(bonusText(t.earn))}</EarnNote>;
  const spend = !!user && t.spendMax > 0 && (
    <MartToggleRow tone="bonus" coin on={useBonus} onToggle={() => setUseBonus(v => !v)}
      title={`Списать ${bonusText(t.spendMax).slice(1)}`} sub={`На счёте ${groupDigits(bonus?.balance ?? 0)} · до ${bonus?.maxPart}% суммы товаров`} />
  );
  const cta = <MartButton label={kaspi ? undefined : 'Оплатить'} amount={money(t.total)} variant={kaspi ? 'kaspi' : 'primary'} size={56} full
    disabled={!!reason} reason={reason} loading={placing} onClick={place} />;
  const reasonText = reason && <span className={mobile ? c.reasonM : c.reason}>{reason}</span>;
  const chipSize = mobile ? 36 : 40;
  const chips = (items: { label: string; sel: boolean; pick: () => void }[]) => (
    <div className={mobile ? c.chipsScroll : c.chips}>{items.map(x => <MartChip key={x.label} label={x.label} selected={x.sel} size={chipSize} onClick={x.pick} />)}</div>
  );

  const auth = (
    <div className={mobile ? c.authM : c.authCard}>
      <MartAuth mode={mobile ? 'mobile' : 'desktop'} onDone={r => { login({ phone: r.phone, name: r.name ?? '' }, r.accessToken); setName(r.name ?? ''); }} />
    </div>
  );

  const recipient = (
    <section className={mobile ? c.cardM : c.card}>
      <div className={c.cardHead}>
        {mobile ? <b className={c.h16}>Получатель</b> : <h2 className={c.h2}>Получатель</h2>}
        {!mobile && user && <span className={c.muted13}>Вы вошли как {user.phone}</span>}
      </div>
      <div className={mobile ? c.stack12 : c.grid2}>
        <MartInput label="Имя" required value={name} onChange={setName} onBlur={() => setNameTouched(true)} error={nameTouched && !name.trim() ? true : undefined} />
        <MartInput label="Телефон" type="phone" required value={user?.phone ?? ''} />
      </div>
    </section>
  );

  const methodSection = (
    <section className={mobile ? c.cardM : c.card}>
      <div className={c.cardHead}>
        {mobile ? <b className={c.h16}>{pk ? 'Самовывоз' : 'Доставка'}</b> : <h2 className={c.h2}>{pk ? 'Самовывоз' : 'Доставка'}</h2>}
        <button type="button" className={mobile ? c.linkSm : c.link} onClick={openMethod}>Изменить</button>
      </div>
      <div className={mobile ? c.addrM : c.addr}><span className={c.addrDot} /><span className={c.addrText}>{m.label}</span></div>
      {!pk && (
        <div className={mobile ? c.grid3m : c.grid3}>
          <MartInput label="Подъезд" value={entrance} onChange={setEntrance} />
          <MartInput label="Этаж" value={floor} onChange={setFloor} />
          <MartInput label={mobile ? 'Кв.' : 'Квартира, офис'} value={flat} onChange={setFlat} />
        </div>
      )}
      {t.plan.canSplit && <MartSplitChoice compact={mobile} method={method} onPick={setTogether} options={splitOptions(lines, { ...planOpts, goodsTotal: t.afterDiscount })} />}
      {t.plan.list.map(sh => (
        <div key={sh.id} className={mobile ? c.shipM : c.ship}>
          <MartShipmentHead compact={mobile} kind={sh.kind} method={method} label={sh.label} meta={sh.meta} feeText={sh.feeText}
            when={sh.isCargo && !pk ? `${SHIPPING.cargo.days[cargoDay]}, ${SHIPPING.cargo.intervals[cargoInt]}` : sh.when} />
          <div className={c.thumbs}>{sh.lines.filter(l => !l.soldOut).map(l => l.p.img && <img key={l.p.id} src={l.p.img} alt="" className={c.thumb} />)}</div>
          {!pk && sh.isCourier && (
            <div className={c.slotGroup}><span className={c.slotTitle}>Когда доставить</span>
              {chips(SHIPPING.courier.slots.map(([id, label]) => ({ label, sel: slot === id, pick: () => setSlot(id) })))}</div>
          )}
          {!pk && sh.isCargo && (
            <>
              <div className={c.slotGroup}><span className={c.slotTitle}>День</span>
                {chips(SHIPPING.cargo.days.map((label, i) => ({ label, sel: cargoDay === i, pick: () => setCargoDay(i) })))}</div>
              <div className={c.slotGroup}><span className={c.slotTitle}>Интервал</span>
                {chips(SHIPPING.cargo.intervals.map((label, i) => ({ label, sel: cargoInt === i, pick: () => setCargoInt(i) })))}</div>
              <MartToggleRow title="Подъём на этаж" sub={liftSub} on={lift} onToggle={() => setLift(v => !v)} />
            </>
          )}
        </div>
      ))}
      {!mobile && <MartInput label="Комментарий" type="textarea" value={comment} onChange={setComment} />}
    </section>
  );

  const payment = (
    <section className={mobile ? c.cardM : c.card}>
      {mobile ? <b className={c.h16}>Оплата</b> : <h2 className={c.h2}>Оплата</h2>}
      <MartPayment value={pay} cards={cards} mobile={mobile} onChange={setPay} />
    </section>
  );

  const offerBox = (
    <div className={c.offer}>
      <MartCheckbox checked={offer} onChange={setOffer} small={mobile}>Согласен с <a href="#" onClick={e => e.stopPropagation()}>{CHECKOUT.offer}</a> и возврата</MartCheckbox>
    </div>
  );

  if (!ready || !lines.length || placed.current) {
    return <div className={c.loading}><Skeleton h={56} r={16} /><Skeleton h={320} r={24} /></div>;
  }

  if (mobile) {
    return (
      <div className={c.mPage}>
        <MobileTopBar title={user ? 'Оформление' : 'Вход'} backHref="/cart" right={<span className={c.count}>{title}</span>} />
        {!user ? <div className={c.mAuthWrap}>{auth}</div> : (
          <>
            <div className={c.mBody}>
              {recipient}
              {methodSection}
              {payment}
              <section className={`${c.cardM} ${c.stack12}`}>
                <div className={c.cardHead}><b className={c.h16}>{title}</b><Link href="/cart" className={c.linkSm}>Изменить</Link></div>
                <SummaryLines lines={summary} mobile />
                <MartPromo key={promoField.promoKey} {...promoField.props} />
                {spend}
                <div className={c.divider} />
                <TotalsRows compact totals={{ ...t, progress: null }} promo={promo} />
                <div className={c.divider} />
                <TotalLine total={t.total} small />
                {earn}
              </section>
              {offerBox}
            </div>
            <div className={c.ctaBar}>{cta}{reasonText}</div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={s.page}>
      <SiteHeader categories={categories} mobile={false} />
      <div className={c.wrap}>
        <nav className={c.crumbs} aria-label="Навигация"><Link href="/">Главная</Link><span aria-hidden>·</span><Link href="/cart">Корзина</Link><span aria-hidden>·</span><span className={c.current} aria-current="page">Оформление</span></nav>
        <div className={c.grid}>
          <main className={c.main}>
            <h1 className={c.h1}>Оформление</h1>
            {!user ? auth : <>{recipient}{methodSection}{payment}{offerBox}</>}
          </main>
          <aside className={c.aside}>
            <div className={c.asideHead}><b className={c.h18}>{title}</b><Link href="/cart" className={c.link}>Изменить</Link></div>
            <SummaryLines lines={summary} />
            {user && <MartPromo key={promoField.promoKey} {...promoField.props} />}
            {spend}
            <div className={c.divider} />
            <TotalsRows totals={{ ...t, progress: null }} promo={promo} />
            <div className={c.divider} />
            <TotalLine total={t.total} />
            {earn}
            {user ? <>{cta}{reasonText}</> : <span className={c.hint}>{CHECKOUT.loginToContinue}</span>}
          </aside>
        </div>
      </div>
    </div>
  );
}
