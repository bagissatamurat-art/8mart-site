'use client';
// Сторис и баннер главной — как в site/UI Kit.dc.html («Сторис · MartStories») + статичные превью просмотра.
import { KitItem, KitPanel, KitSection } from '../Kit';
import { MartStories, MartStoryViewer } from '@/components/MartStories';
import { MartBanner } from '@/components/MartBanner';
import { BANNERS, STORIES } from '@/lib/mock';

// Превью: desktop — история «Скидки» на паузе; mobile — «Промокод» в состоянии «Код скопирован».
const PROMO_INDEX = Math.max(0, STORIES.findIndex(x => x.slides.some(sl => sl.cta?.copy)));

export default function StoriesSection() {
  const banner = BANNERS[0];
  return (
    <>
      <KitSection
        id="stories"
        title="Сторис · MartStories"
        note="Миниатюры 104×140 / 88×116, r18; кольцо #EE1D74 — не просмотрено, #E3E2E7 — просмотрено. Нажмите, чтобы открыть просмотр."
      >
        <KitPanel style={{ overflow: 'hidden' }}>
          <MartStories stories={STORIES} mode="desktop" />
          <MartStories stories={STORIES} mode="mobile" />
        </KitPanel>
        <KitPanel layout="row" style={{ alignItems: 'flex-start', gap: 24 }}>
          <KitItem label="Просмотр desktop · 400×711 на --overlay-strong, пауза">
            <div style={{ position: 'relative', width: 552, maxWidth: '100%', height: 759, borderRadius: 'var(--r-20)', overflow: 'hidden' }}>
              <MartStoryViewer stories={STORIES} mode="desktop" start={0} preview={{ progress: 0.45, paused: true }} />
            </div>
          </KitItem>
          <KitItem label="Просмотр mobile · 390×844, «Код скопирован»">
            <div style={{ position: 'relative', width: 390, maxWidth: '100%', height: 844, borderRadius: 'var(--r-24)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <MartStoryViewer stories={STORIES} mode="mobile" start={PROMO_INDEX} preview={{ progress: 0.3, paused: true, copied: true }} />
            </div>
          </KitItem>
        </KitPanel>
      </KitSection>

      {banner && (
        <KitSection
          id="banner"
          title="Баннер главной · MartBanner"
          note="Desktop: 2/3 ширины × 260, r24 + тёмная плашка «Бесплатная доставка от …»; mobile 358×140, r20, без кнопки. Вся плашка баннера — ссылка."
        >
          <KitPanel>
            <KitItem label="Desktop · ряд 1152">
              <div style={{ width: 1152, maxWidth: '100%' }}>
                <MartBanner banner={banner} mode="desktop" />
              </div>
            </KitItem>
            <KitItem label="Mobile · 358×140">
              <div style={{ width: 358, maxWidth: '100%' }}>
                <MartBanner banner={banner} mode="mobile" textShort="Привезём сегодня" />
              </div>
            </KitItem>
          </KitPanel>
        </KitSection>
      )}
    </>
  );
}
