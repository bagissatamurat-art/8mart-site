'use client';
// Чекбокс 20, r6 (оферта в оформлении). Галочка — геометрией.
import s from './checkout.module.css';

export function MartCheckbox({ checked, onChange, children, small }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; small?: boolean }) {
  return (
    <label className={`${s.check} ${small ? s.checkSmall : ''}`}>
      <input type="checkbox" className="visually-hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className={`${s.box} ${checked ? s.boxOn : ''}`} aria-hidden><span className={s.tick} /></span>
      <span>{children}</span>
    </label>
  );
}
