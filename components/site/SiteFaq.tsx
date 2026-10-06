'use client';
// «Вопросы и ответы» над футером (главная, каталог, товар). Аккордеон: можно открыть несколько; высота — плавно (grid 0fr → 1fr).
// Тексты и цифры — lib/faq.ts; те же вопросы уходят в разметку FAQPage (lib/seo.ts → faqLd).
import { useId, useState } from 'react';
import { FAQ } from '@/lib/faq';
import { FAQ_TITLE } from '@/lib/copy';
import s from './footer.module.css';

export function SiteFaq({ className }: { className?: string }) {
  const id = useId();
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const toggle = (i: number) => setOpen(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  return (
    <section id="faq" className={`${s.faq} ${className ?? ''}`} aria-labelledby={`${id}-t`}>
      <h2 id={`${id}-t`} className={s.faqTitle}>{FAQ_TITLE}</h2>
      <div className={s.faqList}>
        {FAQ.map(([q, a], i) => {
          const on = open.has(i);
          return (
            <div key={q} className={`${s.qa} ${on ? s.qaOpen : ''}`}>
              <h3 className={s.qHead}>
                <button type="button" className={s.q} aria-expanded={on} aria-controls={`${id}-a${i}`} onClick={() => toggle(i)}>
                  <span>{q}</span><span className={s.qIcon} aria-hidden />
                </button>
              </h3>
              <div id={`${id}-a${i}`} role="region" aria-label={q} className={s.aWrap} inert={!on || undefined}>
                <div className={s.aInner}><p className={s.a}>{a}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
