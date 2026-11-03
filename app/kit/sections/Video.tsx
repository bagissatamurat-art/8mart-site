'use client';
// Видео товара: миниатюра поверх галереи (превью по кругу и только обложка), плеер (desktop и mobile — статичные кадры,
// кнопка открывает настоящий) и блок товара MartProductStrip во всех состояниях. Ролик — локальный демо
// (scripts/make-kit-video.mjs), корзина витрины — своя, общую не трогает.
import { useState } from 'react';
import type { ProductVideo } from '@/lib/types';
import { KIT_PRODUCTS } from '@/lib/mock';
import { asset } from '@/lib/basePath';
import { cartKey } from '@/lib/domain';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { VideoThumb } from '@/components/product/VideoThumb';
import { MartVideoPlayer } from '@/components/MartVideoPlayer';
import { MartProductStrip } from '@/components/MartProductStrip';
import { MartButton } from '@/components/MartButton';
import { Img } from '@/components/ui/Img';
import pv from '@/components/MartProductView.module.css';
import { KitItem, KitPanel, KitSection } from '../Kit';
import s from './sections.module.css';

/** Демо-ролик в форме API (ProductVideo). */
export const DEMO_VIDEO: ProductVideo = {
  src: asset('/kit/video-demo.mp4'), preview: asset('/kit/video-demo-preview.mp4'), poster: asset('/kit/video-demo-poster.jpg'), width: 360, height: 640, duration: 8,
};
const flowers = { ...KIT_PRODUCTS.find(p => p.id === 'f7')!, video: DEMO_VIDEO };
const paint = KIT_PRODUCTS.find(p => p.id === 'b4')!;

/** Фото товара 1:1, как в галерее карточки, с миниатюрой видео справа сверху. */
function GalleryDemo({ still, onOpen }: { still?: boolean; onOpen: () => void }) {
  const [hidden, setHidden] = useState(false);
  return (
    <div className={s.videoGallery}>
      <Img src={flowers.img!} alt={flowers.name} fill sizes="320px" className={pv.photoImg} />
      {!hidden && <VideoThumb video={DEMO_VIDEO} still={still} onOpen={onOpen} onHide={() => setHidden(true)} className={pv.videoThumbM} />}
      {hidden && <button type="button" className={s.videoReset} onClick={() => setHidden(false)}>Вернуть миниатюру</button>}
    </div>
  );
}

export default function VideoSection() {
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({ [cartKey('f7-m')]: 2 });
  const qtyFor = (k: string) => cart[k] || 0;
  const onQty = (k: string, q: number) => setCart(c => { const n = { ...c }; if (q <= 0) delete n[k]; else n[k] = q; return n; });
  const common = { qtyFor, onQty };

  return (
    <KitSection id="video" title="Видео товара · VideoThumb, MartVideoPlayer, MartProductStrip"
      note="Миниатюра ~1/4 ширины галереи, 9:16, r14: беззвучное превью по кругу; при «уменьшить движение», медленной сети или экономии трафика — только обложка. Крестик скрывает до конца сессии, нажатие — плеер. Плеер: тёмный фон, ролик целиком, звук по нажатию, тап — пауза, полоса прогресса; справа «В избранное», «Отзывы» (FEATURES.reviews, сейчас выключено), «Поделиться»; снизу — блок товара. Закрыть: «Назад», крестик (desktop), Esc, свайп вниз, «назад» в браузере.">
      <KitPanel layout="row" style={{ alignItems: 'flex-start', gap: 24 }}>
        <KitItem label="Миниатюра · превью по кругу (нажмите — плеер)"><GalleryDemo onOpen={() => setOpen(true)} /></KitItem>
        <KitItem label="Миниатюра · только обложка"><GalleryDemo still onOpen={() => setOpen(true)} /></KitItem>
        <KitItem label="Открыть плеер"><MartButton label="Смотреть видео" variant="ghost" size={44} onClick={() => setOpen(true)} /></KitItem>
      </KitPanel>

      <KitPanel layout="row" style={{ alignItems: 'flex-start', gap: 24 }}>
        <KitItem label="Плеер desktop · рамка 400 на затемнении, пауза">
          <div className={s.videoDesktop}>
            <MartVideoPlayer product={flowers} video={DEMO_VIDEO} variantId="f7-m" mode="desktop" preview={{ progress: 0.4, paused: true }} {...common} />
          </div>
        </KitItem>
        <KitItem label="Плеер mobile · 390×844, размер не выбран">
          <div className={s.videoPhone}>
            <MartVideoPlayer product={flowers} video={DEMO_VIDEO} mode="mobile" preview={{ progress: 0.65 }} {...common} />
          </div>
        </KitItem>
      </KitPanel>

      <KitPanel layout="grid" min={320}>
        <KitItem label="Варианты, размер не выбран — «от …», CTA заблокирован">
          <div className={s.stripBox}><MartProductStrip product={flowers} {...common} /></div>
        </KitItem>
        <KitItem label="Размер выбран (L)">
          <div className={s.stripBox}><MartProductStrip product={flowers} variantId="f7" {...common} /></div>
        </KitItem>
        <KitItem label="В корзине (M × 2) — степпер и «В корзине»">
          <div className={s.stripBox}><MartProductStrip product={flowers} variantId="f7-m" {...common} /></div>
        </KitItem>
        <KitItem label="Без вариантов, старая цена">
          <div className={s.stripBox}><MartProductStrip product={paint} {...common} /></div>
        </KitItem>
        <KitItem label="В сторис: «В избранное» и «Поделиться» в строке, название — ссылка">
          <div className={s.stripBox}><MartProductStrip product={flowers} actions link {...common} /></div>
        </KitItem>
      </KitPanel>

      {open && <MartVideoPlayer product={flowers} video={DEMO_VIDEO} mode={mobile ? 'mobile' : 'desktop'} onClose={() => setOpen(false)} {...common} />}
    </KitSection>
  );
}
