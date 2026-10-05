'use client';
// Личный кабинет — 06 Личный кабинет.dc.html: 6a (1440: шапка, сайдбар 280 · раздел · мини-корзина 340),
// 6b (390: меню «Профиль» — /account), 6c (390: экран раздела с «Назад» — /account/<раздел>).
// Контент разделов — MartAccount (MartAccount.dc.html). Гость — вход MartAuth (LoginScreen).
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MartAccount, MartAccountNav, MartAccountScreenHeader, sectionTitle, type AccountSection } from '@/components/MartAccount';
import { MartMethodModal } from '@/components/MartMethodModal';
import { MartAuthDialog } from '@/components/auth/MartAuthDialog';
import type { MethodValue } from '@/components/method/types';
import { ActionToast } from '@/components/account-screen/ActionToast';
import { useAccountData } from '@/components/account-screen/useAccountData';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteMiniCart } from '@/components/site/SiteMiniCart';
import { SiteTabBar } from '@/components/site/SiteTabBar';
import { Skeleton } from '@/components/ui/Spinner';
import { createAddress, deleteAddress, deleteCard, deleteMe, getCities, resolveCartItem, updateAddress, updateMe } from '@/lib/api';
import { ACCOUNT_PAGE, TOASTS } from '@/lib/copy';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useAuth } from '@/lib/store/auth';
import { useCart } from '@/lib/store/cart';
import { setCartQty, useUi } from '@/lib/store/ui';
import type { Address, Card, Category, Order, Product, User } from '@/lib/types';
import s from '@/components/site/site.module.css';
import c from './AccountScreen.module.css';
import l from '@/components/site/page.module.css';
import { LoginScreen } from './LoginScreen';

export interface AccountScreenProps {
  categories: Category[];
  /** Раздел из адреса /account/<раздел>; без него — /account (desktop: «Мои заказы», mobile: меню разделов). */
  section?: AccountSection;
}

const hrefFor = (id: AccountSection) => `/account/${id}`;

