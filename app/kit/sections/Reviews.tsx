'use client';
// Отзывы о товарах (04.11): звёзды, ввод оценки, отзыв, блок в карточке товара, лист поверх видео, «Оцените букет», форма.
// ДЕМО-ДАННЫЕ ВИТРИНЫ: отзывы ниже придуманы, чтобы показать компоненты, и помечены «Пример». На сайте их нет:
// сайт показывает только настоящие опубликованные отзывы из API, мок отдаёт пустой список.
import { useState } from 'react';
import type { MyReview, OrderReviewItem, Review, ReviewDraft } from '@/lib/types';
import { KIT_PRODUCTS } from '@/lib/mock';
import { asset } from '@/lib/basePath';
import { REVIEWS } from '@/lib/copy';
import { cartKey } from '@/lib/domain';
import { MartReviews, RatingLink } from '@/components/MartReviews';
import { MartVideoPlayer } from '@/components/MartVideoPlayer';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewPrompts } from '@/components/reviews/ReviewPrompts';
import { Stars } from '@/components/reviews/Stars';
import { StarsInput } from '@/components/reviews/StarsInput';
import r from '@/components/MartReviews.module.css';
import { KitItem, KitPanel, KitSection } from '../Kit';
import { DEMO_VIDEO } from './Video';
import s from './sections.module.css';

const flowers = KIT_PRODUCTS.find(p => p.id === 'f7')!;
const paint = KIT_PRODUCTS.find(p => p.id === 'b4')!;
const photo = (f: string) => { const src = asset(`/assets/flowers/${f}.webp`); return { src, thumb: src, width: 800, height: 800 }; };

/** Пример: демонстрационные отзывы (в форме API — Review). */
export const DEMO_REVIEWS: Review[] = [
  {
    id: 'demo-1', author: 'Айгерим К.', rating: 5, date: '3 ноября', createdAt: '2026-11-03T09:20:00Z', variant: 'M',
    text: 'Пример отзыва для витрины. Букет привезли за 40 минут, цветы свежие, коробка с водой — стоит уже неделю.',
    photos: [photo('12044f48-1893-444d-b327-6fb5294ca2d8'), photo('1c97985e-0fcf-44cb-94a9-0d679043aaca'), photo('2b70d6aa-a229-427c-8843-4c13d4ab011d')],
    reply: { text: 'Пример ответа магазина: спасибо, что выбрали 8mart! Ждём вас снова.', date: '3 ноября' },
  },
  {
    id: 'demo-2', author: 'Ержан', rating: 4, date: '28 октября', createdAt: '2026-10-28T14:05:00Z', variant: 'S, L',
    text: 'Пример длинного отзыва: так выглядит текст, который сворачивается до шести строк.\nПервый абзац — о доставке: курьер позвонил заранее и приехал вовремя.\nВторой — о букете: состав совпал с карточкой, упаковка аккуратная.\nТретий — о том, что можно лучше: открытку хотелось бы побольше.\nЧетвёртый — пожелание магазину.\nПятый абзац.\nШестой абзац — его уже не видно, пока не нажать «Читать полностью».',
    photos: [],
  },
  { id: 'demo-3', author: 'Покупатель', rating: 5, text: '', photos: [], date: '12 октября', createdAt: '2026-10-12T07:40:00Z' },
];
const DEMO_RATING = { avg: 4.7, count: DEMO_REVIEWS.length };

const item = (product: typeof flowers, review: MyReview | null): OrderReviewItem =>
  ({ product: product.id, name: product.name, img: product.img, delivery: product.delivery, review });
const mine = (o: Partial<MyReview>): MyReview => ({ id: 'my', rating: 5, text: 'Пример: свежие цветы, спасибо!', photos: [], status: 'pending', date: '4 ноября', ...o });
const PROMPTS: OrderReviewItem[] = [
  item(flowers, null),
  item(paint, null),
  { ...item(flowers, mine({ status: 'published', reply: { text: 'Пример ответа магазина: спасибо за отзыв!', date: '4 ноября' } })), product: 'demo-pub' },
  { ...item(flowers, mine({ rating: 2, status: 'rejected', text: 'Пример: пишите в t.me/…', rejectReason: 'Ссылки или реклама' })), product: 'demo-rej' },
];
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
/** Отправка в витрине — без сети: через секунду «на проверке». */
const fakeSend = async (_order: string, d: ReviewDraft): Promise<MyReview> => {
  await wait(900);
  return { id: `demo-${Date.now()}`, rating: d.rating, text: d.text, photos: [], status: 'pending', date: '4 ноября' };
};

