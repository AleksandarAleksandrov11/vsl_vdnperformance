/**
 * capi.ts: API de Conversiones de Meta (servidor). Sólo se usa desde
 * /api/lead/: nunca llega al navegador.
 *
 * Se manda un Lead por cada presupuesto que la hoja confirma, haya o no
 * consentimiento de cookies: es la única forma de que Meta cuente todos los
 * leads. Qué va, exactamente:
 *   event_name ........ "Lead"
 *   event_id .......... el mismo que el Lead del píxel: Meta junta los dos y
 *                       lo cuenta una sola vez (deduplicación)
 *   event_time ........ segundos Unix del envío
 *   action_source ..... "website"
 *   event_source_url .. la página desde la que se envió, sin parámetros
 *   user_data.ph ...... SHA-256 del teléfono internacional sin + ni espacios
 *                       ("34611223344", "351912345678")
 *   user_data.external_id  SHA-256 del mismo teléfono
 *   user_data.fn ...... SHA-256 del nombre en minúsculas
 *   user_data.ln ...... SHA-256 de los apellidos, sólo si los escribió
 *   user_data.country . SHA-256 del país del prefijo ("es" por defecto)
 *   user_data.client_ip_address  la IP de la petición, sin hashear
 *   user_data.client_user_agent  el navegador: Meta lo exige en eventos web
 *   user_data.fbp ..... cookie _fbp del píxel, si existe (sin hashear)
 *   user_data.fbc ..... cookie _fbc o, si sólo hay fbclid, construida aquí
 *                       como fb.1.<ms del primer clic>.<fbclid> (sin hashear)
 *   custom_data ....... content_name. Sin valor ni moneda.
 *
 * Además, /api/evento/ manda PageView y ViewContent de todas las visitas
 * (eventoNavegacion): sólo IP, navegador, fbp, fbc y la URL, con el mismo
 * event_id que el píxel.
 *
 * Nada más: ni el coche ni los UTM. No hay email en el formulario, así que no
 * se manda; si algún día lo hay, va en `em` también hasheado.
 *
 * Sólo se llama si está configurado META_CAPI_TOKEN en Vercel. Sin token, no
 * hace nada y el resto funciona igual.
 */

import { createHash } from 'node:crypto';
import { META_PIXEL_ID } from './config';
import { paisDeNumero } from './prefijos';

const sha256 = (v: string) => createHash('sha256').update(v, 'utf8').digest('hex');

/** Normalización que pide Meta antes de hashear: minúsculas, sin signos. */
function normalizaTexto(v: string): string {
  return v
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim();
}

/**
 * Teléfono tal y como lo guarda la hoja -> formato internacional, sólo dígitos.
 *   "611223344" (9 dígitos, España) -> "34611223344"
 *   "+351912345678" -> "351912345678"
 *   "0034611223344" -> "34611223344"
 */
export function normalizaTelefonoMeta(tel: string): string | null {
  let d = tel.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 9 && /^[6-9]/.test(d)) d = `34${d}`;
  if (d.startsWith('34')) return /^34[6-9]\d{8}$/.test(d) ? d : null;
  return d.length >= 7 && d.length <= 18 ? d : null;
}

export type DatosLeadCapi = {
  eventId: string;
  nombre: string;
  telefono: string;
  url: string;
  userAgent: string;
  ip?: string;
  fbp?: string;
  fbc?: string;
  /** fbclid del anuncio y ms del primer clic, para construir fbc si no hay cookie. */
  fbclid?: string;
  fbclidTs?: number;
};

/** fbc válido: el de la cookie o el del cuerpo; si no, construido desde el fbclid. */
export function fbcDe(d: Pick<DatosLeadCapi, 'fbc' | 'fbclid' | 'fbclidTs'>, ahora = Date.now()): string | undefined {
  if (d.fbc && /^fb\.\d\.\d+\..+/.test(d.fbc)) return d.fbc;
  if (d.fbclid) {
    const ts = d.fbclidTs && d.fbclidTs > 0 && d.fbclidTs <= ahora ? d.fbclidTs : ahora;
    return `fb.1.${ts}.${d.fbclid}`;
  }
  return undefined;
}

