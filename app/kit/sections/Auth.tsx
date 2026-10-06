'use client';
// Витрина MartAuth: все шаги и состояния (desktop-карточка как в 03 Оформление, mobile в рамке 390),
// живой пример на моке (код 1234) и вариант смены номера (purpose="changePhone") в модалке/sheet, как в 06 Кабинет.
import { useState } from 'react';
import { KitItem, KitSection } from '../Kit';
import { MartAuth, type AuthStep, type AuthViewState, type MartAuthResult } from '@/components/MartAuth';
import { MartAuthDialog } from '@/components/auth/MartAuthDialog';
import { MartButton } from '@/components/MartButton';
import s from './Auth.module.css';

const STATES: [AuthStep, AuthViewState, string][] = [
  ['phone', 'empty', 'Телефон · пусто'],
  ['phone', 'filled', 'Телефон · заполнен'],
  ['phone', 'error', 'Телефон · ошибка (номер не полностью)'],
  ['phone', 'loading', 'Телефон · отправка кода'],
  ['code', 'empty', 'Код · пусто (фокус)'],
  ['code', 'partial', 'Код · 2 цифры'],
  ['code', 'verifying', 'Код · проверяем'],
  ['code', 'error', 'Код · неверный'],
  ['code', 'expired', 'Код · истёк, можно отправить ещё раз'],
  ['code', 'success', 'Код · подтверждён'],
  ['tg', 'idle', 'Telegram · desktop, QR'],
  ['tg', 'waiting', 'Telegram · ждём бота'],
  ['tg', 'ok', 'Telegram · номер подтверждён'],
];

const MOBILE: [AuthStep, AuthViewState, string][] = [
  ['phone', 'filled', 'mobile · телефон'],
  ['code', 'partial', 'mobile · код'],
  ['tg', 'waiting', 'mobile · Telegram (без QR)'],
];

const CHANGE: [AuthStep, AuthViewState, string][] = [
  ['phone', 'filled', 'changePhone · новый номер'],
  ['code', 'empty', 'changePhone · код (без Telegram)'],
];

function Result({ r }: { r: MartAuthResult | null }) {
  return <span className={s.result}>{r ? `onDone: ${JSON.stringify(r)}` : 'onDone ещё не вызван'}</span>;
}

export default function AuthSection() {
  const [liveKey, setLiveKey] = useState(0);
  const [live, setLive] = useState<MartAuthResult | null>(null);
  const [liveM, setLiveM] = useState<MartAuthResult | null>(null);
  const [dialog, setDialog] = useState<'desktop' | 'mobile' | null>(null);
  const [changed, setChanged] = useState<MartAuthResult | null>(null);

  return (
    <KitSection id="auth" title="Вход · MartAuth"
      note={<>Встраиваемый блок без оболочки: в оформлении — в белой карточке (r24, p28, ≤520; mobile r20, p20), в кабинете — в MartAuthDialog
        (модалка 440 / sheet). Код — в WhatsApp, 4 ячейки поверх одного input (<code>one-time-code</code>), проверка на 4-й цифре. Мок: верный код 1234,
        новый пользователь — любой номер, кроме +7 (700) 133-90-71. Опрос Telegram-бота в моке всегда «pending».</>}>

      <h3 className={s.sub}>Живой пример</h3>
      <div className={s.live}>
        <div className={s.liveCol}>
          <div className={s.card}>
            <MartAuth key={'d' + liveKey} mode="desktop" mockHint onDone={setLive} />
          </div>
          <Result r={live} />
        </div>
        <div className={s.liveCol} style={{ flex: '0 1 390px' }}>
          <div className={s.frame}>
            <div className={s.cardMobile}>
              <MartAuth key={'m' + liveKey} mode="mobile" mockHint onDone={setLiveM} />
            </div>
          </div>
          <Result r={liveM} />
        </div>
      </div>
      <div className={s.row}>
        <MartButton label="Сбросить живые примеры" variant="ghost" size={44} onClick={() => { setLiveKey(k => k + 1); setLive(null); setLiveM(null); }} />
        <MartButton label="Сменить номер · desktop" variant="secondary" size={44} onClick={() => setDialog('desktop')} />
        <MartButton label="Сменить номер · mobile" variant="secondary" size={44} onClick={() => setDialog('mobile')} />
        <Result r={changed} />
      </div>
      <MartAuthDialog open={dialog !== null} mode={dialog ?? 'desktop'} purpose="changePhone" mockHint
        onClose={() => setDialog(null)} onDone={r => { setChanged(r); setDialog(null); }} />

      <h3 className={s.sub}>Состояния · desktop</h3>
      <div className={s.grid}>
        {STATES.map(([step, st, label]) => (
          <KitItem key={step + st} label={label}>
            <div className={s.card}><MartAuth mode="desktop" step={step} state={st} mockHint={step === 'code'} /></div>
          </KitItem>
        ))}
      </div>

      <h3 className={s.sub}>Состояния · mobile 390</h3>
      <div className={s.gridMobile}>
        {MOBILE.map(([step, st, label]) => (
          <KitItem key={step + st} label={label}>
            <div className={s.frame}><div className={s.cardMobile}><MartAuth mode="mobile" step={step} state={st} /></div></div>
          </KitItem>
        ))}
      </div>

      <h3 className={s.sub}>Смена номера · purpose=&quot;changePhone&quot;</h3>
      <div className={s.gridMobile}>
        {CHANGE.map(([step, st, label]) => (
          <KitItem key={step + st} label={label + ' · модалка desktop'} style={{ flex: '1 1 460px', maxWidth: 600 }}>
            <div className={s.dialogFrame}>
              <MartAuthDialog inline open onClose={() => {}} mode="desktop" purpose="changePhone" step={step} state={st} />
            </div>
          </KitItem>
        ))}
        <KitItem label="changePhone · sheet mobile">
          <div className={s.sheetFrame}>
            <MartAuthDialog inline open onClose={() => {}} mode="mobile" purpose="changePhone" step="phone" state="filled" />
          </div>
        </KitItem>
      </div>
    </KitSection>
  );
}
