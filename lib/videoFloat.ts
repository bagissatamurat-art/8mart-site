// Плавающая миниатюра видео товара (VideoFloat): где она стоит и куда «магнитится». Чистые функции — для компонента и тестов.
// zone — где миниатюра живёт, когда всё на своих местах: экран без шапки и нижней кнопки «В корзину» (на компьютере —
// колонка галереи). clip — видимая сейчас часть (на компьютере карточка товара уезжает при прокрутке): миниатюра стоит
// на месте экрана и сдвигается, только если граница карточки подошла вплотную. Все прямоугольники — в координатах окна.
// Положение хранится как сторона (левый/правый край) и доля пути по вертикали в zone: так оно переживает поворот экрана
// и другой размер окна, а между товарами в той же сессии миниатюра остаётся там, куда её отнёс покупатель.

export interface FloatRect { left: number; top: number; right: number; bottom: number }
export interface FloatSize { w: number; h: number }
export type FloatSide = 'left' | 'right';
/** side — у какого края; t — доля пути сверху вниз (0 — у верхней границы, 1 — у нижней). */
export interface FloatPos { side: FloatSide; t: number }
export interface FloatPoint { x: number; y: number }
/** Где можно стоять: zone — обычное место, clip — видимая сейчас часть (нет — совпадает с zone). */
export interface FloatBounds { zone: FloatRect; clip?: FloatRect }

/** Как раньше миниатюра стояла на фото: справа сверху. */
export const FLOAT_START: FloatPos = { side: 'right', t: 0 };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Пересечение прямоугольников. */
export const floatIntersect = (a: FloatRect, b: FloatRect): FloatRect =>
  ({ left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) });

/** Пределы левого верхнего угла миниатюры в прямоугольнике с отступом gap от краёв. Узкий или низкий — к левому/верхнему краю. */
export function floatLimits(r: FloatRect, size: FloatSize, gap: number) {
  const minX = r.left + gap, minY = r.top + gap;
  return { minX, maxX: Math.max(minX, r.right - gap - size.w), minY, maxY: Math.max(minY, r.bottom - gap - size.h) };
}

/** Помещается ли миниатюра с отступами: нет (карточка ушла с экрана, окно слишком низкое) — не показываем. */
export function floatFits(r: FloatRect | null | undefined, size: FloatSize, gap: number): r is FloatRect {
  return !!r && r.right - r.left >= size.w + 2 * gap && r.bottom - r.top >= size.h + 2 * gap;
}

/** Во время перетаскивания: за пальцем, но целиком внутри прямоугольника. */
export function floatClamp(p: FloatPoint, r: FloatRect, size: FloatSize, gap: number): FloatPoint {
  const l = floatLimits(r, size, gap);
  return { x: clamp(p.x, l.minX, l.maxX), y: clamp(p.y, l.minY, l.maxY) };
}

/** Где нарисовать миниатюру для сохранённого положения: место в zone, прижатое к видимой части. */
export function floatPlace(pos: FloatPos, b: FloatBounds, size: FloatSize, gap: number): FloatPoint {
  const l = floatLimits(b.zone, size, gap);
  const p = { x: pos.side === 'left' ? l.minX : l.maxX, y: l.minY + clamp(pos.t, 0, 1) * (l.maxY - l.minY) };
  return b.clip ? floatClamp(p, floatIntersect(b.zone, b.clip), size, gap) : p;
}

/** Отпустили: к ближайшему левому или правому краю (по центру миниатюры), по вертикали — где отпустили. */
export function floatSnap(p: FloatPoint, b: FloatBounds, size: FloatSize, gap: number): FloatPos {
  const z = b.zone, l = floatLimits(z, size, gap);
  const side: FloatSide = p.x + size.w / 2 < (z.left + z.right) / 2 ? 'left' : 'right';
  const t = l.maxY > l.minY ? clamp((p.y - l.minY) / (l.maxY - l.minY), 0, 1) : 0;
  return { side, t: Math.round(t * 1000) / 1000 };
}

/** Сохранённое положение из sessionStorage; мусор — null (миниатюра встанет на место по умолчанию). */
export function parseFloatPos(raw: string | null): FloatPos | null {
  try {
    const v = JSON.parse(raw ?? 'null') as Partial<FloatPos> | null;
    if (v && (v.side === 'left' || v.side === 'right') && typeof v.t === 'number' && Number.isFinite(v.t)) return { side: v.side, t: clamp(v.t, 0, 1) };
  } catch { /* испорченная запись */ }
  return null;
}
