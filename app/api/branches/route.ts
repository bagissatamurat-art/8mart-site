// GET /api/branches — точки самовывоза с живым статусом филиалов 8mart.kz (открыт / принимает заказы).
// Прокси к публичному API с кэшем 60 с; API недоступен — снимок из lib/branches.snapshot.json.
import { BRANCHES_API, SNAPSHOT_POINTS, toPickupPoint, type RawBranch } from '@/lib/branches';

export const revalidate = 60;

export async function GET() {
  try {
    const r = await fetch(BRANCHES_API, { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`status ${r.status}`);
    const raw = (await r.json()) as RawBranch[];
    return Response.json({ live: true, points: raw.map(toPickupPoint) }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
  } catch (e) {
    console.error('[api/branches]', e instanceof Error ? e.message : e);
    return Response.json({ live: false, points: SNAPSHOT_POINTS }, { headers: { 'Cache-Control': 'public, max-age=30' } });
  }
}
