'use client';
// MartAuth — COMPONENTS.md → MartAuth, DESIGN_RULES «Авторизация»; референс site/MartAuth.dc.html.
// Встраиваемый блок без своей оболочки: в оформлении (03) лежит в белой карточке, в кабинете (06) —
// в модалке / sheet (см. components/auth/MartAuthDialog.tsx).
// Шаги: телефон → код из WhatsApp (4 ячейки, проверка на 4-й цифре) → готово. Имя не спрашиваем: его можно указать в профиле.
// Альтернатива — Telegram-бот: desktop — QR + кнопка, mobile — только кнопка; ждём подтверждения от бэкенда.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { MartButton } from './MartButton';
import { MartInput } from './MartInput';
import { MartCodeInput, type CodeStatus } from './auth/MartCodeInput';
import { ApiError, authCode, authTg, authTgStatus, authVerify, changePhone, verifyPhone } from '@/lib/api';
import { TG_BOT } from '@/lib/config';
import { FORM_ERRORS, STATUS } from '@/lib/copy';
import { formatPhone, phoneComplete } from '@/lib/domain';
import bs from './MartButton.module.css';
import s from './MartAuth.module.css';
import { Spinner } from './ui/Spinner';

export type AuthMode = 'desktop' | 'mobile';
export type AuthPurpose = 'login' | 'changePhone';
export type AuthStep = 'phone' | 'code' | 'tg';
/** Принудительные состояния для витрины (по шагам):
 *  phone — empty | filled | error | loading; code — empty | partial | verifying | error | expired | success;
 *  tg — idle | waiting | ok. */
export type AuthViewState =
  | 'empty' | 'filled' | 'error' | 'loading'
  | 'partial' | 'verifying' | 'success' | 'expired'
  | 'idle' | 'waiting' | 'ok';

export interface MartAuthResult {
  phone: string;
  /** null — имя не меняли (смена номера) или пользователь уже известен без имени в ответе. */
  name: string | null;
  /** Токен из POST /auth/verify (вход по коду). Через Telegram контракт токен пока не отдаёт. */
  accessToken?: string;
}

export interface MartAuthProps {
  mode?: AuthMode;
  purpose?: AuthPurpose;
  /** Стартовый шаг. */
  step?: AuthStep;
  /** Принудительное состояние шага (витрина): таймеры, опрос бота и автофокус отключаются. */
  state?: AuthViewState;
  /** Стартовый номер (например, из оформления). */
  phone?: string;
  /** Подпись «Прототип: верный код — 1234» (только витрина/мок). */
  mockHint?: boolean;
  /** Автофокус поля кода при входе на шаг. По умолчанию — да, если не задан state. */
  autoFocus?: boolean;
  onDone?: (r: MartAuthResult) => void;
  className?: string;
}

/** Таймер повторной отправки, с — из референса (state.timer = 45). Кандидат в lib/config. */
const RESEND_SEC = 45;
/** Пауза на «Код подтверждён» (зелёные ячейки) перед следующим шагом, мс — из референса. */
const OK_DELAY = 700;
/** Пауза на «Номер подтверждён» в Telegram, мс — из референса. */
const TG_OK_DELAY = 900;
/** Интервал опроса GET /auth/tg/{token}, мс. */
const TG_POLL = 2000;
/** Номер-пример для витрины (как в референсе). */
const DEMO_PHONE = '+7 (700) 133-90-71';

type Phase = 'idle' | 'verifying' | 'ok';
type TgState = 'idle' | 'waiting' | 'ok';

/** Стартовые значения из step/state — чтобы витрина показывала любое состояние без кликов. */
function seed(step: AuthStep, st: AuthViewState | undefined, phoneProp: string | undefined) {
  const phone = phoneProp ?? (step === 'phone'
    ? (st === 'filled' || st === 'loading' ? DEMO_PHONE : st === 'error' ? '+7 (700) 133-90' : '')
    : DEMO_PHONE);
  const code = step !== 'code' ? '' : ({ partial: '12', verifying: '1234', success: '1234', error: '1243', expired: '5678' } as Record<string, string>)[st ?? ''] ?? '';
  return {
    phone, code,
    phoneErr: step === 'phone' && st === 'error' ? FORM_ERRORS.phone : '',
    sending: step === 'phone' && st === 'loading',
    phase: (step === 'code' && st === 'verifying' ? 'verifying' : step === 'code' && st === 'success' ? 'ok' : 'idle') as Phase,
    codeErr: step === 'code' && st === 'error' ? FORM_ERRORS.code : step === 'code' && st === 'expired' ? FORM_ERRORS.codeExpired : '',
    timer: step === 'code' && st === 'expired' ? 0 : RESEND_SEC,
    tg: (step === 'tg' && (st === 'waiting' || st === 'ok') ? st : 'idle') as TgState,
  };
}

