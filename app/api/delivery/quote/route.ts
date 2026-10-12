// TEMP-ADAPTER: временный мост к публичному API 8mart.kz / DaData, пока нет бэкенда. С бэкендом — удалить (см. BACKEND_HANDOFF.md, раздел 3).
// GET /api/delivery/quote?lat&lng — стоимость и время доставки по зонам 8mart.kz для точки на карте.
// Координаты округляем до ~10 м: кэш (5 мин) общий для соседних точек, API 8mart.kz не дёргаем на каждый сдвиг пина.
import { DELIVERY_API, toQuote, type QuoteResult, type RawZone } from '@/lib/delivery';

const json = (body: QuoteResult, maxAge = 300) => Response.json(body, { headers: { 'Cache-Control': `public, max-age=${maxAge}` } });

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get('lat')), lng = Number(q.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return Response.json({ error: 'lat, lng' }, { status: 400 });
  }
  const url = `${DELIVERY_API}?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`;
  try {
    const r = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(6000) });
    if (r.status === 400) {
      const msg = String(((await r.json().catch(() => null)) as { error?: { message?: string } } | null)?.error?.message ?? '');
      if (/outside/i.test(msg)) return json({ status: 'outside' });
    }
    if (!r.ok) throw new Error(`status ${r.status}`);
    return json({ status: 'ok', quote: toQuote((await r.json()) as RawZone) });
  } catch (e) {
    console.error('[api/delivery/quote]', e instanceof Error ? e.message : e);
    return json({ status: 'unavailable' }, 0);
  }
}
