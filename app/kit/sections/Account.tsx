'use client';
// Витрина кабинета: MartAccountNav (сайдбар / меню 390) + MartAccount (все разделы, загрузка, пустые состояния, удаление аккаунта).
// Демо-данные — синхронно из lib/mock, действия меняют локальное состояние витрины.
import { useMemo, useState } from 'react';
import { MartAccount, MartAccountNav, MartAccountScreenHeader, ACCOUNT_SECTIONS, sectionTitle, type AccountSection } from '@/components/MartAccount';
import { MartChip } from '@/components/MartChip';
import { MartTabBar } from '@/components/MartTabBar';
import { ADDRESSES, BONUS, CARDS, ORDERS, PRODUCTS, USER, USER_PROMOS } from '@/lib/mock';
import { useFavorites } from '@/lib/store/favorites';
import type { Address, Card, Product, User } from '@/lib/types';
import { KitItem, KitPanel, KitSection } from '../Kit';
import s from './sections.module.css';

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
const frame: React.CSSProperties = { position: 'relative', height: 844, display: 'flex', flexDirection: 'column' };
const statusBar = <div style={{ height: 44, background: 'var(--surface-card)', flex: 'none' }} />;

export default function AccountSection() {
  const [section, setSection] = useState<AccountSection>('orders');
  const [mSection, setMSection] = useState<AccountSection>('orders');
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>(ADDRESSES);
  const [cards, setCards] = useState<Card[]>(CARDS);
  const [user, setUser] = useState<User>(USER);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [log, setLog] = useState('—');
  const favIds = useFavorites();
  const favorites = useMemo(() => favIds.map(id => PRODUCTS.find(p => p.id === id)).filter((p): p is Product => !!p), [favIds]);

  const data = { orders: ORDERS, addresses, cards, promos: USER_PROMOS, bonus: BONUS, user, favorites, cart };
  const handlers = {
    orderHref: (id: string) => `#order-${id}`,
    onOpenOrder: (id: string) => setLog(`Открыть заказ ${id} → /account/orders/${id}`),
    onRepeat: async (o: { id: string }) => { await wait(600); setLog(`Товары заказа №${o.id} добавлены в корзину`); },
    onEditAddress: (a: Address | null) => setLog(a ? `MartMethodModal addressOnly: «${a.title}»` : 'MartMethodModal addressOnly: новый адрес'),
    onDeleteAddress: (a: Address) => setAddresses(list => list.filter(x => x.id !== a.id)),
    onMakeDefaultAddress: (a: Address) => setAddresses(list => list.map(x => ({ ...x, isDefault: x.id === a.id }))),
    onDeleteCard: (c: Card) => setCards(list => list.filter(x => x.id !== c.id)),
    onChangePhone: () => setLog('MartAuth purpose="changePhone"'),
    onSaveName: async (name: string) => { await wait(600); setUser(u => ({ ...u, name })); },
    onDeleteAccount: async () => { await wait(900); setLog('Аккаунт удалён → /?deleted=1'); },
    onQty: (id: string, q: number) => setCart(c => ({ ...c, [id]: q })),
  };
  const nav = { user, orders: ORDERS, promos: USER_PROMOS, bonus: BONUS };
  const reset = () => { setAddresses(ADDRESSES); setCards(CARDS); setUser(USER); setCart({}); setLog('—'); };

  return (
    <KitSection id="account" title="Кабинет · MartAccount"
      note={<>Сайдбар 280 / строки 48 (mobile 56), карточки r24 p20·24 (mobile r20 p16). Действие: <b>{log}</b> · <button type="button" onClick={reset} style={{ border: 0, background: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}>сбросить</button></>}>
      <KitPanel layout="row">
        {ACCOUNT_SECTIONS.map(([id, label]) => <MartChip key={id} label={label} selected={section === id} onClick={() => setSection(id)} />)}
        <MartChip label="Загрузка" selected={loading} onClick={() => setLoading(v => !v)} />
      </KitPanel>

      <div style={{ background: 'var(--surface-page)', borderRadius: 'var(--r-20)', padding: 16, display: 'grid', gridTemplateColumns: '280px minmax(0,1fr)' /* первые две колонки --desktop-cols-account, без мини-корзины */, gap: 16, alignItems: 'start', overflowX: 'auto' }}>
        <MartAccountNav {...nav} section={section} onSelect={setSection} onLogout={() => setLog('Выйти')} />
        <main style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 'var(--fs-h1)', fontWeight: 800, letterSpacing: 'var(--tracking-tight)' }}>{sectionTitle(section)}</h1>
          <MartAccount section={section} loading={loading} data={data} {...handlers} />
        </main>
      </div>

      <KitPanel layout="grid" min={300}>
        <KitItem label="Избранное — пусто"><div style={{ background: 'var(--surface-page)', padding: 12, borderRadius: 'var(--r-20)' }}><MartAccount section="favorites" data={{ favorites: [] }} /></div></KitItem>
        <KitItem label="Адреса — нет ни одного"><div style={{ background: 'var(--surface-page)', padding: 12, borderRadius: 'var(--r-20)' }}><MartAccount section="addresses" data={{ addresses: [] }} {...handlers} /></div></KitItem>
        <KitItem label="Заказы — нет ни одного"><div style={{ background: 'var(--surface-page)', padding: 12, borderRadius: 'var(--r-20)' }}><MartAccount section="orders" data={{ orders: [] }} /></div></KitItem>
        <KitItem label="Загрузка (скелетоны, пульс 1.4 с)"><div style={{ background: 'var(--surface-page)', padding: 12, borderRadius: 'var(--r-20)' }}><MartAccount section="orders" loading /></div></KitItem>
      </KitPanel>

      <KitPanel layout="row" style={{ alignItems: 'flex-start', gap: 24 }}>
        <KitItem label="Mobile 390 · меню «Профиль»">
          <div className={s.phone} style={frame}>
            {statusBar}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <MartAccountNav mode="mobile" {...nav} orderHref={handlers.orderHref} onSelect={setMSection} onLogout={() => setLog('Выйти')} />
            </div>
            <MartTabBar active="profile" />
          </div>
        </KitItem>
        <KitItem label="Mobile 390 · экран раздела (выбор — в меню слева)">
          <div className={s.phone} style={frame}>
            {statusBar}
            <MartAccountScreenHeader title={sectionTitle(mSection)} onBack={() => setMSection('orders')} />
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '12px 16px 16px' }}>
              <MartAccount mode="mobile" section={mSection} loading={loading} data={data} {...handlers} />
            </div>
            <MartTabBar active="profile" />
          </div>
        </KitItem>
        <KitItem label="Mobile 390 · подтверждение удаления">
          <div className={s.phone} style={{ ...frame, overflow: 'hidden' }}>
            {statusBar}
            <MartAccountScreenHeader title="Личные данные" />
            <div style={{ flex: 1, padding: '12px 16px 16px' }}>
              <MartAccount mode="mobile" section="profile" data={data} {...handlers} demoConfirmOpen demoInlineDialog />
            </div>
          </div>
        </KitItem>
      </KitPanel>

      <KitPanel>
        <KitItem label="Desktop · подтверждение удаления (Esc / фон / крестик закрывают)">
          <div style={{ position: 'relative', height: 360, borderRadius: 'var(--r-20)', overflow: 'hidden', background: 'var(--surface-page)', padding: 16 }}>
            <MartAccount section="profile" data={data} {...handlers} demoConfirmOpen demoInlineDialog />
          </div>
        </KitItem>
      </KitPanel>
    </KitSection>
  );
}
