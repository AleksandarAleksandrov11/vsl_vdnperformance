/**
 * POST /api/evento/: PageView y ViewContent por la API de Conversiones.
 *
 * El píxel sólo ve a quien acepta las cookies; esta ruta le cuenta a Meta
 * todas las visitas, con el mismo event_id que el píxel (si está cargado)
 * para que Meta junte los dos caminos y no cuente doble. Lo llama tracking.ts con
 * sendBeacon (o fetch con keepalive): nunca bloquea la página.
 *
 * Siempre responde 204, pase lo que pase: el navegador no espera nada.
 *  · Sin META_CAPI_TOKEN no hace nada.
 *  · Sólo acepta peticiones del propio origen y los eventos de la lista.
 *  · Ignora los bots evidentes (buscadores, vistas previas, Lighthouse...).
 */

import { after, type NextRequest } from 'next/server';
import { capiActiva, enviarCapi, EVENTOS_NAVEGACION, eventoNavegacion, type EventoNavegacion } from '@/lib/capi';

export const runtime = 'nodejs';

const nada = () => new Response(null, { status: 204 });

const BOT =
  /bot|crawl|spider|slurp|facebookexternalhit|facebookcatalog|whatsapp|telegram|preview|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|curl|wget|python|axios|node-fetch|go-http/i;

/** IP de quien envía: la primera de x-forwarded-for (la que pone Vercel), o x-real-ip. */
function ipDe(req: NextRequest): string | undefined {
  const xff = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return xff || req.headers.get('x-real-ip')?.trim() || undefined;
}

/** Sólo el propio origen: Origin (o, si no viene, Referer) del mismo host. */
function delPropioOrigen(req: NextRequest): boolean {
  const origen = req.headers.get('origin') || req.headers.get('referer');
  if (!origen) return false;
  try {
    return new URL(origen).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!capiActiva()) return nada();
  if (!delPropioOrigen(req)) return nada();
  const ua = req.headers.get('user-agent') ?? '';
  if (!ua || BOT.test(ua)) return nada();

  /* sendBeacon manda el cuerpo como text/plain (así no hay preflight): se lee
     como texto y se interpreta como JSON. */
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = JSON.parse((await req.text()).slice(0, 4000));
  } catch {
    return nada();
  }
  if (typeof cuerpo !== 'object' || cuerpo === null) return nada();
  const texto = (k: string, max: number) => {
    const v = cuerpo[k];
    return typeof v === 'string' ? v.trim().slice(0, max) : '';
  };

  const nombre = texto('event_name', 20) as EventoNavegacion;
  const eventId = texto('event_id', 64);
  if (!EVENTOS_NAVEGACION.includes(nombre) || !eventId) return nada();

  /* La URL de la página, sólo si es de esta misma web. */
  let url = `${req.nextUrl.origin}/`;
  try {
    const u = new URL(texto('event_source_url', 300));
    if (u.host === req.nextUrl.host) url = `${u.origin}${u.pathname}`;
  } catch {
    /* sin URL válida: la portada */
  }
  const ts = Number(texto('fbclid_ts', 16));
  const evento = eventoNavegacion({
    nombre,
    eventId,
    url,
    userAgent: ua,
    ip: ipDe(req),
    fbp: req.cookies.get('_fbp')?.value || texto('fbp', 120) || undefined,
    fbc: req.cookies.get('_fbc')?.value || texto('fbc', 300) || undefined,
    fbclid: texto('fbclid', 500) || undefined,
    fbclidTs: Number.isFinite(ts) && ts > 0 ? ts : undefined,
  });
  after(() => enviarCapi(evento));
  return nada();
}
