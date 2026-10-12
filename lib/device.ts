// Телефон по User-Agent — только чтобы сразу отдать с сервера нужную вёрстку (proxy.ts). После загрузки решает ширина экрана.
export const MOBILE_UA = /Android.+Mobile|iPhone|iPod|Windows Phone|Opera Mini|IEMobile|Mobile Safari|BlackBerry|webOS/i;
export const isMobileUA = (ua: string | null) => !!ua && MOBILE_UA.test(ua);
