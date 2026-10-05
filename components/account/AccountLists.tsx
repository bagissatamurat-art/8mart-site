'use client';
// Адреса, способы оплаты, промокоды, бонусы, избранное — разделы кабинета по site/MartAccount.dc.html.
import { useEffect, useRef, useState } from 'react';
import { BONUS_RULES } from '@/lib/config';
import { groupDigits, plural } from '@/lib/domain';
import type { Address, Bonus, Card, Product, UserPromo } from '@/lib/types';
import { MartProductCard } from '../MartProductCard';
import { Cross } from '../ui/Cross';
import s from '../MartAccount.module.css';
import { EMPTY } from '@/lib/copy';
import { asset } from '@/lib/basePath';

// ── Адреса ──

export interface AccountAddressesProps {
  addresses: Address[];
  /** Добавить (null) / изменить адрес — страница открывает MartMethodModal addressOnly. */
  onEditAddress?: (address: Address | null) => void;
  onDeleteAddress?: (address: Address) => void;
  onMakeDefault?: (address: Address) => void;
}

export function AccountAddresses({ addresses, onEditAddress, onDeleteAddress, onMakeDefault }: AccountAddressesProps) {
  return (
    <>
      {addresses.map(a => {
        const details = [a.entrance && `подъезд ${a.entrance}`, a.floor && `этаж ${a.floor}`, a.flat && `кв. ${a.flat}`].filter(Boolean).join(', ');
        return (
          <article key={a.id} className={`${s.card} ${a.isDefault ? s.accent : s.plain}`}>
            <div className={s.col}>
              <span className={s.addrTitle}><b>{a.title}</b>{a.isDefault && <span className={s.pillTag}>Основной</span>}</span>
              <span className={s.addrStreet}>{a.street}, {a.city}</span>
              {details && <span className={s.muted13}>{details}</span>}
            </div>
            <div className={s.acts}>
              {!a.isDefault && onMakeDefault && (
                <button type="button" className={`${s.textBtn} ${s.textBtnPrimary}`} onClick={() => onMakeDefault(a)}>Сделать основным</button>
              )}
              <button type="button" className={s.textBtn} onClick={() => onEditAddress?.(a)} aria-label={`Изменить адрес «${a.title}»`}>Изменить</button>
              <button type="button" className={s.textBtn} onClick={() => onDeleteAddress?.(a)} aria-label={`Удалить адрес «${a.title}»`}>Удалить</button>
            </div>
          </article>
        );
      })}
      <button type="button" className={s.addBtn} onClick={() => onEditAddress?.(null)}><span className={s.plus} aria-hidden />Добавить адрес</button>
    </>
  );
}

// ── Способы оплаты ──

export function AccountPayments({ cards, onDeleteCard }: { cards: Card[]; onDeleteCard?: (card: Card) => void }) {
  return (
    <>
      <div className={`${s.card} ${s.row}`}>
        <img src={asset('/assets/kaspi-logo.svg')} alt="Kaspi" className={s.payIcon} />
        <span className={s.col}>
          <b className={s.payTitle}>Kaspi Pay</b>
          <span className={s.muted13}>Оплата в приложении Kaspi — привязывать не нужно</span>
        </span>
      </div>
      {cards.map(c => (
        <div key={c.id} className={`${s.card} ${s.row}`}>
          <span className={s.cardIcon} aria-hidden><span className={s.cardGlyph} /></span>
          <span className={`${s.col} ${s.grow}`}>
            <span className={s.addrTitle}><b className={s.payTitle}>{c.brand} •• {c.last4}</b>{c.isDefault && <span className={s.pillTag}>Основная</span>}</span>
            <span className={s.muted13}>Действует до {c.exp}</span>
          </span>
          <button type="button" className={s.iconBtn} aria-label={`Удалить карту ${c.brand} •• ${c.last4}`} onClick={() => onDeleteCard?.(c)}>
            <Cross size={14} />
          </button>
        </div>
      ))}
      <span className={s.hint}>Новая карта сохранится при следующей оплате картой онлайн</span>
    </>
  );
}

// ── Промокоды ──

