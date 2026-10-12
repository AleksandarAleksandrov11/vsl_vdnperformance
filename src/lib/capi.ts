/**
 * capi.ts — API de Conversiones de Meta (servidor). Sólo se usa desde
 * /api/lead/: nunca llega al navegador.
 *
 * Qué se manda a Meta, exactamente, por cada Lead:
 *   event_name ........ "Lead"
 *   event_id .......... el mismo que el Lead del píxel: Meta junta los dos y
 *                       lo cuenta una sola vez (deduplicación)
 *   event_time ........ segundos Unix del envío
 *   action_source ..... "website"
 *   event_source_url .. la página desde la que se envió, sin parámetros
 *   user_data.ph ...... SHA-256 del teléfono con prefijo: "34611223344"
 *   user_data.fn ...... SHA-256 del nombre en minúsculas
 *   user_data.ln ...... SHA-256 de los apellidos, sólo si los escribió
 *   user_data.fbp ..... cookie _fbp del píxel (no se hashea: Meta la quiere así)
 *   user_data.fbc ..... cookie _fbc del clic en el anuncio (tampoco se hashea)
 *   user_data.client_user_agent  el navegador: Meta lo exige en eventos web
 *   custom_data ....... content_name, value y currency, como el píxel
 *
 * Nada más: ni la IP, ni el coche, ni los UTM. No hay email en el formulario,
 * así que no se manda; si algún día lo hay, va en `em` también hasheado.
 *
 * Sólo se llama si la persona aceptó las cookies de marketing y si está
 * configurado META_CAPI_TOKEN en Vercel. Sin token, no hace nada.
 */

import { createHash } from 'node:crypto';
import { META_PIXEL_ID, SITE } from './config';

const sha256 = (v: string) => createHash('sha256').update(v, 'utf8').digest('hex');

/** Normalización que pide Meta antes de hashear: minúsculas, sin signos. */
function normalizaTexto(v: string): string {
  return v
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim();
}

/** "611 22 33 44" o "+34611223344" -> "34611223344". */
export function normalizaTelefonoMeta(tel: string): string | null {
  let d = tel.replace(/\D/g, '');
  if (d.startsWith('0034')) d = d.slice(2);
  if (d.length === 9) d = `34${d}`;
  return /^34[6-9]\d{8}$/.test(d) ? d : null;
}

export type DatosLeadCapi = {
  eventId: string;
  nombre: string;
  telefono: string;
  url: string;
  userAgent: string;
  fbp?: string;
  fbc?: string;
};

/** Construye el evento tal cual se manda. Separado para poder probarlo. */
export function eventoLead(d: DatosLeadCapi, ahora = Date.now()) {
  const partes = normalizaTexto(d.nombre).split(/\s+/).filter(Boolean);
  const tel = normalizaTelefonoMeta(d.telefono);

  const user_data: Record<string, unknown> = {
    client_user_agent: d.userAgent.slice(0, 512),
  };
  if (tel) user_data.ph = [sha256(tel)];
  if (partes[0]) user_data.fn = [sha256(partes[0])];
  if (partes.length > 1) user_data.ln = [sha256(partes.slice(1).join(' '))];
  if (d.fbp) user_data.fbp = d.fbp;
  if (d.fbc) user_data.fbc = d.fbc;

  return {
    event_name: 'Lead',
    event_time: Math.floor(ahora / 1000),
    event_id: d.eventId,
    action_source: 'website',
    event_source_url: d.url,
    user_data,
    custom_data: {
      content_name: 'Presupuesto reprogramación',
      value: SITE.precioStage1,
      currency: 'EUR',
    },
  };
}

/**
 * Manda el Lead a Meta. Nunca lanza: si Meta falla, el presupuesto ya está en
 * la hoja y el píxel ya lo midió; sólo se deja constancia en el log de Vercel.
 */
export async function enviarLeadCapi(d: DatosLeadCapi): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return;

  const base = process.env.META_GRAPH_URL || 'https://graph.facebook.com/v23.0';
  const cuerpo: Record<string, unknown> = { data: [eventoLead(d)] };
  if (process.env.META_TEST_EVENT_CODE) cuerpo.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    const r = await fetch(`${base}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) console.error('CAPI', r.status, (await r.text()).slice(0, 300));
  } catch (e) {
    console.error('CAPI', e instanceof Error ? e.message : e);
  }
}
