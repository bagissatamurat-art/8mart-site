// Обвязка витрины /kit — повторяет разметку site/UI Kit.dc.html (секции 22/700, белые панели r20 p24).
import s from './kit.module.css';

export function KitSection({ title, id, note, children }: { title: string; id?: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={s.section} id={id}>
      <h2 className={s.h2}>{title}</h2>
      {children}
      {note && <p className={s.note}>{note}</p>}
    </section>
  );
}

export function KitPanel({ children, layout = 'col', min, className, style }: {
  children: React.ReactNode; layout?: 'col' | 'row' | 'grid'; min?: number; className?: string; style?: React.CSSProperties;
}) {
  const cls = [s.panel, layout === 'row' ? s.row : layout === 'grid' ? s.grid : s.col, className].filter(Boolean).join(' ');
  return <div className={cls} style={{ ...(min ? { gridTemplateColumns: `repeat(auto-fit,minmax(min(${min}px,100%),1fr))` } : {}), ...style }}>{children}</div>;
}

/** Подпись состояния под образцом. */
export function KitLabel({ children }: { children: React.ReactNode }) {
  return <span className={s.label}>{children}</span>;
}

export function KitItem({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className={s.item} style={style}>{children}<KitLabel>{label}</KitLabel></div>;
}
