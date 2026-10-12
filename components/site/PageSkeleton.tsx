// Скелетон страницы на время перехода (app/**/loading.tsx) и до гидрации: шапка + раскладка страницы. Пульс 1.4 с.
// grid — каталог и поиск; home — главная (сторис, баннер, полки); product — товар; split — корзина, оформление, заказ
// (колонка карточек + правая панель 420); account — кабинет (меню разделов + содержимое); auth — вход (карточка по центру).
import { CardSkeleton, Skeleton } from '@/components/ui/Spinner';
import s from './PageSkeleton.module.css';

export type PageSkeletonVariant = 'grid' | 'home' | 'product' | 'split' | 'account' | 'auth';

const cards = (n: number) => <div className={s.cards}>{Array.from({ length: n }, (_, i) => <CardSkeleton key={i} />)}</div>;

function Body({ variant }: { variant: PageSkeletonVariant }) {
  switch (variant) {
    case 'home':
      return (
        <div className={s.grid}>
          <div className={s.side}><Skeleton w="100%" h={420} r={24} /></div>
          <main className={s.main}>
            <div className={s.stories}>{Array.from({ length: 7 }, (_, i) => <Skeleton key={i} w={104} h={136} r={18} style={{ flex: 'none' }} />)}</div>
            <Skeleton w="100%" h="auto" r={24} style={{ aspectRatio: '1080 / 260' }} />
            {[0, 1].map(i => <div key={i} className={s.main}><Skeleton w={180} h={28} r={8} />{cards(4)}</div>)}
          </main>
          <div className={s.side}><Skeleton w="100%" h={320} r={24} /></div>
        </div>
      );
    case 'product':
      return (
        <div className={s.product}>
          <div className={s.productCard}>
            <Skeleton w="100%" h="auto" r={20} style={{ aspectRatio: '1 / 1' }} />
            <div className={s.info}><Skeleton w="45%" h={14} r={6} /><Skeleton w="80%" h={28} r={8} /><Skeleton w="35%" h={34} r={8} /><Skeleton w="100%" h={56} r={28} /><Skeleton w="100%" h={180} r={16} /></div>
          </div>
          <div className={s.side}><Skeleton w="100%" h={320} r={24} /></div>
        </div>
      );
    case 'split':
      return (
        <div className={s.split}>
          <main className={s.main}>
            <Skeleton w={160} h={14} r={6} />
            <Skeleton w={260} h={36} r={10} />
            <Skeleton w="100%" h={180} r={24} />
            <Skeleton w="100%" h={260} r={24} />
            <Skeleton w="100%" h={160} r={24} />
          </main>
          <div className={s.aside}><Skeleton w="100%" h={360} r={24} /></div>
        </div>
      );
    case 'account':
      return (
        <div className={s.account}>
          <div className={s.side}><Skeleton w="100%" h={480} r={24} /></div>
          <main className={s.main}>
            <Skeleton w={240} h={36} r={10} />
            <Skeleton w="100%" h={120} r={24} />
            <Skeleton w="100%" h={120} r={24} />
            <Skeleton w="100%" h={120} r={24} />
          </main>
        </div>
      );
    case 'auth':
      return <div className={s.auth}><Skeleton w="100%" h={420} r={24} /></div>;
    default:
      return (
        <div className={s.grid}>
          <div className={s.side}><Skeleton w="100%" h={260} r={24} /></div>
          <main className={s.main}>
            <Skeleton w={160} h={14} r={6} />
            <Skeleton w={280} h={36} r={10} />
            {cards(8)}
          </main>
          <div className={s.side}><Skeleton w="100%" h={320} r={24} /></div>
        </div>
      );
  }
}

export function PageSkeleton({ variant = 'grid' }: { variant?: PageSkeletonVariant }) {
  return (
    <div className={s.page} aria-busy="true" aria-label="Загружаем страницу">
      <div className={s.header}><Skeleton w={118} h={30} r={8} /><Skeleton w={200} h={56} r={28} /><span className={s.search}><Skeleton w="100%" h={56} r={28} /></span><Skeleton w={120} h={56} r={28} /></div>
      <div className={s.mHeader}><div className={s.mRow}><Skeleton w={100} h={26} r={8} /><Skeleton w={170} h={40} r={20} /></div><Skeleton w="100%" h={48} r={24} /></div>
      <Body variant={variant} />
    </div>
  );
}
