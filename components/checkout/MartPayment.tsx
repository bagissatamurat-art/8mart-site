'use client';
// Оплата (03): «Kaspi Pay» / «Картой онлайн»; при карте — серый блок «Сохранённые карты» и «Новой картой» с пунктиром и «+».
// Наличных нет. Значение: 'kaspi' | 'card' (новая карта) | id сохранённой карты.
import type { Card } from '@/lib/types';
import { CHECKOUT } from '@/lib/copy';
import s from './checkout.module.css';

export interface MartPaymentProps { value: string; cards?: Card[]; mobile?: boolean; onChange: (v: string) => void }

const CardIcon = ({ dark }: { dark?: boolean }) => <span className={`${s.cardIcon} ${dark ? s.cardIconDark : ''}`} aria-hidden><span /></span>;
const Radio = ({ on }: { on: boolean }) => <span className={`${s.radio} ${on ? s.radioOn : ''}`} aria-hidden><span /></span>;

export function MartPayment({ value, cards = [], mobile, onChange }: MartPaymentProps) {
  const isCard = value !== 'kaspi';
  const saved = cards.find(c => c.id === value);
  const def = (cards.find(c => c.isDefault) || cards[0])?.id ?? 'card';
  const methods = [
    { id: 'kaspi', title: 'Kaspi Pay', sub: 'Оплата в приложении Kaspi', sel: !isCard, pick: () => onChange('kaspi') },
    { id: 'card', title: 'Картой онлайн', sub: saved ? `${saved.brand} •• ${saved.last4}` : value === 'card' && cards.length ? 'Новая карта' : 'Visa, Mastercard', sel: isCard, pick: () => { if (!isCard) onChange(def); } },
  ];
  return (
    <div className={s.payWrap}>
      <div className={mobile ? s.payList : s.payGrid} role="radiogroup" aria-label="Способ оплаты">
        {methods.map(m => (
          <button key={m.id} type="button" role="radio" aria-checked={m.sel} onClick={m.pick} className={`${mobile ? s.payRow : s.payTile} ${m.sel ? s.sel : ''}`}>
            {mobile ? (
              <>
                <span className={s.payLeft}>
                  <span className={s.payIcon}>{m.id === 'kaspi' ? <img src="/assets/kaspi-logo.svg" alt="" className={s.kaspiLogo} /> : <CardIcon />}</span>
                  <span className={s.payText}><span className={s.payTitle}>{m.title}</span><span className={s.paySub12}>{m.sub}</span></span>
                </span>
                <Radio on={m.sel} />
              </>
            ) : (
              <>
                <span className={s.payTop}>
                  <span className={s.payIconTop}>{m.id === 'kaspi' ? <img src="/assets/kaspi-logo.svg" alt="" className={s.kaspiLogo} /> : <CardIcon />}</span>
                  <Radio on={m.sel} />
                </span>
                <span className={s.payText}><span className={s.payTitle}>{m.title}</span><span className={s.paySub}>{m.sub}</span></span>
              </>
            )}
          </button>
        ))}
      </div>
      {isCard && cards.length > 0 && (
        <div className={`${s.saved} ${mobile ? s.savedM : ''}`} role="radiogroup" aria-label="Сохранённые карты">
          <span className={s.savedTitle}>Сохранённые карты</span>
          <div className={mobile ? s.savedList : s.savedGrid}>
            {cards.map(c => (
              <button key={c.id} type="button" role="radio" aria-checked={value === c.id} onClick={() => onChange(c.id)} className={`${s.savedCard} ${value === c.id ? s.sel : ''}`}>
                <span className={s.payLeft}><CardIcon dark /><span className={s.payText}><span className={s.payTitle}>{c.brand} •• {c.last4}</span><span className={s.paySub12}>до {c.exp}{c.isDefault ? ' · основная' : ''}</span></span></span>
                <Radio on={value === c.id} />
              </button>
            ))}
          </div>
          <div className={s.savedDivider} />
          <button type="button" role="radio" aria-checked={value === 'card'} onClick={() => onChange('card')} className={`${s.savedCard} ${s.newCard} ${value === 'card' ? s.sel : ''}`}>
            <span className={s.payLeft}><span className={s.plus} aria-hidden><span /><span /></span>
              <span className={s.payText}><span className={s.payTitle}>{CHECKOUT.newCard.title}</span><span className={s.paySub12}>{mobile ? CHECKOUT.newCard.subMobile : CHECKOUT.newCard.sub}</span></span></span>
            <Radio on={value === 'card'} />
          </button>
        </div>
      )}
    </div>
  );
}
