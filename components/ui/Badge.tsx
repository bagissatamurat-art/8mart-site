// Бейджи из UI Kit → «Бейджи и алерты».
import s from './ui.module.css';

export type BadgeTone = 'sale' | 'neutral' | 'dark' | 'success' | 'onPhoto';

export function Badge({ tone = 'neutral', children, className }: { tone?: BadgeTone; children: React.ReactNode; className?: string }) {
  return <span className={[s.badge, s[`badge_${tone}`], className].filter(Boolean).join(' ')}>{children}</span>;
}
