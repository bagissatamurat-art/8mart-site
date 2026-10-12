// TEMP-ADAPTER (частично): DELIVERY_API, RawZone и toQuote — мост к зонам 8mart.kz, с бэкендом удалить. Типы DeliveryQuote/QuoteResult — контракт, оставить.
// Зоны доставки 8mart.kz: GET /public/branches/resolve-delivery?lat&lng → филиал, зона, стоимость и время для точки на карте.
// Вне зон — 400 «Selected address is outside delivery zones». Вызываем с сервера (app/api/delivery/quote), браузер — через него.
export const DELIVERY_API = 'https://dukenfy-api.8mart.kz/api/v1/public/branches/resolve-delivery';

export interface DeliveryQuote {
  /** Стоимость курьерской доставки в эту зону, тг. */
  fee: number;
  /** Время до двери, мин (сборка + дорога). */
  eta: number;
  branchId: string;
  branchName: string;
  zone: string;
  /** Филиал принимает Kaspi Pay автоматически — счёт на номер не нужен. */
  kaspiIntegrated: boolean;
}

export interface RawZone {
  branchId: string; branchName: string; zoneName: string; deliveryCost: number; deliveryTimeMinutes: number; kaspiIntegrated?: boolean;
}

/** «8MART - Сыганак 13» → «8MART, Сыганак 13» (как в списке филиалов). */
export const toQuote = (r: RawZone): DeliveryQuote => ({
  fee: Math.round(r.deliveryCost), eta: r.deliveryTimeMinutes, branchId: r.branchId,
  branchName: r.branchName.replace(/\s+-\s+/, ', '), zone: r.zoneName, kaspiIntegrated: !!r.kaspiIntegrated,
});

/** Ответ /api/delivery/quote: quote — доставляем; outside — адрес вне зон; unavailable — API недоступен (показываем общие условия). */
export type QuoteResult = { status: 'ok'; quote: DeliveryQuote } | { status: 'outside' } | { status: 'unavailable' };
