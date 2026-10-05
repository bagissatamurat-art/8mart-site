// Форматирование — перенесено 1:1 из design_handoff_8mart_site/site/data.js.

/** `4 090 тг.` — пробел-разделитель, «тг.» с точкой. null → «Цена уточняется». */
export function money(n: number | null | undefined): string {
  return n == null ? 'Цена уточняется' : `${Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ')} тг.`;
}

/** `4 090 тг` — сумма внутри фразы («бесплатно от 20 000 тг»): без точки, как в макете. */
export function tg(n: number): string {
  return money(n).replace('тг.', 'тг');
}

/** Склонение: plural(n, 'товар', 'товара', 'товаров'). */
export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

export function itemsTitle(n: number): string {
  return `${n} ${plural(n, 'товар', 'товара', 'товаров')}`;
}

/** Разряды через пробел без «тг.» (для свободного текста). */
export function groupDigits(n: number | string): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function bonusText(n: number): string {
  return '+' + groupDigits(n) + ' ' + plural(n, 'бонус', 'бонуса', 'бонусов');
}

// Маска +7 (999) 999-99-99; ведущая 8 → +7; иной код после + — свободный формат.
// Форматируем только по цифрам: удаление любого символа маски удаляет соседнюю цифру, пусто → ''.
export function formatPhone(raw: string | null | undefined, prev?: string): string {
  let s = String(raw || '');
  // Удалили символ маски (скобку, пробел, дефис) — цифры не изменились: стираем ближайшую цифру слева
  if (prev && s.length < prev.length && s.replace(/\D/g, '') === prev.replace(/\D/g, '')) {
    let i = 0; while (i < s.length && s[i] === prev[i]) i++;
    const h = s.slice(0, i), pre = h.startsWith('+7') ? 2 : 0;
    const head = h.slice(0, pre) + h.slice(pre).replace(/\d(?=\D*$)/, '');
    s = head + s.slice(i);
  }
  if (!s.trim()) return '';
  const intl = s.startsWith('+') && !/^\+7/.test(s) && !/^\+$/.test(s);
  if (intl) return s.replace(/[^\d+ ]/g, '').slice(0, 16);
  let digits = s.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (digits.startsWith('7')) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (!digits.length) return (s.startsWith('+') || /\d/.test(s)) && !(prev && s.length < prev.length) ? '+7' : '';
  let out = '+7 (' + digits.slice(0, 3);
  if (digits.length > 3) out += ') ' + digits.slice(3, 6);
  if (digits.length > 6) out += '-' + digits.slice(6, 8);
  if (digits.length > 8) out += '-' + digits.slice(8, 10);
  return out;
}

export function phoneComplete(v: string): boolean {
  return /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(v);
}
