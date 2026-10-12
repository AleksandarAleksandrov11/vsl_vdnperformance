/**
 * leads.ts — captura de UTM y envío del formulario a Google Sheets.
 */

import { SHEETS_WEBHOOK_URL } from './config';

const UTM_KEY = 'vdn.utm.v1';

export type Utm = {
  utm_source: string;
  utm_campaign: string;
  utm_content: string;
};

const VACIO: Utm = { utm_source: '', utm_campaign: '', utm_content: '' };

/**
 * Lee los UTM de la URL al entrar y los guarda en sessionStorage.
 * El usuario navega dentro de la landing (aviso legal, privacidad y vuelta)
 * y el origen del anuncio no se pierde por el camino.
 * Si la URL no trae UTM, se conservan los de la primera visita de la sesión.
 */
export function capturarUtm(): Utm {
  if (typeof window === 'undefined') return VACIO;

  const params = new URLSearchParams(window.location.search);
  const deLaUrl: Utm = {
    utm_source: params.get('utm_source') ?? '',
    utm_campaign: params.get('utm_campaign') ?? '',
    utm_content: params.get('utm_content') ?? '',
  };

  const traeAlgo = Object.values(deLaUrl).some(Boolean);
  try {
    if (traeAlgo) {
      window.sessionStorage.setItem(UTM_KEY, JSON.stringify(deLaUrl));
      return deLaUrl;
    }
    const guardado = window.sessionStorage.getItem(UTM_KEY);
    if (guardado) return { ...VACIO, ...(JSON.parse(guardado) as Partial<Utm>) };
  } catch {
    // sessionStorage bloqueado: seguimos con lo que traiga la URL.
  }
  return deLaUrl;
}

export function leerUtm(): Utm {
  if (typeof window === 'undefined') return VACIO;
  try {
    const guardado = window.sessionStorage.getItem(UTM_KEY);
    if (guardado) return { ...VACIO, ...(JSON.parse(guardado) as Partial<Utm>) };
  } catch {
    /* sin acceso a sessionStorage */
  }
  return VACIO;
}

export type Lead = {
  nombre: string;
  telefono: string;
  modelo: string;
  anio: string;
  motor: string;
  potencia: string;
  event_id: string;
  /** Honeypot: si viene relleno, lo ha escrito un bot. */
  website: string;
};

/**
 * Resultado del envío:
 *  · 'ok' ............. la hoja confirmó que lo guardó. Sólo entonces sale el Lead.
 *  · 'sin-confirmar' .. /api/lead/ no existe (un despliegue sin la función):
 *                       se manda directo a la hoja como antes, pero no hay
 *                       forma de saber si llegó, así que no se mide Lead.
 *  · 'error' .......... sin red, se cortó o la hoja falló. El formulario avisa
 *                       y la persona puede volver a enviar sin reescribir nada.
 */
export type ResultadoEnvio = 'ok' | 'sin-confirmar' | 'error';

/** Lo que el navegador añade para la API de Conversiones (sólo con consentimiento). */
export type ExtraMedicion = { marketing: boolean; fbp?: string; fbc?: string };

/**
 * Manda el lead a /api/lead/, que lo reenvía al Apps Script y contesta si la
 * hoja lo guardó de verdad.
 */
export async function enviarLead(lead: Lead, extra: ExtraMedicion): Promise<ResultadoEnvio> {
  const cuerpo = {
    ...lead,
    ...leerUtm(),
    ...extra,
    url: `${window.location.origin}${window.location.pathname}`,
  };

  /* Con mala cobertura una petición se puede quedar colgada minutos. El Apps
     Script tarda de 2 a 8 segundos; a los 25 se da por perdida y se avisa. */
  const corte = AbortSignal.timeout ? AbortSignal.timeout(25000) : undefined;

  try {
    const r = await fetch('/api/lead/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: corte,
    });
    if (r.status === 404 || r.status === 405) return enviarDirecto(lead);
    const json = (await r.json().catch(() => null)) as { ok?: boolean } | null;
    return r.ok && json?.ok === true ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

/**
 * Plan B, el envío de antes: directo al Apps Script con `mode: 'no-cors'`.
 * Apps Script no devuelve cabeceras CORS, así que la respuesta llega opaca:
 * sólo se sabe que la petición salió, no si la hoja la guardó.
 */
async function enviarDirecto(lead: Lead): Promise<ResultadoEnvio> {
  const datos = new URLSearchParams({ ...lead, objetivo: lead.potencia, ...leerUtm() });
  try {
    await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: datos,
      signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
      keepalive: true,
    });
    return 'sin-confirmar';
  } catch {
    return 'error';
  }
}
