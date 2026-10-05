'use client';
// Вход — MartAuth.dc.html (WhatsApp-код / Telegram-бот). Отдельного артборда входа в 06 нет:
// гость в кабинете и страница /login?next=… показывают MartAuth в белой карточке, как в оформлении (03),
// desktop — карточка 440 по центру (размеры модалки смены номера из 06), mobile — шапка «Вход» + карточка.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MartAuth, type MartAuthResult } from '@/components/MartAuth';
import { MobileTopBar } from '@/components/checkout/MobileTopBar';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteTabBar } from '@/components/site/SiteTabBar';
import { ACCOUNT_PAGE } from '@/lib/copy';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useAuth } from '@/lib/store/auth';
import { useUi } from '@/lib/store/ui';
import type { Category } from '@/lib/types';
import s from '@/components/site/site.module.css';
import c from './LoginScreen.module.css';

/** Только внутренний путь: «/…», но не «//host» — защита от открытого редиректа. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  return next;
}

export interface LoginScreenProps {
  categories: Category[];
  /** Куда вернуть после входа (/login?next=…). Без него — остаёмся на месте (кабинет сам покажет разделы). */
  next?: string | null;
}

export function LoginScreen({ categories, next }: LoginScreenProps) {
  const mobile = useIsMobile();
  const router = useRouter();
  const hydrated = useUi(st => st.hydrated);
  const user = useAuth(st => st.user);
  const login = useAuth(st => st.login);
  const target = safeNext(next);

  // Уже вошли (или только что вошли) — уходим на next
  useEffect(() => { if (hydrated && user && target) router.replace(target); }, [hydrated, user, target, router]);

  const onDone = (r: MartAuthResult) => login({ phone: r.phone, name: r.name ?? '' }, r.accessToken);
  const auth = <MartAuth mode={mobile ? 'mobile' : 'desktop'} onDone={onDone} />;

  if (mobile) {
    return (
      <div className={c.mPage}>
        <MobileTopBar title={ACCOUNT_PAGE.loginTitle} backHref="/" />
        <div className={c.mWrap}><div className={c.cardM}>{auth}</div></div>
        <SiteTabBar active="profile" />
      </div>
    );
  }

  return (
    <div className={s.page}>
      <SiteHeader categories={categories} mobile={false} />
      <main className={c.wrap}><div className={c.card}>{auth}</div></main>
    </div>
  );
}
