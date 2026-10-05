'use client';
// Чекбокс 20, r6 (оферта в оформлении). Галочка — геометрией.
import s from './checkout.module.css';
import { CheckMark } from '../ui/Marks';

export function MartCheckbox({ checked, onChange, children, small }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; small?: boolean }) {
  return (
    <label className={`${s.check} ${small ? s.checkSmall : ''}`}>
      <input type="checkbox" className="visually-hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
      <CheckMark on={checked} className={s.box} />
      <span>{children}</span>
    </label>
  );
}
