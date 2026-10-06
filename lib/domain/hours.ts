// Статус точки по графику работы: «Открыто до 22:00», «Закроется через 10 мин», «Закрыто до 09:00 завтра».
// График — строка из API: «Ежедневно 09:00–22:00», «Пн–Сб 09:00–21:00», «Пн–Пт 09:00–18:00, Сб 10:00–16:00», «Круглосуточно».
// Время — местное время точки (Казахстан, UTC+5), а не часы браузера.

/** Смещение времени Казахстана от UTC, минуты (единый часовой пояс UTC+5 с 2024 г.). */
export const KZ_UTC_OFFSET_MIN = 5 * 60;
/** Меньше этого (мин) до открытия/закрытия — «через N мин»; час и больше — время. */
export const SOON_MIN = 60;

const DAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const WEEK = 7 * 24 * 60;

/** Интервал работы в минутах от начала недели (пн 00:00); конец может быть больше начала следующего дня (через полночь). */
interface Span { from: number; to: number }

/** Разбор графика в интервалы недели. null — формат не распознан (показываем строку как есть). */
export function parseHours(hours: string): Span[] | null {
  const src = hours.toLowerCase().replace(/[—–-]/g, '–').replace(/\s+/g, ' ').trim();
  if (/круглосуточно|24\/7/.test(src)) return [{ from: 0, to: WEEK }];
  const spans: Span[] = [];
  // Части «дни время–время»: «пн–сб 09:00–21:00», «ежедневно 08:00–23:00», «сб 10:00–16:00».
  const re = /(ежедневно|[а-я]{2}(?:\s?–\s?[а-я]{2})?(?:\s?,\s?[а-я]{2}(?:\s?–\s?[а-я]{2})?)*)\s+(\d{1,2}):(\d{2})\s?–\s?(\d{1,2}):(\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const days = dayList(m[1]);
    if (!days) return null;
    const open = +m[2] * 60 + +m[3];
    let close = +m[4] * 60 + +m[5];
    if (close <= open) close += 24 * 60; // через полночь (или 00:00 как конец дня)
    for (const d of days) spans.push({ from: d * 1440 + open, to: d * 1440 + close });
  }
  return spans.length ? spans : null;
}

function dayList(part: string): number[] | null {
  if (part === 'ежедневно') return [0, 1, 2, 3, 4, 5, 6];
  const out: number[] = [];
  for (const chunk of part.split(',').map(x => x.trim())) {
    const [a, b] = chunk.split('–').map(x => DAYS.indexOf(x.trim()));
    if (a < 0 || (b !== undefined && b < 0)) return null;
    if (b === undefined) out.push(a);
    else for (let d = a; ; d = (d + 1) % 7) { out.push(d); if (d === b) break; }
  }
  return out;
}

/** Минута недели (пн 00:00 = 0) по времени Казахстана. */
export function kzWeekMinute(now: Date): number {
  const t = new Date(now.getTime() + KZ_UTC_OFFSET_MIN * 60000);
  return ((t.getUTCDay() + 6) % 7) * 1440 + t.getUTCHours() * 60 + t.getUTCMinutes();
}

export type OpenState =
  | { kind: 'always' }
  /** Открыто; closeAt — минута недели закрытия, inMin — минут до закрытия. */
  | { kind: 'open'; closeAt: number; inMin: number }
  /** Закрыто; openAt — минута недели открытия, inMin — минут до открытия, days — через сколько суток (0 — сегодня). */
  | { kind: 'closed'; openAt: number; inMin: number; days: number };

/** Состояние точки сейчас. null — график не распознан. */
export function openState(hours: string, now: Date): OpenState | null {
  const spans = parseHours(hours);
  if (!spans) return null;
  if (spans.length === 1 && spans[0].to - spans[0].from >= WEEK) return { kind: 'always' };
  const n = kzWeekMinute(now);
  // Интервалы прошлой/этой/следующей недели — чтобы «вс 22:00–02:00» и «откроется в пн» считались через границу недели.
  const all = spans.flatMap(s => [-WEEK, 0, WEEK].map(o => ({ from: s.from + o, to: s.to + o })));
  const cur = all.filter(s => s.from <= n && n < s.to).sort((a, b) => b.to - a.to)[0];
  if (cur) return { kind: 'open', closeAt: ((cur.to % WEEK) + WEEK) % WEEK, inMin: cur.to - n };
  const next = all.filter(s => s.from > n).sort((a, b) => a.from - b.from)[0];
  const dayNow = Math.floor(n / 1440);
  return { kind: 'closed', openAt: ((next.from % WEEK) + WEEK) % WEEK, inMin: next.from - n, days: Math.floor(next.from / 1440) - dayNow };
}

/** «09:00» из минуты недели. */
export const hhmm = (weekMin: number) => {
  const m = ((weekMin % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
/** «пн» из минуты недели. */
export const dayShort = (weekMin: number) => DAYS[Math.floor((((weekMin % WEEK) + WEEK) % WEEK) / 1440)];
