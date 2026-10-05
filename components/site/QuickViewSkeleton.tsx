'use client';
// Скелетон быстрого просмотра: появляется сразу по клику, пока грузятся код модалки и товар (GET /products/{id}).
// Геометрия — как у MartProductView: desktop окно 1040 r24, mobile — лист 94% снизу.
import { useRef } from 'react';
import { Skeleton } from '@/components/ui/Spinner';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useModal } from '@/lib/hooks/useModal';
import s from './QuickViewSkeleton.module.css';

export function QuickViewSkeleton({ onClose }: { onClose?: () => void }) {
  const mobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  // Esc и блокировка прокрутки; фокус не трогаем — его заберёт модалка товара, когда загрузится.
  useModal({ active: !!onClose, ref, onClose, trap: false, initialFocus: false, restoreFocus: false });
  return (
    <div className={`${s.overlay} ${mobile ? s.mobile : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose?.(); }} aria-busy="true" aria-label="Загружаем товар">
      <div ref={ref} className={s.dialog}>
        <Skeleton w="100%" h={mobile ? 300 : 460} r={mobile ? 0 : 20} style={{ aspectRatio: mobile ? undefined : '1 / 1', height: mobile ? 300 : 'auto' }} />
        <div className={s.info}>
          <Skeleton w="45%" h={14} r={6} />
          <Skeleton w="80%" h={26} r={8} />
          <Skeleton w="35%" h={32} r={8} />
          <Skeleton w="50%" h={26} r={13} />
          <div className={s.row}><Skeleton w={96} h={56} r={14} /><Skeleton w={96} h={56} r={14} /></div>
          <Skeleton w="100%" h={56} r={28} />
          <Skeleton w="100%" h={150} r={16} />
        </div>
      </div>
    </div>
  );
}
