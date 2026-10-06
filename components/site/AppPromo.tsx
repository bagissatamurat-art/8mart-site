// Приложение 8mart: значки App Store / Google Play. Ссылки — APP_LINKS в lib/config; пока пусто — «Скоро», без ссылки.
// variant footer — компактно (заголовок + значки); menu — карточка с текстом (боковое меню).
import { APP_LINKS } from '@/lib/config';
import { APP_PROMO } from '@/lib/copy';
import s from './app.module.css';

const Apple = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
    <path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.7zM14.2 5.6c.6-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3z" />
  </svg>
);
const Play = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M4.6 2.6 13.4 12l-8.8 9.4c-.3-.2-.5-.6-.5-1.1V3.7c0-.5.2-.9.5-1.1z" fill="#34C3FF" />
    <path d="m16.4 8.9-3 3.1-8.8-9.4c.3-.2.8-.2 1.2 0z" fill="#00E676" />
    <path d="m16.4 15.1-10.6 6.3c-.4.2-.9.2-1.2 0L13.4 12z" fill="#FF3D57" />
    <path d="M19.6 10.8c.9.5.9 1.9 0 2.4l-3.2 1.9-3-3.1 3-3.1z" fill="#FFC400" />
  </svg>
);

function Badge({ href, icon, lines }: { href: string; icon: React.ReactNode; lines: readonly [string, string] }) {
  const body = <>{icon}<span className={s.badgeText}><span className={s.badgeSmall}>{lines[0]}</span><span className={s.badgeBig}>{lines[1]}</span></span></>;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={s.badge}>{body}</a>;
  return (
    <span className={`${s.badge} ${s.badgeSoon}`} aria-label={`${lines[1]} — ${APP_PROMO.soon.toLowerCase()}`}>
      {body}<span className={s.soon} aria-hidden>{APP_PROMO.soon}</span>
    </span>
  );
}

export function AppPromo({ variant = 'footer' }: { variant?: 'footer' | 'menu' }) {
  const badges = (
    <div className={s.badges}>
      <Badge href={APP_LINKS.appStore} icon={<Apple />} lines={APP_PROMO.appStore} />
      <Badge href={APP_LINKS.googlePlay} icon={<Play />} lines={APP_PROMO.googlePlay} />
    </div>
  );
  if (variant === 'menu') {
    return (
      <div className={s.card}>
        <b className={s.title}>{APP_PROMO.title}</b>
        <span className={s.text}>{APP_PROMO.text}</span>
        {badges}
      </div>
    );
  }
  return (
    <div className={s.footer}>
      <b className={s.footerTitle}>{APP_PROMO.title}</b>
      {badges}
    </div>
  );
}
