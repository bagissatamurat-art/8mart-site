// Типы MartMethodModal. MethodValue = стор `method` из README («Стейт (клиент)») + поля формы доставки.
import type { Method } from '@/lib/types';

export interface MethodValue {
  method: Method | null;
  /** id города из GET /cities */
  city: string;
  /** Доставка — «Улица, дом»; самовывоз — адрес точки. */
  address: string;
  lat: number | null;
  lng: number | null;
  pickupPointId: string | null;
  /** Подъезд и квартира — поля формы доставки (в референсе уходят в onConfirm). */
  entrance?: string;
  flat?: string;
  /** Название адреса — только в режиме addressOnly (кабинет). */
  title?: string;
}

/** Принудительные состояния для витрины /kit. */
export type MethodDemoState = 'suggestOpen' | 'suggestLoading' | 'suggestEmpty' | 'suggestError';

/** Ответ /api/geo/suggest. lat/lng могут быть null, если координат нет у поставщика. */
export interface Suggestion { title: string; subtitle: string; lat: number | null; lng: number | null; hasHouse: boolean }

export interface LatLng { lat: number; lng: number }
