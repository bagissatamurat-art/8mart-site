// Разделы кабинета и общие расчёты по заказам — одно место для сайдбара, мобильного меню и MartAccount.
// Логика — из site/06 Личный кабинет.dc.html и site/MartAccount.dc.html.
import { ORDER_STATUS } from '@/lib/config';
import { groupDigits, plural } from '@/lib/domain';
import type { Bonus, Order, OrderStatus, UserPromo } from '@/lib/types';

export type AccountSection = 'orders' | 'favorites' | 'addresses' | 'payments' | 'promos' | 'bonus' | 'profile';

export const ACCOUNT_SECTIONS: [AccountSection, string][] = [
  ['orders', 'Мои заказы'], ['favorites', 'Избранное'], ['addresses', 'Адреса доставки'], ['payments', 'Способы оплаты'],
  ['promos', 'Промокоды'], ['bonus', 'Бонусы'], ['profile', 'Личные данные'],
];

export const sectionTitle = (id: AccountSection): string => (ACCOUNT_SECTIONS.find(x => x[0] === id) || ACCOUNT_SECTIONS[0])[1];

/** Ссылка «Подробнее» / «Следить за заказом» по умолчанию. */
export const defaultOrderHref = (id: string) => `/order/${id}`;

const ACTIVE: OrderStatus[] = ['accepted', 'assembling', 'onway', 'ready'];
export const isActiveOrder = (o: Pick<Order, 'status'>) => ACTIVE.includes(o.status);

/** Подпись статуса: у самовывоза «Выдан» вместо «Доставлен». */
export function statusLabel(o: Pick<Order, 'status' | 'method'>): string {
  const s = ORDER_STATUS[o.status];
  return o.method === 'pickup' && s.labelPickup ? s.labelPickup : s.label;
}

/** Шкала этапов в карточке заказа: доставка — Принят → Собираем → В пути → Доставлен; самовывоз — … → Готов → Выдан. */
export function orderSteps(o: Pick<Order, 'status' | 'method'>): { label: string; state: 'done' | 'current' | 'todo' }[] {
  const pickup = o.method === 'pickup';
  const ids: OrderStatus[] = pickup ? ['accepted', 'assembling', 'ready', 'done'] : ['accepted', 'assembling', 'onway', 'done'];
  const labels = pickup ? ['Принят', 'Собираем', 'Готов', 'Выдан'] : ['Принят', 'Собираем', 'В пути', 'Доставлен'];
  const cur = ids.indexOf(o.status);
  return labels.map((label, i) => ({ label, state: i < cur ? 'done' : i === cur ? 'current' : 'todo' }));
}

export interface NavBadge { text: string; tone: 'primary' | 'ink' | 'muted' }

/** Счётчики разделов: бонусы — баланс, заказы — «N активный», промокоды — число активных. */
export function navBadges(d: { orders?: Order[]; promos?: UserPromo[]; bonus?: Bonus | null }): Partial<Record<AccountSection, NavBadge>> {
  const out: Partial<Record<AccountSection, NavBadge>> = {};
  const active = (d.orders || []).filter(isActiveOrder).length;
  if (active) out.orders = { text: `${active} ${plural(active, 'активный', 'активных', 'активных')}`, tone: 'primary' };
  if (d.promos) out.promos = { text: String(d.promos.filter(p => p.status === 'active').length), tone: 'muted' };
  if (d.bonus) out.bonus = { text: groupDigits(d.bonus.balance), tone: 'ink' };
  return out;
}
