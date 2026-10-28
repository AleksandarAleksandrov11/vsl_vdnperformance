/**
 * POST /api/lead/: recibe el presupuesto del formulario.
 *
 * 1. Lo reenvía al Apps Script de la hoja y lee su respuesta. Desde el
 *    navegador eso no se puede (la respuesta de Google llega opaca); desde
 *    aquí sí, así que la web sabe de verdad si el lead se guardó.
 * 2. Responde { ok: true } si la hoja lo guardó (ver guardarEnHoja: también
 *    con un 2xx que no es JSON). Es lo que decide si el navegador dispara el
 *    Lead del píxel.
 * 3. Con la respuesta ya enviada (after), manda el mismo Lead, con el mismo
 *    event_id, a la API de Conversiones. Para todos los leads, con o sin
 *    consentimiento de cookies. Si Meta falla, el lead ya está guardado.
 *
 * A la hoja va exactamente el mismo cuerpo de siempre (CAMPOS + objetivo +
 * website). Lo que el navegador manda para la CAPI (fbclid, fbc, fbp,
 * event_source_url, consent_marketing) se usa aquí y no se reenvía nunca.
 * tests/fixtures/payload-hoja.json fija ese cuerpo byte a byte.
 */

import { after, type NextRequest } from 'next/server';
import { SHEETS_WEBHOOK_URL } from '@/lib/config';
import { enviarLeadCapi } from '@/lib/capi';

export const runtime = 'nodejs';
/* El Apps Script puede tardar (arranque en frío y su bloqueo de escritura):
   se le esperan hasta 30 s, y la función necesita margen por encima de eso. */
export const maxDuration = 60;

const ESPERA_HOJA_MS = 30_000;

/** Campos que se reenvían a la hoja, con su largo máximo. En este orden. */
const CAMPOS = {
  nombre: 80,
  telefono: 20,
  modelo: 80,
  anio: 4,
  motor: 60,
  potencia: 12,
  event_id: 64,
  utm_source: 120,
  utm_campaign: 160,
  utm_content: 160,
} as const;

/** 9 dígitos (España, como siempre) o "+" y el número entero con su prefijo. */
const TELEFONO = /^(\d{9}|\+\d{7,18})$/;

const responder = (ok: boolean, status = 200) => Response.json({ ok }, { status });

/** IP de quien envía: la primera de x-forwarded-for (la que pone Vercel), o x-real-ip. */
function ipDe(req: NextRequest): string | undefined {
  const xff = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return xff || req.headers.get('x-real-ip')?.trim() || undefined;
}

/**
 * Reenvía el lead al Apps Script y dice si se guardó.
 *
 *  · 2xx con {"ok":true} ........ guardado.
 *  · 2xx con algo que no es JSON  guardado igualmente: el Apps Script a veces
 *                                 contesta una página en vez de su JSON y la
 *                                 fila ya está escrita. Queda en el log.
 *  · 2xx con JSON sin ok:true ... no guardado.
 *  · otro estado, red o 30 s .... no guardado.
 *
 * Cada caso raro queda en los logs de Vercel con su motivo, sin datos
 * personales: ni el nombre ni el teléfono, sólo qué contestó Google.
 */
async function guardarEnHoja(datos: URLSearchParams): Promise<boolean> {
  let r: Response;
  try {
    r = await fetch(process.env.SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL, {
      method: 'POST',
      body: datos,
      redirect: 'follow',
      signal: AbortSignal.timeout(ESPERA_HOJA_MS),
    });
  } catch (e) {
    const nombre = e instanceof Error ? e.name : '';
    const motivo =
      nombre === 'TimeoutError' || nombre === 'AbortError'
        ? `tiempo agotado (${ESPERA_HOJA_MS / 1000} s)`
        : `error de red: ${e instanceof Error ? e.message : String(e)}`;
    console.error('Hoja: no guardado,', motivo);
    return false;
  }

  const respuesta = await r.text().catch(() => '');
  if (!r.ok) {
    console.error(`Hoja: no guardado, estado HTTP ${r.status}:`, respuesta.slice(0, 200));
    return false;
  }
  let json: unknown;
  try {
    json = JSON.parse(respuesta);
  } catch {
    console.error(`Hoja: estado ${r.status} con respuesta que no es JSON; se da por guardado:`, respuesta.slice(0, 200));
    return true;
  }
  if ((json as { ok?: unknown } | null)?.ok === true) return true;
  console.error(`Hoja: no guardado, JSON sin ok:true (estado ${r.status}):`, respuesta.slice(0, 200));
  return false;
}

export async function POST(req: NextRequest) {
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return responder(false, 400);
  }
  if (typeof cuerpo !== 'object' || cuerpo === null) return responder(false, 400);

  const texto = (k: string, max: number) => {
    const v = cuerpo[k];
    return typeof v === 'string' ? v.trim().slice(0, max) : '';
  };

  // Honeypot: un bot. Se le dice que sí y no se guarda nada.
  if (texto('website', 200)) return responder(true);

  const lead = Object.fromEntries(Object.entries(CAMPOS).map(([k, max]) => [k, texto(k, max)])) as Record<
    keyof typeof CAMPOS,
    string
  >;
  if (lead.nombre.length < 2 || !TELEFONO.test(lead.telefono) || !lead.event_id) {
    return responder(false, 400);
  }

  /* Los mismos parámetros que mandaba el navegador antes, incluido `objetivo`
     (la potencia con el nombre que lee el Apps Script publicado). */
  const datos = new URLSearchParams({ ...lead, objetivo: lead.potencia, website: '' });

  const guardado = await guardarEnHoja(datos);
  if (!guardado) return responder(false, 502);

  const url = texto('event_source_url', 300);
  const ts = Number(texto('fbclid_ts', 16));
  after(() =>
    enviarLeadCapi({
      eventId: lead.event_id,
      nombre: lead.nombre,
      telefono: lead.telefono,
      url: /^https?:\/\//.test(url) ? url : `${req.nextUrl.origin}/`,
      userAgent: req.headers.get('user-agent') ?? '',
      ip: ipDe(req),
      fbp: req.cookies.get('_fbp')?.value || texto('fbp', 120) || undefined,
      fbc: req.cookies.get('_fbc')?.value || texto('fbc', 300) || undefined,
      fbclid: texto('fbclid', 500) || undefined,
      fbclidTs: Number.isFinite(ts) && ts > 0 ? ts : undefined,
    }),
  );

  return responder(true);
}
