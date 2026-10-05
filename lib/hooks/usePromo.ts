'use client';
// Промокод корзины и оформления: POST /promo/check, применённый код — в сторе корзины (общий для 02 и 03).
import { useState } from 'react';
import { checkPromo } from '@/lib/api';
import { money } from '@/lib/domain';
import { useCart } from '@/lib/store/cart';
import type { MartPromoProps, PromoStatus } from '@/components/MartPromo';

export function usePromo(goods: number, discount: number): { promoKey: string; props: MartPromoProps } {
  const promo = useCart(s => s.promo);
  const setPromo = useCart(s => s.setPromo);
  const [status, setStatus] = useState<Exclude<PromoStatus, 'applied'>>('idle');
  const [value, setValue] = useState('');
  const [minSum, setMinSum] = useState(0);
  const shown: PromoStatus = promo ? 'applied' : status;
  // promoKey пересоздаёт поле при смене состояния, чтобы введённый код остался в value
  return { promoKey: shown, props: {
    status: shown, value, code: promo?.code, minSum,
    discountText: discount ? '−' + money(discount) : promo ? `−${promo.pct}%` : '',
    onApply: async code => {
      setValue(code); setStatus('loading');
      const r = await checkPromo(code, goods);
      if ('ok' in r && r.ok) { setPromo({ code: code.trim().toUpperCase(), pct: r.pct }); setStatus('idle'); setValue(''); }
      else if ('error' in r) { setMinSum(r.minSum ?? 0); setStatus(r.error); }
    },
    onRemove: () => { setPromo(null); setStatus('idle'); },
  } };
}