const errKind = (e: unknown) => (e instanceof ApiError ? e : null);

export function MartAuth({
  mode = 'desktop', purpose = 'login', step: stepProp = 'phone', state, phone: phoneProp, mockHint, autoFocus, onDone, className,
}: MartAuthProps) {
  const frozen = state !== undefined;
  const desktop = mode === 'desktop';
  const isLogin = purpose !== 'changePhone';
  const init = useRef(seed(stepProp, state, phoneProp)).current;
  const uid = useId();

  const [step, setStep] = useState<AuthStep>(stepProp);
  const [phone, setPhone] = useState(init.phone);
  const [phoneErr, setPhoneErr] = useState(init.phoneErr);
  const [sending, setSending] = useState(init.sending);
  const [code, setCode] = useState(init.code);
  const [phase, setPhase] = useState<Phase>(init.phase);
  const [codeErr, setCodeErr] = useState(init.codeErr);
  const [timer, setTimer] = useState(init.timer);
  const [resending, setResending] = useState(false);
  const [tg, setTg] = useState<TgState>(init.tg);
  const [tgToken, setTgToken] = useState<string | null>(frozen ? 'kit_demo' : null);
  const [qr, setQr] = useState<string | null>(null);

  const codeRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0); // отменяет устаревшие ответы API после «Изменить» / повторной отправки
  const timers = useRef(new Set<number>());
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => { timers.current.delete(id); fn(); }, ms);
    timers.current.add(id);
  }, []);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const wantFocus = autoFocus ?? !frozen;
  const focusCode = useCallback(() => {
    // input разблокируется после ререндера — фокусируем в следующем кадре
    requestAnimationFrame(() => { const el = codeRef.current; if (el && !el.disabled) el.focus(); });
  }, []);
  useEffect(() => { if (step === 'code' && wantFocus) focusCode(); }, [step, wantFocus, focusCode]);

  // Таймер «Новый код через 0:45»
  useEffect(() => {
    if (frozen || step !== 'code' || timer <= 0) return;
    const id = window.setTimeout(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearTimeout(id);
  }, [frozen, step, timer]);

  /** Подтвердили номер — готово. Нового пользователя об имени не спрашиваем (пустое имя; укажет в профиле, если захочет). */
  const complete = useCallback((ph: string, knownName: string | null | undefined, accessToken?: string) => {
    if (purpose === 'changePhone') { onDoneRef.current?.({ phone: ph, name: knownName ?? null }); return; }
    onDoneRef.current?.({ phone: ph, name: knownName ?? null, accessToken });
  }, [purpose]);

  // ── Шаг «Телефон»
  const sendCode = async () => {
    if (!phoneComplete(phone) || sending) { if (!phoneComplete(phone)) setPhoneErr(FORM_ERRORS.phone); return; }
    const my = ++seq.current;
    setSending(true); setPhoneErr('');
    try {
      await (isLogin ? authCode(phone) : changePhone(phone));
      if (my !== seq.current) return;
      setCode(''); setCodeErr(''); setPhase('idle'); setTimer(RESEND_SEC); setStep('code');
    } catch (e) {
      if (my === seq.current) setPhoneErr(errKind(e)?.status === 400 ? FORM_ERRORS.phone : FORM_ERRORS.network);
    } finally {
      if (my === seq.current) setSending(false);
    }
  };

  // ── Шаг «Код»
  const verify = async (v: string) => {
    const my = ++seq.current;
    setPhase('verifying');
    try {
      if (isLogin) {
        const r = await authVerify(phone, v);
        if (my !== seq.current) return;
        setPhase('ok');
        later(() => { if (my === seq.current) complete(phone, r.user.name, r.accessToken); }, OK_DELAY);
      } else {
        const u = await verifyPhone(phone, v);
        if (my !== seq.current) return;
        setPhase('ok');
        later(() => { if (my === seq.current) complete(u.phone, u.name); }, OK_DELAY);
      }
    } catch (e) {
      if (my !== seq.current) return;
      const err = errKind(e);
      // Истёкший код бэкенд отличает статусом 410 или сообщением codeExpired
      const expired = err && (err.status === 410 || err.message === 'codeExpired');
      setPhase('idle');
      setCodeErr(expired ? FORM_ERRORS.codeExpired : FORM_ERRORS.code);
      if (expired) setTimer(0);
      focusCode();
    }
  };
  const onCode = (v: string) => {
    if (phase !== 'idle') return;
    setCode(v); setCodeErr('');
    if (v.length === 4) verify(v);
  };
  const resend = async () => {
    const my = ++seq.current;
    setResending(true);
    try {
      await (isLogin ? authCode(phone) : changePhone(phone));
      if (my !== seq.current) return;
      setTimer(RESEND_SEC); setCode(''); setCodeErr(''); setPhase('idle');
      focusCode();
    } catch {
      if (my === seq.current) setCodeErr(FORM_ERRORS.network);
    } finally {
      if (my === seq.current) setResending(false);
    }
  };
  const back = () => {
    ++seq.current;
    setStep('phone'); setCode(''); setCodeErr(''); setPhase('idle'); setTg('idle'); setSending(false);
  };
  const openTg = () => { ++seq.current; setTg('idle'); setStep('tg'); };

  // ── Шаг «Telegram»: токен сессии + опрос статуса
  useEffect(() => {
    if (frozen || step !== 'tg') return;
    let alive = true;
    let poll: number | undefined;
    setTgToken(null); setQr(null);
    authTg().then(({ token: t }) => {
      if (!alive) return;
      setTgToken(t);
      poll = window.setInterval(async () => {
        try {
          const r = await authTgStatus(t);
          if (!alive || r.status !== 'ok') return;
          clearInterval(poll);
          const ph = formatPhone(r.phone ?? '') || phone;
          setPhone(ph); setTg('ok');
          later(() => { if (alive) complete(ph, null); }, TG_OK_DELAY);
        } catch { /* сеть моргнула — следующий опрос */ }
      }, TG_POLL);
    }).catch(() => { /* повтор — через «Войти по коду» и обратно */ });
    return () => { alive = false; clearInterval(poll); };
    // phone читаем только как запасной номер — перезапускать опрос из-за него не нужно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frozen, step, later, complete]);

  const tgLink = tgToken ? TG_BOT.link(tgToken) : null;
  // QR генерируем на клиенте (пакет qrcode), без внешних сервисов
  useEffect(() => {
    if (step !== 'tg' || !desktop || !tgLink) return;
    let alive = true;
    import('qrcode')
      // #17151A = --ink-1: canvas не понимает CSS-переменные
      .then(Q => Q.toDataURL(tgLink, { margin: 0, width: 264, errorCorrectionLevel: 'M', color: { dark: '#17151A', light: '#FFFFFF' } }))
      .then(url => { if (alive) setQr(url); })
      .catch(() => {});
    return () => { alive = false; };
  }, [step, desktop, tgLink]);

  // ── Шаг «Имя»

  const busy = phase !== 'idle';
  const codeStatus: CodeStatus = phase === 'ok' ? 'ok' : codeErr && !busy ? 'error' : 'idle';
  const codeFocused = frozen && (state === 'empty' || state === 'partial') ? true : undefined;
  const errId = uid + '-code-msg';

  const head = (title: string, sub: React.ReactNode) => (
    <div className={s.head}><h2 className={s.title}>{title}</h2><p className={s.sub}>{sub}</p></div>
  );
  const spin = (big?: boolean) => <Spinner size={big ? 14 : 12} variant="track" />;

  return (
    <div className={`${s.root} ${className || ''}`}>
      {step === 'phone' && (
        <form className={s.contents} noValidate onSubmit={e => { e.preventDefault(); sendCode(); }}>
          {isLogin
            ? head('Вход или регистрация', 'Отправим код в WhatsApp. Заказы и адреса сохранятся в профиле')
            : head('Новый номер', 'Отправим код в WhatsApp на новый номер. Заказы и адреса останутся в профиле')}
          <MartInput
            label="Телефон" type="phone" required value={phone} error={phoneErr || undefined}
            onChange={v => { setPhone(v); setPhoneErr(''); }}
            onBlur={() => { if (phone && !phoneComplete(phone)) setPhoneErr(FORM_ERRORS.phone); }}
          />
          <div className={s.actions}>
            <MartButton type="submit" label="Получить код в WhatsApp" size={56} full
              disabled={!phoneComplete(phone)} loading={sending} reason={FORM_ERRORS.phone} />
            {isLogin && <>
              <div className={s.or}>или</div>
              <MartButton label="Войти через Telegram" variant="ghost" size={56} full onClick={openTg} />
            </>}
          </div>
          {isLogin && (
            <p className={s.terms}>
              Продолжая, вы соглашаетесь с <a href="#">условиями</a> и <a href="#">политикой обработки данных</a>
            </p>
          )}
        </form>
      )}

      {step === 'code' && <>
        {head('Код из WhatsApp', <>
          Отправили сообщение на {phone} · <button type="button" className={s.inlineLink} onClick={back}>Изменить</button>
        </>)}
        <div className={s.codeBlock}>
          <MartCodeInput
            ref={codeRef} value={code} onChange={onCode} status={codeStatus} disabled={busy} focused={codeFocused}
            aria-label="Код из WhatsApp" aria-describedby={codeErr && !busy ? errId : undefined}
          />
          {codeErr && !busy && <span id={errId} role="alert" className={`${s.status} ${s.statusError}`}>{codeErr}</span>}
          {phase === 'ok' && <span role="status" className={`${s.status} ${s.statusOk}`}>Код подтверждён</span>}
          {phase === 'verifying' && <span role="status" className={`${s.status} ${s.statusWait}`}>{spin()}Проверяем код…</span>}
        </div>
        <div className={s.links}>
          {timer === 0
            ? <button type="button" className={s.linkBtn} onClick={resend} disabled={resending} aria-busy={resending || undefined}>Отправить код ещё раз</button>
            : <span className={s.timer}>Новый код через 0:{String(timer).padStart(2, '0')}</span>}
          {isLogin && <button type="button" className={`${s.linkBtn} ${s.linkMuted}`} onClick={openTg}>Нет WhatsApp? Войти через Telegram</button>}
          {mockHint && <span className={s.mockHint}>Прототип: верный код — 1234</span>}
        </div>
      </>}

      {step === 'tg' && <>
        {head('Вход через Telegram', 'Бот попросит поделиться номером — так мы найдём ваш профиль')}
        <ol className={s.tgSteps}>
          {[desktop ? 'Отсканируйте QR или откройте бота' : 'Откройте бота 8mart в Telegram', 'Нажмите «Старт»', 'Нажмите «Поделиться номером»'].map((t, i) => (
            <li key={i} className={s.tgStep}>
              <span className={`${s.tgNum} ${tg === 'ok' ? s.tgNumOk : ''}`} aria-hidden>{i + 1}</span>
              <span className={s.tgText}>{t}</span>
            </li>
          ))}
        </ol>
        {desktop && tg !== 'ok' && (
          <div className={s.qr}>
            {qr
              ? <img src={qr} alt="QR-код для входа через Telegram" width={132} height={132} className={s.qrImg} />
              : <span className={s.qrImg} role="img" aria-label="QR-код загружается">{spin(true)}</span>}
            <div className={s.qrText}>
              <b className={s.qrTitle}>Отсканируйте камерой телефона</b>
              <span className={s.qrNote}>Откроется бот <span className={s.qrBot}>@{TG_BOT.username}</span> — дальше всё в Telegram</span>
            </div>
          </div>
        )}
        {tgLink
          ? (
            <a href={tgLink} target="_blank" rel="noopener noreferrer"
              className={[bs.btn, desktop ? bs.ghost : bs.primary, bs.s56, bs.full, s.tgBtn].join(' ')}
              onClick={() => { if (tg === 'idle') setTg('waiting'); }}>
              <span>{desktop ? 'Открыть Telegram на компьютере' : 'Открыть Telegram'}</span>
            </a>
          )
          : <MartButton label={desktop ? 'Открыть Telegram на компьютере' : 'Открыть Telegram'} variant={desktop ? 'ghost' : 'primary'} size={56} full loading />}
        {tg === 'waiting' && <div role="status" className={s.plate}>{spin(true)}{STATUS.tgWaiting}</div>}
        {tg === 'ok' && <div role="status" className={`${s.plate} ${s.plateOk}`}>Номер подтверждён · {phone}</div>}
        <button type="button" className={`${s.linkBtn} ${s.linkMuted}`} onClick={back}>Войти по коду в WhatsApp</button>
      </>}

    </div>
  );
}
