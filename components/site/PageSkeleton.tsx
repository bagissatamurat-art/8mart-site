// Скелетон страницы на время перехода (app/**/loading.tsx): шапка, сайдбар, сетка карточек, мини-корзина. Пульс 1.4 с.
import { Skeleton } from '@/components/ui/Spinner';
import s from './PageSkeleton.module.css';

function CardSkeleton() {
  return (
    <div className={s.card}>
      <Skeleton w="100%" h="auto" r={14} style={{ aspectRatio: '1 / 1' }} />
      <Skeleton w="50%" h={16} r={6} />
      <Skeleton w="85%" h={14} r={6} />
      <Skeleton w="100%" h={36} r={18} style={{ marginTop: 'auto' }} />
    </div>
  );
}

export function PageSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'product' }) {
  return (
    <div className={s.page} aria-busy="true" aria-label="Загружаем страницу">
      <div className={s.header}><Skeleton w={118} h={30} r={8} /><Skeleton w={200} h={56} r={28} /><span className={s.search}><Skeleton w="100%" h={56} r={28} /></span><Skeleton w={120} h={56} r={28} /></div>
      <div className={s.mHeader}><div className={s.mRow}><Skeleton w={100} h={26} r={8} /><Skeleton w={170} h={40} r={20} /></div><Skeleton w="100%" h={48} r={24} /></div>
      {variant === 'grid' ? (
        <div className={s.grid}>
          <div className={s.side}><Skeleton w="100%" h={260} r={24} /></div>
          <main className={s.main}>
            <Skeleton w={160} h={14} r={6} />
            <Skeleton w={280} h={36} r={10} />
            <div className={s.cards}>{Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)}</div>
          </main>
          <div className={s.side}><Skeleton w="100%" h={320} r={24} /></div>
        </div>
      ) : (
        <div className={s.product}>
          <div className={s.productCard}>
            <Skeleton w="100%" h="auto" r={20} style={{ aspectRatio: '1 / 1' }} />
            <div className={s.info}><Skeleton w="45%" h={14} r={6} /><Skeleton w="80%" h={28} r={8} /><Skeleton w="35%" h={34} r={8} /><Skeleton w="100%" h={56} r={28} /><Skeleton w="100%" h={180} r={16} /></div>
          </div>
          <div className={s.side}><Skeleton w="100%" h={320} r={24} /></div>
        </div>
      )}
    </div>
  );
}
