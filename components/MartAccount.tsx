'use client';
// MartAccount — COMPONENTS.md → MartAccount; референс site/MartAccount.dc.html (контент разделов)
// и site/06 Личный кабинет.dc.html (сайдбар, меню и экран раздела — MartAccountNav).
// Чисто презентационный: данные приходят пропсами, действия — колбэками. Загрузка — скелетоны (пульс 1.4 с).
import type { Address, Bonus, Card, Order, Product, User, UserPromo } from '@/lib/types';
import { Skeleton } from './ui/Spinner';
import { AccountOrders } from './account/AccountOrders';
import { AccountAddresses, AccountBonus, AccountFavorites, AccountPayments, AccountPromos } from './account/AccountLists';
import { AccountProfile } from './account/AccountProfile';
import { defaultOrderHref, type AccountSection } from './account/sections';
import s from './MartAccount.module.css';

export { MartAccountNav, MartAccountScreenHeader, type MartAccountNavProps } from './account/MartAccountNav';
export { ACCOUNT_SECTIONS, sectionTitle, navBadges, type AccountSection } from './account/sections';

export interface MartAccountData {
  orders?: Order[];
  addresses?: Address[];
  cards?: Card[];
  promos?: UserPromo[];
  bonus?: Bonus | null;
  user?: User | null;
  /** Товары избранного (страница собирает их из useFavorites()). */
  favorites?: Product[];
  /** Количество в корзине по id — для степпера карточек избранного. */
  cart?: Record<string, number>;
}

export interface MartAccountProps {
  section?: AccountSection;
  mode?: 'desktop' | 'mobile';
  loading?: boolean;
  data?: MartAccountData;
  /** «Повторить»: положить товары заказа в корзину (страница показывает тост «Товары из заказа добавлены в корзину»). */
  onRepeat?: (order: Order) => void | Promise<unknown>;
  /** Ссылка «Подробнее» / «Следить за заказом», по умолчанию /order/<id>. */
  orderHref?: (id: string) => string;
  onOpenOrder?: (id: string) => void;
  /** Добавить (null) / изменить адрес → страница открывает MartMethodModal addressOnly. */
  onEditAddress?: (address: Address | null) => void;
  onDeleteAddress?: (address: Address) => void;
  /** «Сделать основным» (есть в референсе); без колбэка кнопка скрыта. */
  onMakeDefaultAddress?: (address: Address) => void;
  onDeleteCard?: (card: Card) => void;
  /** «Изменить» телефон → страница открывает MartAuth purpose="changePhone". */
  onChangePhone?: () => void;
  onSaveName?: (name: string) => void | Promise<unknown>;
  /** Подтверждённое удаление аккаунта → главная `/?deleted=1`. */
  onDeleteAccount?: () => void | Promise<unknown>;
  onQty?: (id: string, qty: number) => void;
  onOpenProduct?: (p: Product) => void;
  /** Витрина: открыть диалог удаления сразу и держать его внутри рамки. */
  demoConfirmOpen?: boolean;
  demoInlineDialog?: boolean;
  className?: string;
}

export function MartAccount({
  section = 'orders', mode = 'desktop', loading, data = {}, onRepeat, orderHref = defaultOrderHref, onOpenOrder,
  onEditAddress, onDeleteAddress, onMakeDefaultAddress, onDeleteCard, onChangePhone, onSaveName, onDeleteAccount, onQty, onOpenProduct,
  demoConfirmOpen, demoInlineDialog, className,
}: MartAccountProps) {
  const m = mode === 'mobile';
  const cls = [s.root, m && s.m, className].filter(Boolean).join(' ');

  // Нет данных нужного раздела — тоже загрузка
  const need: Record<AccountSection, unknown> = {
    orders: data.orders, favorites: data.favorites, addresses: data.addresses, payments: data.cards,
    promos: data.promos, bonus: data.bonus, profile: data.user,
  };
  if (loading || need[section] == null) {
    return (
      <div className={cls} aria-busy="true" aria-label="Загрузка">
        {[0, 1, 2].map(k => (
          <div key={k} className={`${s.card} ${s.skel}`}>
            <Skeleton w="40%" h={18} r={6} />
            <Skeleton w="70%" h={14} r={6} style={{ background: 'var(--surface-page)' }} />
            <div className={s.skelRow}>{[0, 1, 2].map(i => <Skeleton key={i} w={48} h={48} r={10} style={{ background: 'var(--surface-page)' }} />)}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cls}>
      {section === 'orders' && <AccountOrders orders={data.orders!} mobile={m} orderHref={orderHref} onOpenOrder={onOpenOrder} onRepeat={onRepeat} />}
      {section === 'favorites' && <AccountFavorites favorites={data.favorites!} cart={data.cart} onQty={onQty} onOpenProduct={onOpenProduct} />}
      {section === 'addresses' && <AccountAddresses addresses={data.addresses!} onEditAddress={onEditAddress} onDeleteAddress={onDeleteAddress} onMakeDefault={onMakeDefaultAddress} />}
      {section === 'payments' && <AccountPayments cards={data.cards!} onDeleteCard={onDeleteCard} />}
      {section === 'promos' && <AccountPromos promos={data.promos!} />}
      {section === 'bonus' && <AccountBonus bonus={data.bonus!} />}
      {section === 'profile' && <AccountProfile user={data.user!} mobile={m} onChangePhone={onChangePhone} onSaveName={onSaveName}
        onDeleteAccount={onDeleteAccount} confirmOpen={demoConfirmOpen} inlineDialog={demoInlineDialog} />}
    </div>
  );
}
