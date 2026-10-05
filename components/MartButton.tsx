'use client';
// MartButton — COMPONENTS.md → MartButton; референс site/MartButton.dc.html.
import Link from 'next/link';
import { Spinner } from './ui/Spinner';
import s from './MartButton.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'kaspi';
export type ButtonSize = 36 | 40 | 44 | 56;

export interface MartButtonProps {
  label?: string;
  /** Split-CTA: «label · разделитель · amount». У Kaspi суммы нет. */
  amount?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Причина блокировки — в title и aria-describedby; текстом выводит экран рядом с CTA. */
  reason?: string;
  /** Принудительное кольцо фокуса (витрина /kit). */
  focused?: boolean;
  href?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

export function MartButton({
  label, amount, variant = 'primary', size = 56, full, disabled, loading, reason, focused, href, type = 'button', onClick, className, ...rest
}: MartButtonProps) {
  const kaspi = variant === 'kaspi';
  const cls = [s.btn, s[variant], s[`s${size}`], full && s.full, disabled && s.disabled, loading && s.loading, focused && s.focused, className].filter(Boolean).join(' ');
  const content = (
    <>
      {loading && <span className={s.spinnerWrap}><Spinner /></span>}
      {kaspi && <img src="/assets/kaspi-pay.svg" alt="Kaspi Pay" className={s.kaspiImg} style={{ height: size }} />}
      {(!kaspi || label) && label != null && <span>{label}</span>}
      {!kaspi && amount && <><span className={s.sep} aria-hidden /><span className={s.amount}>{amount}</span></>}
    </>
  );
  const title = disabled && reason ? reason : undefined;
  if (href && !disabled && !loading) {
    return <Link href={href} className={cls} title={title} aria-label={rest['aria-label']}>{content}</Link>;
  }
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} title={title} aria-label={rest['aria-label'] ?? (kaspi && !label ? 'Оплатить Kaspi Pay' : undefined)} onClick={onClick}>
      {content}
    </button>
  );
}