export function AccountPromos({ promos }: { promos: UserPromo[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const copy = (code: string) => {
    try { void navigator.clipboard?.writeText(code); } catch { /* буфер недоступен — показываем код, его видно */ }
    clearTimeout(t.current);
    setCopied(code);
    t.current = setTimeout(() => setCopied(null), 1600);
  };
  return (
    <>
      {!promos.length && (
        <div className={`${s.card} ${s.empty}`}>
          <p className={s.emptyTitle}>{EMPTY.promos.title}</p>
          <p className={s.emptyText}>{EMPTY.promos.text}</p>
        </div>
      )}
      {promos.map(c => {
        const active = c.status === 'active', done = copied === c.code;
        return (
          <div key={c.code} className={`${s.card} ${s.row} ${active ? '' : s.dim}`}>
            <span className={`${s.code} ${active ? '' : s.codeOff}`}>{c.code}</span>
            <span className={`${s.col} ${s.grow}`}>
              <b className={s.payTitle}>{c.title}</b>
              <span className={s.muted13}>{c.cond} · {c.until}</span>
            </span>
            {active && (
              <button type="button" className={`${s.copyBtn} ${done ? s.copied : ''}`} onClick={() => copy(c.code)} aria-label={done ? 'Скопировано' : `Скопировать промокод ${c.code}`}>
                <span aria-live="polite">{done ? 'Скопировано' : 'Скопировать'}</span>
              </button>
            )}
          </div>
        );
      })}
      <span className={s.hint}>Промокод вводится в корзине или при оформлении</span>
    </>
  );
}

// ── Бонусы ──

export function AccountBonus({ bonus }: { bonus: Bonus }) {
  const maxPart = bonus.maxPart ?? BONUS_RULES.maxPart;
  return (
    <>
      <div className={s.balance}>
        <span className={s.balanceLabel}>Ваш баланс</span>
        <span className={s.balanceRow}>
          <b className={s.balanceValue}>{groupDigits(bonus.balance)}</b>
          <span className={s.balanceWord}>{plural(bonus.balance, 'бонус', 'бонуса', 'бонусов')}</span>
        </span>
        <p className={s.rules}>
          1 бонус = 1 тг · за товары с отметкой <span className={s.miniBonus}><span className={s.miniCoin} aria-hidden>Б</span>+N</span> начисляем бонусы после получения заказа · оплачивайте бонусами до {maxPart}% суммы товаров
        </p>
      </div>
      <div className={`${s.card} ${s.histCard}`}>
        <h2 className={s.histTitle}>История</h2>
        {bonus.history.length ? (
          <ul className={s.hist}>
            {bonus.history.map(h => (
              <li key={h.id} className={s.histRow}>
                <span className={s.col}>
                  <span className={s.histName}>{h.title}</span>
                  <span className={s.date}>{h.date}</span>
                </span>
                <b className={`${s.histAmount} ${h.amount > 0 ? s.plusAmount : ''}`}>{(h.amount > 0 ? '+' : '−') + groupDigits(Math.abs(h.amount))}</b>
              </li>
            ))}
          </ul>
        ) : <span className={s.muted13}>{EMPTY.bonusHistory}</span>}
      </div>
    </>
  );
}

// ── Избранное ──

export interface AccountFavoritesProps {
  favorites: Product[];
  /** Количество в корзине по id товара — для степпера в карточке. */
  cart?: Record<string, number>;
  onQty?: (id: string, qty: number) => void;
  onOpenProduct?: (p: Product) => void;
}

export function AccountFavorites({ favorites, cart, onQty, onOpenProduct }: AccountFavoritesProps) {
  if (!favorites.length) {
    return (
      <div className={`${s.card} ${s.empty}`}>
        <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 20.5s-7.5-4.6-9.3-9.3C1.5 8 3.4 4.5 6.9 4.5c2 0 3.5 1.1 5.1 3 1.6-1.9 3.1-3 5.1-3 3.5 0 5.4 3.5 4.2 6.7-1.8 4.7-9.3 9.3-9.3 9.3z"
            fill="none" stroke="var(--acc-muted-line)" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <p className={s.emptyTitle}>{EMPTY.favorites.title}</p>
        <p className={s.emptyText}>{EMPTY.favorites.text}</p>
      </div>
    );
  }
  return (
    <div className={s.favGrid}>
      {favorites.map(p => <MartProductCard key={p.id} product={p} qty={cart?.[p.id] || 0} onQty={onQty} onOpen={onOpenProduct} />)}
    </div>
  );
}
