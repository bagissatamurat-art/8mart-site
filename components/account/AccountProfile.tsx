'use client';
// Личные данные: имя, телефон («Изменить» → страница открывает MartAuth purpose="changePhone"),
// «Удалить аккаунт» — серой ссылкой внизу, с подтверждением.
import { useEffect, useRef, useState } from 'react';
import type { User } from '@/lib/types';
import { MartButton } from '../MartButton';
import { MartInput } from '../MartInput';
import { ConfirmDialog } from './ConfirmDialog';
import s from '../MartAccount.module.css';
import { FORM_ERRORS, STATUS } from '@/lib/copy';

export const DELETE_ACCOUNT_TEXT = 'История заказов, адреса, карты и бонусы удалятся без возможности восстановления. Активный заказ будет доставлен.';

export interface AccountProfileProps {
  user: User;
  mobile: boolean;
  onChangePhone?: () => void;
  /** Сохранить имя. Promise → кнопка в загрузке, после ответа — «Сохранено» на 2 с. */
  onSaveName?: (name: string) => void | Promise<unknown>;
  /** Подтверждённое удаление. Дальше страница ведёт на главную `/?deleted=1` с тостом «Аккаунт удалён». */
  onDeleteAccount?: () => void | Promise<unknown>;
  /** Открыть диалог удаления сразу (витрина). */
  confirmOpen?: boolean;
  /** Диалог внутри рамки, без портала (витрина). */
  inlineDialog?: boolean;
}

export function AccountProfile({ user, mobile, onChangePhone, onSaveName, onDeleteAccount, confirmOpen = false, inlineDialog }: AccountProfileProps) {
  const [base, setBase] = useState(user.name);
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(confirmOpen);
  const [deleting, setDeleting] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  // Имя пришло с сервера заново — сбрасываем черновик
  useEffect(() => { setBase(user.name); setName(user.name); }, [user.name]);

  const dirty = name !== base;
  const invalid = name.trim().length < 2;

  const save = async () => {
    if (invalid) return;
    setSaving(true);
    try {
      await onSaveName?.(name.trim());
      setBase(name.trim()); setName(name.trim()); setSaved(true);
      clearTimeout(t.current); t.current = setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };
  const doDelete = async () => {
    setDeleting(true);
    try { await onDeleteAccount?.(); setConfirm(false); } finally { setDeleting(false); }
  };

  return (
    <>
      <div className={`${s.card} ${s.form}`}>
        <MartInput label="Имя" value={name} autoComplete="given-name" onChange={v => { setName(v); setSaved(false); }}
          error={dirty && !name.trim() ? true : undefined} />
        <div className={s.phoneRow}>
          <span className={s.col}>
            <span className={s.phoneLabel}>Телефон</span>
            <span className={s.phoneValue}>{user.phone}</span>
          </span>
          <button type="button" className={s.pillBtn} onClick={onChangePhone} aria-label="Изменить телефон">Изменить</button>
        </div>
        {dirty && (
          <div className={s.saveRow}>
            <MartButton label="Сохранить" size={56} full={mobile} disabled={invalid} reason={FORM_ERRORS.nameRequired} loading={saving} onClick={save} />
            {invalid && <span className={s.reason}>{FORM_ERRORS.nameRequired}</span>}
          </div>
        )}
        {saved && <span className={s.saved} role="status">{STATUS.saved}</span>}
      </div>
      <button type="button" className={s.deleteLink} onClick={() => setConfirm(true)}>Удалить аккаунт</button>
      <ConfirmDialog open={confirm} mode={mobile ? 'mobile' : 'desktop'} inline={inlineDialog} title="Удалить аккаунт?" text={DELETE_ACCOUNT_TEXT}
        confirmLabel="Удалить" loading={deleting} onConfirm={doDelete} onClose={() => setConfirm(false)} />
    </>
  );
}