export function AccountScreen({ categories, section }: AccountScreenProps) {
  const mobile = useIsMobile();
  const router = useRouter();
  const hydrated = useUi(st => st.hydrated);
  const openQuickView = useUi(st => st.openQuickView);
  const authUser = useAuth(st => st.user);
  const accessToken = useAuth(st => st.accessToken);
  const login = useAuth(st => st.login);
  const setAuthName = useAuth(st => st.setName);
  const logout = useAuth(st => st.logout);
  const cart = useCart(st => st.lines);

  const cur: AccountSection = section ?? 'orders';
  const menu = mobile && !section; // 6b — список разделов
  const [leaving, setLeaving] = useState(false);
  const d = useAccountData(hydrated && !!authUser && !leaving, cur === 'favorites' && !menu);

  const [addrEdit, setAddrEdit] = useState<Address | null | undefined>(undefined); // undefined — модалка закрыта, null — новый
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const closeToast = useCallback(() => setToast(false), []);

  // До гидрации сторов (вход в localStorage) и при выходе — скелетон, а не форма входа
  if (!hydrated || leaving) return <AccountSkeleton categories={categories} mobile={mobile} />;
  if (!authUser) return <LoginScreen categories={categories} />;

  // Профиль: имя и телефон — из входа (они свежее мока GET /me), остальное — из getMe()
  const user: User | undefined = d.me && { ...d.me, name: authUser.name || d.me.name, phone: authUser.phone || d.me.phone };
  const navUser = { name: authUser.name || d.me?.name || '', phone: authUser.phone };

  // ── Действия ──
  const onRepeat = async (o: Order) => {
    const add = useCart.getState().add;
    o.items.forEach(it => { if (resolveCartItem(it.id)) add(it.id, it.qty); });
    setToast(true);
  };
  const onSaveAddress = async (v: MethodValue) => {
    const cities = await getCities();
    const city = cities.find(x => x.id === v.city)?.name ?? v.city;
    const item = { title: v.title || ACCOUNT_PAGE.addressDefaultTitle, street: v.address, city, entrance: v.entrance ?? '', flat: v.flat ?? '' };
    const editing = addrEdit;
    setAddrEdit(undefined);
    if (editing) {
      const saved = await updateAddress({ ...editing, ...item });
      d.patch(x => ({ addresses: (x.addresses ?? []).map(a => a.id === saved.id ? saved : a) }));
    } else {
      const saved = await createAddress({ ...item, floor: '', isDefault: !(d.addresses ?? []).length });
      d.patch(x => ({ addresses: [...(x.addresses ?? []), saved] }));
    }
  };
  const onDeleteAddress = async (a: Address) => {
    await deleteAddress(a.id);
    d.patch(x => {
      const rest = (x.addresses ?? []).filter(y => y.id !== a.id);
      // Удалили основной — основным становится первый оставшийся
      return { addresses: a.isDefault && rest.length ? rest.map((y, i) => ({ ...y, isDefault: i === 0 })) : rest };
    });
  };
  const onMakeDefault = async (a: Address) => {
    await updateAddress({ ...a, isDefault: true });
    d.patch(x => ({ addresses: (x.addresses ?? []).map(y => ({ ...y, isDefault: y.id === a.id })) }));
  };
  const onDeleteCard = async (card: Card) => {
    await deleteCard(card.id);
    d.patch(x => ({ cards: (x.cards ?? []).filter(y => y.id !== card.id) }));
  };
  const onSaveName = async (name: string) => {
    const me = await updateMe({ name });
    setAuthName(name);
    d.patch({ me: { ...me, name } });
  };
  const onDeleteAccount = async () => {
    await deleteMe();
    setLeaving(true);
    logout();
    router.push('/?deleted=1');
  };
  const onLogout = () => { setLeaving(true); logout(); router.push('/'); };
  const onOpenProduct = (p: Product) => openQuickView(p.id);

  const account = (
    <MartAccount section={cur} mode={mobile ? 'mobile' : 'desktop'}
      data={{ orders: d.orders, addresses: d.addresses, cards: d.cards, promos: d.promos, bonus: d.bonus, user, favorites: d.favorites, cart }}
      onRepeat={onRepeat} onEditAddress={a => setAddrEdit(a)} onDeleteAddress={onDeleteAddress} onMakeDefaultAddress={onMakeDefault}
      onDeleteCard={onDeleteCard} onChangePhone={() => setPhoneOpen(true)} onSaveName={onSaveName} onDeleteAccount={onDeleteAccount}
      onQty={setCartQty} onOpenProduct={onOpenProduct} />
  );
  const error = d.error && <p className={c.error} role="alert">{ACCOUNT_PAGE.loadError}</p>;

  const overlays = (
    <>
      {toast && <ActionToast text={TOASTS.orderRepeated} actionLabel={ACCOUNT_PAGE.toastToCart} actionHref="/cart" mobile={mobile} onClose={closeToast} />}
      <MartMethodModal open={addrEdit !== undefined} addressOnly mode="auto"
        title={addrEdit ? ACCOUNT_PAGE.addressEdit : ACCOUNT_PAGE.addressNew} subtitle={ACCOUNT_PAGE.addressSubtitle} ctaLabel={ACCOUNT_PAGE.addressCta}
        initial={addrEdit ? { method: 'delivery', city: addrEdit.city, address: addrEdit.street, entrance: addrEdit.entrance, flat: addrEdit.flat, title: addrEdit.title } : { method: 'delivery' }}
        onClose={() => setAddrEdit(undefined)} onConfirm={onSaveAddress} />
      <MartAuthDialog open={phoneOpen} purpose="changePhone" mode={mobile ? 'mobile' : 'desktop'} onClose={() => setPhoneOpen(false)}
        onDone={r => {
          login({ name: authUser.name, phone: r.phone }, accessToken);
          d.patch(x => (x.me ? { me: { ...x.me, phone: r.phone } } : {}));
          setPhoneOpen(false);
        }} />
    </>
  );

  if (mobile) {
    // 6b — меню разделов
    if (menu) {
      return (
        <div className={c.mPage}>
          <MartAccountNav mode="mobile" user={navUser} orders={d.orders} promos={d.promos} bonus={d.bonus} hrefFor={hrefFor} onLogout={onLogout} />
          {error && <div className={c.mError}>{error}</div>}
          <SiteTabBar active="profile" />
          {overlays}
        </div>
      );
    }
    // 6c — экран раздела
    return (
      <div className={c.mPage}>
        <div className={c.mHead}><MartAccountScreenHeader title={sectionTitle(cur)} backHref="/account" /></div>
        <div className={c.mBody}>{error}{account}</div>
        <SiteTabBar active="profile" />
        {overlays}
      </div>
    );
  }

  // 6a
  return (
    <div className={s.page}>
      <SiteHeader categories={categories} mobile={false} />
      <div className={c.grid}>
        <div className={c.sticky}>
          <MartAccountNav mode="desktop" section={cur} user={navUser} orders={d.orders} promos={d.promos} bonus={d.bonus} hrefFor={hrefFor} onLogout={onLogout} />
        </div>
        <main className={c.main}>
          <h1 className={l.h1}>{sectionTitle(cur)}</h1>
          {error}
          {account}
        </main>
        <div className={c.sticky}><SiteMiniCart /></div>
      </div>
      {overlays}
    </div>
  );
}

/** Каркас до гидрации: те же колонки и скелетоны (пульс 1.4 с — Skeleton). */
function AccountSkeleton({ categories, mobile }: { categories: Category[]; mobile: boolean }) {
  if (mobile) {
    return (
      <div className={c.mPage} aria-busy="true">
        <div className={c.mSkelHead}><Skeleton w={52} h={52} r={26} /><span className={c.skelCol}><Skeleton w={140} h={20} r={6} /><Skeleton w={120} h={14} r={6} /></span></div>
        <div className={c.mBody}><Skeleton h={360} r={20} style={{ background: 'var(--surface-card)' }} /></div>
        <SiteTabBar active="profile" />
      </div>
    );
  }
  return (
    <div className={s.page} aria-busy="true">
      <SiteHeader categories={categories} mobile={false} />
      <div className={c.grid}>
        <Skeleton h={480} r={24} style={{ background: 'var(--surface-card)' }} />
        <main className={c.main}><Skeleton w="30%" h={37} r={8} /><Skeleton h={220} r={24} style={{ background: 'var(--surface-card)' }} /><Skeleton h={160} r={24} style={{ background: 'var(--surface-card)' }} /></main>
        <div className={c.sticky}><SiteMiniCart /></div>
      </div>
    </div>
  );
}
