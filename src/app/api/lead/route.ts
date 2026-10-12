/**
 * POST /api/lead/ — recibe el presupuesto del formulario.
 *
 * 1. Lo reenvía al Apps Script de la hoja y lee su respuesta. Desde el
 *    navegador eso no se puede (la respuesta de Google llega opaca); desde
 *    aquí sí, así que la web sabe de verdad si el lead se guardó.
 * 2. Responde { ok: true } sólo si la hoja contestó { ok: true }. Es lo que
 *    decide si el navegador dispara el Lead del píxel.
 * 3. Con la respuesta ya enviada, y sólo si hubo consentimiento de marketing,
 *    manda el mismo Lead (mismo event_id) a la API de Conversiones.
 */

import { after, type NextRequest } from 'next/server';
import { SHEETS_WEBHOOK_URL } from '@/lib/config';
import { enviarLeadCapi } from '@/lib/capi';

export const runtime = 'nodejs';

/** Campos que se reenvían a la hoja, con su largo máximo. */
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

const responder = (ok: boolean, status = 200) => Response.json({ ok }, { status });

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
  if (lead.nombre.length < 2 || !/^\d{9}$/.test(lead.telefono) || !lead.event_id) {
    return responder(false, 400);
  }

  /* Los mismos parámetros que mandaba el navegador antes, incluido `objetivo`
     (la potencia con el nombre que lee el Apps Script antiguo). */
  const datos = new URLSearchParams({ ...lead, objetivo: lead.potencia, website: '' });

  let guardado = false;
  try {
    const r = await fetch(process.env.SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL, {
      method: 'POST',
      body: datos,
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    const respuesta = await r.text();
    guardado = r.ok && JSON.parse(respuesta)?.ok === true;
  } catch (e) {
    console.error('Hoja', e instanceof Error ? e.message : e);
  }
  if (!guardado) return responder(false, 502);

  if (cuerpo.marketing === true) {
    const url = texto('url', 300);
    after(() =>
      enviarLeadCapi({
        eventId: lead.event_id,
        nombre: lead.nombre,
        telefono: lead.telefono,
        url: /^https?:\/\//.test(url) ? url : `${req.nextUrl.origin}/`,
        userAgent: req.headers.get('user-agent') ?? '',
        fbp: req.cookies.get('_fbp')?.value || texto('fbp', 120) || undefined,
        fbc: req.cookies.get('_fbc')?.value || texto('fbc', 300) || undefined,
      }),
    );
  }

  return responder(true);
}
