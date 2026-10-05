// GET /api/geo/reverse?lat&lng — адрес по пину: DaData geolocate, запасной — Mapbox Geocoding v6.
// Ни DaData, ни Mapbox не настроены (или оба упали) → 503.
import { badRequest, hasDadata, hasMapbox, reverseGeocode, unavailable } from '../geo.server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get('lat')), lng = Number(sp.get('lng'));
  if (!sp.get('lat') || !Number.isFinite(lat) || lat < -90 || lat > 90) return badRequest('lat');
  if (!sp.get('lng') || !Number.isFinite(lng) || lng < -180 || lng > 180) return badRequest('lng');
  if (!hasDadata() && !hasMapbox()) return unavailable();
  try {
    const r = await reverseGeocode(lat, lng);
    return Response.json(r, { headers: { 'Cache-Control': 'private, max-age=300' } });
  } catch (e) {
    console.error('[geo/reverse]', e instanceof Error ? e.message : e);
    return unavailable();
  }
}
