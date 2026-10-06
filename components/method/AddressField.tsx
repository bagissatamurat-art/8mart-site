'use client';
// Поле «Улица, дом» в выборе способа: выглядит как MartInput, по нажатию открывает окно поиска адреса (AddressSearch).
// Само не редактируется — клавиатура на mobile не всплывает поверх карты; адрес приходит из поиска или с пина.
import { forwardRef } from 'react';
import { Spinner } from '../ui/Spinner';
import s from '../MartMethodModal.module.css';

export interface AddressFieldProps {
  value: string;
  /** Пин двигают — адрес определяется. */
  busy?: boolean;
  error?: string;
  /** id подсказки рядом с полем (нет номера дома) — для aria-describedby. */
  hintId?: string;
  onOpen: () => void;
}

export const AddressField = forwardRef<HTMLButtonElement, AddressFieldProps>(function AddressField({ value, busy, error, hintId, onOpen }, ref) {
  const filled = !!value.trim();
  return (
    <div className={s.field}>
      <button ref={ref} type="button" className={`${s.addr} ${filled ? s.addrFilled : ''} ${error ? s.addrError : ''}`}
        aria-haspopup="dialog" aria-label={filled ? `Улица, дом: ${value}. Изменить` : 'Улица, дом — найти адрес'} aria-describedby={hintId} onClick={onOpen}>
        <span className={s.addrText}>
          <span className={s.addrLabel}>Улица, дом<span className={s.addrReq}>*</span></span>
          {filled && <span className={s.addrValue}>{value}</span>}
        </span>
        {busy ? <Spinner size={16} variant="track" /> : <span className={s.addrSearch} aria-hidden />}
      </button>
      {error && <span className={s.addrMsg}>{error}</span>}
    </div>
  );
});