/** Construye el evento tal cual se manda. Separado para poder probarlo. */
export function eventoLead(d: DatosLeadCapi, ahora = Date.now()) {
  const partes = normalizaTexto(d.nombre).split(/\s+/).filter(Boolean);
  const tel = normalizaTelefonoMeta(d.telefono);
  const pais = (tel && paisDeNumero(tel)) || 'es';

  const user_data: Record<string, unknown> = {
    client_user_agent: d.userAgent.slice(0, 512),
    country: [sha256(pais)],
  };
  if (d.ip) user_data.client_ip_address = d.ip;
  if (tel) {
    user_data.ph = [sha256(tel)];
    user_data.external_id = [sha256(tel)];
  }
  if (partes[0]) user_data.fn = [sha256(partes[0])];
  if (partes.length > 1) user_data.ln = [sha256(partes.slice(1).join(' '))];
  if (d.fbp) user_data.fbp = d.fbp;
  const fbc = fbcDe(d, ahora);
  if (fbc) user_data.fbc = fbc;

  return {
    event_name: 'Lead',
    event_time: Math.floor(ahora / 1000),
    event_id: d.eventId,
    action_source: 'website',
    event_source_url: d.url,
    user_data,
    custom_data: { content_name: 'Presupuesto reprogramación' },
  };
}

/* ------------------------------------------------------------------ *
 * Visitas: PageView y ViewContent por servidor (/api/evento/)
 * ------------------------------------------------------------------ */

/** Los únicos eventos que acepta /api/evento/. */
export const EVENTOS_NAVEGACION = ['PageView', 'ViewContent'] as const;
export type EventoNavegacion = (typeof EVENTOS_NAVEGACION)[number];

export type DatosNavegacionCapi = {
  nombre: EventoNavegacion;
  eventId: string;
  url: string;
  userAgent: string;
  ip?: string;
  fbp?: string;
  fbc?: string;
  fbclid?: string;
  fbclidTs?: number;
};

/**
 * PageView o ViewContent tal cual se manda. Sin datos del formulario: sólo
 * IP, navegador, fbp y fbc, para que Meta case la visita con el clic.
 */
export function eventoNavegacion(d: DatosNavegacionCapi, ahora = Date.now()) {
  const user_data: Record<string, unknown> = { client_user_agent: d.userAgent.slice(0, 512) };
  if (d.ip) user_data.client_ip_address = d.ip;
  if (d.fbp) user_data.fbp = d.fbp;
  const fbc = fbcDe(d, ahora);
  if (fbc) user_data.fbc = fbc;
  return {
    event_name: d.nombre,
    event_time: Math.floor(ahora / 1000),
    event_id: d.eventId,
    action_source: 'website',
    event_source_url: d.url,
    user_data,
    ...(d.nombre === 'ViewContent' ? { custom_data: { content_name: 'Calculadora' } } : {}),
  };
}

/* ------------------------------------------------------------------ *
 * Envío
 * ------------------------------------------------------------------ */

/** true si hay token: sin él no se llama nunca a Meta. */
export const capiActiva = () => Boolean(process.env.META_CAPI_TOKEN);

/**
 * Manda un evento a la API de Conversiones. Nunca lanza: si Meta falla, sólo
 * queda constancia en el log de Vercel. Sin META_CAPI_TOKEN no hace nada.
 */
export async function enviarCapi(evento: { event_name: string }): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return;

  const base = process.env.META_GRAPH_URL || 'https://graph.facebook.com/v23.0';
  const cuerpo: Record<string, unknown> = { data: [evento] };
  if (process.env.META_TEST_EVENT_CODE) cuerpo.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    const r = await fetch(`${base}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(8000),
    });
    /* console.error y no console.log: en producción el compilador quita todos
       los console menos error, y así queda en los logs de Vercel si Meta lo
       aceptó o no. */
    if (!r.ok) console.error('CAPI', evento.event_name, r.status, (await r.text()).slice(0, 300));
    else console.error('CAPI ok', evento.event_name, r.status);
  } catch (e) {
    console.error('CAPI', evento.event_name, e instanceof Error ? e.message : e);
  }
}

/** El Lead del formulario (lo llama /api/lead/). */
export async function enviarLeadCapi(d: DatosLeadCapi): Promise<void> {
  await enviarCapi(eventoLead(d));
}