export default function ReviewsSection() {
  const [rating, setRating] = useState(4);
  const [log, setLog] = useState('—');
  const [cart, setCart] = useState<Record<string, number>>({ [cartKey('f7-m')]: 1 });
  const rated = { ...flowers, video: DEMO_VIDEO, rating: DEMO_RATING };
  const common = { qtyFor: (k: string) => cart[k] || 0, onQty: (k: string, q: number) => setCart(c => ({ ...c, [k]: q })) };

  return (
    <KitSection id="reviews" title="Отзывы · Stars, StarsInput, ReviewCard, MartReviews, ReviewPrompts, ReviewForm"
      note={<>{REVIEWS.kitNote}. Звёзды — розовым (--star), пустые — --star-off; кнопки звёзд 44. На сайте средняя у названия, блок и кнопка в видео — только у товара с опубликованными отзывами. Действие: <b>{log}</b></>}>
      <KitPanel layout="row" style={{ alignItems: 'center', gap: 24 }}>
        <KitItem label="Stars 18 · 4,7"><Stars value={4.7} size={18} label="Оценка 4,7 из 5" /></KitItem>
        <KitItem label="Stars 16 · 3,5"><Stars value={3.5} size={16} label="Оценка 3,5 из 5" /></KitItem>
        <KitItem label="Stars 14 · 1"><Stars value={1} size={14} label="Оценка 1 из 5" /></KitItem>
        <KitItem label="У названия товара — ссылка к отзывам"><RatingLink rating={DEMO_RATING} onClick={() => setLog('к блоку отзывов')} /></KitItem>
      </KitPanel>

      <KitPanel layout="row" style={{ alignItems: 'flex-start', gap: 32 }}>
        <KitItem label="Ввод оценки · не выбрана"><StarsInput value={0} onChange={n => setLog(`оценка ${n}`)} /></KitItem>
        <KitItem label="Ввод оценки · выбрана (стрелки меняют)"><StarsInput value={rating} onChange={setRating} /></KitItem>
        <KitItem label="«Оцените букет» · нажатие открывает форму"><StarsInput pick value={0} size={28} label="Оцените букет" onChange={n => setLog(`форма с оценкой ${n}`)} /></KitItem>
      </KitPanel>

      <p className={s.kitDemo}>{REVIEWS.kitNote}</p>
      <KitPanel layout="grid" min={340}>
        <KitItem label="Блок в карточке товара · первая страница (на странице товара — из серверного HTML)">
          <div className={s.reviewsBox}><MartReviews productId={flowers.id} rating={DEMO_RATING} initial={DEMO_REVIEWS} /></div>
        </KitItem>
        <KitItem label="Ещё есть — «Показать ещё» (мок пуст: кнопка пропадёт)">
          <div className={s.reviewsBox}><MartReviews productId={flowers.id} rating={{ avg: 4.4, count: 12 }} initial={DEMO_REVIEWS.slice(0, 1)} /></div>
        </KitItem>
        <KitItem label="Отзыв · только оценка (без текста)">
          <div className={s.reviewsBox}><ul className={r.list}><ReviewCard review={DEMO_REVIEWS[2]!} /></ul></div>
        </KitItem>
      </KitPanel>

      <KitPanel layout="grid" min={340}>
        <KitItem label="«Оцените букет» на странице заказа: без отзыва · на проверке / опубликован с ответом / не опубликован">
          <div className={s.reviewsBox}><ReviewPrompts orderId="demo" items={PROMPTS} mobile={false} send={fakeSend} onReviewed={p => setLog(`отзыв отправлен: ${p}`)} /></div>
        </KitItem>
        <KitItem label="В «Моих заказах» (compact): только без отзыва">
          <div className={s.reviewsBox}><ReviewPrompts orderId="demo" items={PROMPTS} mobile compact send={fakeSend} /></div>
        </KitItem>
      </KitPanel>

      <KitPanel layout="row" style={{ alignItems: 'flex-start', gap: 24 }}>
        <KitItem label="Форма · desktop, окно 520 (оценка с нажатой звезды)">
          <div className={s.reviewsDesktop}><ReviewPrompts orderId="demo" items={PROMPTS.slice(0, 1)} mobile={false} demoForm={{ product: flowers.id, rating: 5 }} /></div>
        </KitItem>
        <KitItem label="Форма · mobile, лист снизу">
          <div className={s.videoPhone}><ReviewPrompts orderId="demo" items={PROMPTS.slice(0, 1)} mobile demoForm={{ product: flowers.id, rating: 0 }} /></div>
        </KitItem>
        <KitItem label="В видео · пузыри отзывов над карточкой, плашка «N отзывов», «Отзывы» с числом">
          <div className={s.videoPhone}>
            <MartVideoPlayer product={rated} video={DEMO_VIDEO} mode="mobile" preview={{ progress: 0.45, reviews: DEMO_REVIEWS }} {...common} />
          </div>
        </KitItem>
        <KitItem label="Отзывы поверх видео · лист в рамке плеера">
          <div className={s.videoPhone}>
            <MartVideoPlayer product={rated} video={DEMO_VIDEO} mode="mobile" preview={{ progress: 0.3, paused: true, reviews: DEMO_REVIEWS, sheet: true }} {...common} />
          </div>
        </KitItem>
      </KitPanel>
    </KitSection>
  );
}
