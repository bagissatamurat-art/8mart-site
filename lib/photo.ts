'use client';
// Фото для отзыва — на телефоне, до отправки: большие снимки уменьшаем до REVIEW_RULES.photoSide по длинной стороне
// и пережимаем в JPEG. По мобильной сети уходит сотня-другая килобайт вместо 5–10 МБ, а координаты съёмки (EXIF)
// при перерисовке на canvas пропадают ещё до отправки — сервер их и так срезает. Не вышло (старый браузер, HEIC
// без поддержки) — отправляем файл как есть: сервер сам повернёт, сожмёт и уберёт метаданные.
import { REVIEW_RULES } from './config';

/** Файл похож на фото: по типу или по расширению (HEIC с iPhone иногда приходит без типа). */
export const isPhoto = (f: File) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(f.name);

export async function shrinkPhoto(file: File, side = REVIEW_RULES.photoSide, quality = REVIEW_RULES.photoQuality): Promise<Blob> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, side / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bmp.width * k));
    canvas.height = Math.max(1, Math.round(bmp.height * k));
    const ctx = canvas.getContext('2d');
    if (!ctx) { bmp.close(); return file; }
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const out = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality));
    // Маленький JPEG без уменьшения пережимать незачем — но метаданные хотим убрать всегда, поэтому берём перерисованный.
    return out && out.size > 0 ? out : file;
  } catch {
    return file;
  }
}
