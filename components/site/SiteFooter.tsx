// Футер (главная, каталог, товар): о магазине и соцсети · покупателям · каталог цветов · контакты и города.
// Контакты и соцсети — как в футере 8mart.kz (BRAND, SUPPORT_WA в lib/config); города — филиалы (lib/branches).
// Ссылок на приложения и юридические страницы пока нет: на 8mart.kz они ведут в «#».
import Link from 'next/link';
import { BRAND, SUPPORT_WA } from '@/lib/config';
import { FOOTER } from '@/lib/copy';
import { SNAPSHOT_CITIES } from '@/lib/branches';
import { asset } from '@/lib/basePath';
import type { Category } from '@/lib/types';
import s from './footer.module.css';

const MAIN_CATEGORY = 'tsvety';

const Icon = ({ name }: { name: 'wa' | 'ig' | 'tt' }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {name === 'wa' && <><path d="M4 20l1.2-4.1A8 8 0 1 1 8.4 19z" /><path d="M9.2 8.6c.2-.5.6-.5.9-.5h.5c.2 0 .4.1.5.4l.6 1.5c.1.2 0 .5-.1.6l-.5.6c-.1.1-.1.3 0 .5.5.9 1.3 1.7 2.3 2.2.2.1.4.1.5-.1l.6-.6c.2-.2.4-.2.6-.1l1.5.7c.2.1.3.3.3.5v.4c0 .4-.2.8-.6 1-.6.3-1.4.4-2.6-.1a9.8 9.8 0 0 1-4.5-4.4c-.5-1-.4-1.9-.1-2.6z" /></>}
    {name === 'ig' && <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" fill="currentColor" /></>}
    {name === 'tt' && <path d="M14 3.5v11a3.5 3.5 0 1 1-3.5-3.5M14 3.5c.4 2.6 2.1 4.2 4.8 4.4" />}
  </svg>
);

export function SiteFooter({ categories = [] }: { categories?: Category[] }) {
  const main = categories.find(c => c.slug === MAIN_CATEGORY);
  const social: [string, 'wa' | 'ig' | 'tt', string][] = [
    [`https://wa.me/${SUPPORT_WA}`, 'wa', 'WhatsApp'],
    [`https://www.instagram.com/${BRAND.instagram}/`, 'ig', 'Instagram'],
    [`https://www.tiktok.com/@${BRAND.tiktok}`, 'tt', 'TikTok'],
  ];
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.about}>
          <Link href="/" aria-label="8mart — на главную"><img src={asset('/assets/logo.svg')} alt="8mart" width={101} height={24} /></Link>
          <p className={s.tagline}>{FOOTER.tagline}</p>
          <div className={s.social}>
            {social.map(([href, icon, label]) => (
              <a key={icon} href={href} target="_blank" rel="noopener noreferrer" className={s.socialBtn} aria-label={label}><Icon name={icon} /></a>
            ))}
          </div>
        </div>

        <nav className={s.col} aria-label={FOOTER.buyers}>
          <b className={s.colTitle}>{FOOTER.buyers}</b>
          <Link href={`/catalog?cat=${MAIN_CATEGORY}`}>{FOOTER.links.flowers}</Link>
          <Link href="/account/bonus">{FOOTER.links.bonus}</Link>
          <Link href="/account/promos">{FOOTER.links.promos}</Link>
          <Link href="/account">{FOOTER.links.account}</Link>
          <a href="#faq">{FOOTER.links.faq}</a>
        </nav>

        <nav className={s.col} aria-label={FOOTER.catalog}>
          <b className={s.colTitle}>{FOOTER.catalog}</b>
          {main?.sub.map(sub => <Link key={sub.slug} href={`/catalog?cat=${MAIN_CATEGORY}&sub=${sub.slug}`}>{sub.name}</Link>)}
          <Link href="/catalog">{FOOTER.links.all}</Link>
        </nav>

        <div className={s.col}>
          <b className={s.colTitle}>{FOOTER.contacts}</b>
          <a href={`tel:${BRAND.phoneRaw}`} className={s.phone}>{BRAND.phone}</a>
          <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
          <a href={`https://wa.me/${SUPPORT_WA}`} target="_blank" rel="noopener noreferrer">{FOOTER.whatsapp}</a>
          <span className={s.cities}><span className={s.citiesTitle}>{FOOTER.cities}</span>{SNAPSHOT_CITIES.map(c => c.name).join(' · ')}</span>
        </div>
      </div>
      <div className={s.bottom}>{FOOTER.copyright(new Date().getFullYear())}</div>
    </footer>
  );
}
