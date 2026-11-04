'use client';
// Видео товара: плавающая миниатюра (экран телефона — таскать пальцем или мышью, превью по кругу и только обложка;
// «поверх страницы» — настоящая fixed-миниатюра на витрине), плеер (desktop и mobile — статичные кадры, кнопка открывает
// настоящий) и блок товара MartProductStrip во всех состояниях. Ролик — локальный демо (scripts/make-kit-video.mjs),
// корзина витрины — своя, общую не трогает.
import { useRef, useState } from 'react';
import type { ProductVideo } from '@/lib/types';
import { KIT_PRODUCTS } from '@/lib/mock';
import { asset } from '@/lib/basePath';
import { cartKey, money } from '@/lib/domain';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import type { FloatBounds } from '@/lib/videoFloat';
import { VideoFloat } from '@/components/product/VideoFloat';
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

/** Экран телефона 390: панель сверху, фото, «В корзину» снизу. Миниатюра ходит по экрану между ними и «магнитится» к краю. */
function PhoneDemo({ still, onOpen }: { still?: boolean; onOpen: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  const bounds = (): FloatBounds | null => {
    const b = box.current?.getBoundingClientRect(), t = bar.current?.getBoundingClientRect(), f = foot.current?.getBoundingClientRect();
    return b ? { zone: { left: b.left, right: b.right, top: t?.bottom ?? b.top, bottom: f?.top ?? b.bottom } } : null;
  };
  return (
    <div ref={box} className={s.floatPhone}>
      <div ref={bar} className={s.floatBar}>Гортензии</div>
      <div className={s.floatPhoto}><Img src={flowers.img!} alt={flowers.name} fill sizes="390px" className={pv.photoImg} /></div>
      <div className={s.floatInfo}><b>{flowers.name}</b><span>от {money(flowers.price)}</span></div>
      <div ref={foot} className={s.floatFoot}><MartButton label="В корзину" amount={money(flowers.price)} size={56} full /></div>
      {!hidden && <VideoFloat video={DEMO_VIDEO} contained still={still} bounds={bounds} onOpen={onOpen} onHide={() => setHidden(true)} />}
      {hidden && <button type="button" className={s.videoReset} onClick={() => setHidden(false)}>Вернуть миниатюру</button>}
    </div>
  );
}

/** Настоящая плавающая миниатюра поверх страницы витрины (fixed): прокрутите — стоит на месте; место — до конца сессии. */
const pageBounds = (): FloatBounds => ({ zone: { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight } });

export default function VideoSection() {
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [floating, setFloating] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({ [cartKey('f7-m')]: 2 });
  const qtyFor = (k: string) => cart[k] || 0;
  const onQty = (k: string, q: number) => setCart(c => { const n = { ...c }; if (q <= 0) delete n[k]; else n[k] = q; return n; });
  const common = { qtyFor, onQty };

  return (
    <KitSection id="video" title="Видео товара · VideoFloat, MartVideoPlayer, ProductOverlay, MartProductStrip"
      note="Плавающая миниатюра 9:16, r14 (96 на телефоне, 112 на компьютере): поверх страницы (fixed), при прокрутке стоит на месте экрана. Тащится пальцем и мышью по карточке — не на шапку и не на нижнюю «В корзину» (на компьютере — по колонке галереи), отпустили — «магнит» к ближайшему левому или правому краю, по вертикали — где отпустили; стрелки на клавиатуре тоже двигают. Место — до конца сессии (sessionStorage 8mart.videoFloat). Беззвучное превью по кругу; при «уменьшить движение» или экономии трафика (Save-Data) — только обложка и без анимации. Крестик скрывает до конца сессии, нажатие без перемещения — плеер. Плеер (референс владельца — видео товара Pinduoduo): ролик на весь кадр без чёрных полос (cover; desktop — рамка 9:16 на затемнении), звук по нажатию, тап и Пробел — пауза; поверх снизу — ProductOverlay: компактная белая карточка товара с отступами 12 (фото 104, название в 2 строки, цена, чипы размера, «В корзину»), над ней тонкая полоса прогресса, слева — пузыри настоящих отзывов и плашка «N отзывов», справа — белые иконки без подложек «В избранное», «Отзывы» с числом (только у товара с опубликованными отзывами — лист поверх видео, см. «Отзывы»), «Поделиться». Закрыть: «Назад», крестик (desktop), Esc (всегда закрывает, не пауза), свайп вниз, «назад» в браузере.">
      <KitPanel layout="row" style={{ alignItems: 'flex-start', gap: 24 }}>
        <KitItem label="Экран телефона · перетащите миниатюру (нажмите — плеер)"><PhoneDemo onOpen={() => setOpen(true)} /></KitItem>
        <KitItem label="Только обложка (уменьшить движение, Save-Data)"><PhoneDemo still onOpen={() => setOpen(true)} /></KitItem>
        <KitItem label="Открыть плеер"><MartButton label="Смотреть видео" variant="ghost" size={44} onClick={() => setOpen(true)} /></KitItem>
        <KitItem label="Поверх страницы (fixed): прокрутите витрину">
          <MartButton label={floating ? 'Убрать с витрины' : 'Показать поверх страницы'} variant="ghost" size={44} onClick={() => setFloating(f => !f)} />
        </KitItem>
      </KitPanel>

      <KitPanel layout="row" style={{ alignItems: 'flex-start', gap: 24 }}>
        <KitItem label="Плеер desktop · рамка 9:16 на затемнении, пауза, размер M выбран">
          <div className={s.videoDesktop}>
            <MartVideoPlayer product={flowers} video={DEMO_VIDEO} variantId="f7-m" mode="desktop" preview={{ progress: 0.4, paused: true }} {...common} />
          </div>
        </KitItem>
        <KitItem label="Плеер mobile · 390×844, ролик на весь экран, размер не выбран">
          <div className={s.videoPhone}>
            <MartVideoPlayer product={flowers} video={DEMO_VIDEO} mode="mobile" preview={{ progress: 0.65 }} {...common} />
          </div>
        </KitItem>
      </KitPanel>

      <KitPanel layout="grid" min={320}>
        <KitItem label="Карточка товара · размер не выбран — «от …», CTA заблокирован">
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
        <KitItem label="В сторис: фото и название — ссылка на страницу товара">
          <div className={s.stripBox}><MartProductStrip product={flowers} link {...common} /></div>
        </KitItem>
      </KitPanel>

      {open && <MartVideoPlayer product={flowers} video={DEMO_VIDEO} mode={mobile ? 'mobile' : 'desktop'} onClose={() => setOpen(false)} {...common} />}
      {floating && (
        <VideoFloat video={DEMO_VIDEO} bounds={pageBounds} paused={open} width={mobile ? undefined : 112}
          onOpen={() => setOpen(true)} onHide={() => setFloating(false)} />
      )}
    </KitSection>
  );
}
