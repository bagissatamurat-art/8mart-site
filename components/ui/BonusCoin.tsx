// Бонусы: зелёная монетка «Б» (#1DA765) + текст #13824D. pill — плашка на #EAF7F0 (карточка товара).
import s from './ui.module.css';

export function BonusCoin() {
  return <span className={s.coin} aria-hidden>Б</span>;
}

export function BonusTag({ children, pill = false }: { children: React.ReactNode; pill?: boolean }) {
  return <span className={pill ? s.bonusPill : s.bonusInline}><BonusCoin />{children}</span>;
}
