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
 * Manda el lead al Apps Script.
 *
 * `mode: 'no-cors'` + `URLSearchParams` a propósito: Apps Script no devuelve
 * cabeceras CORS, así que con JSON el navegador haría un preflight OPTIONS que
 * Google rechaza. Con un cuerpo de formulario no hay preflight, Apps Script lo
 * lee en `e.parameter` y el POST llega. A cambio la respuesta es opaca: no se
 * puede saber si la hoja lo guardó, sólo si la petición salió del navegador.
 *
 * Por eso la pantalla final se enseña siempre: si algo falla, el usuario ve el
 * botón de WhatsApp como camino principal y el lead no se pierde.
 */
export async function enviarLead(lead: Lead): Promise<{ ok: boolean }> {
  /* `objetivo` es la potencia otra vez, con el nombre que espera el Apps Script
     publicado: su columna "Potencia de serie" lee ese campo, no `potencia`.
     Se mandan los dos para no depender de qué versión del script esté
     desplegada; el que no se use, el script lo ignora. */
  const datos = new URLSearchParams({ ...lead, objetivo: lead.potencia, ...leerUtm() });

  /* Con cobertura mala una petición se puede quedar colgada minutos. Ocho
     segundos y se corta: es mejor enseñar la pantalla final con el botón de
     WhatsApp que dejar a alguien mirando un "Enviando...". */
  const corte = AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined;

  try {
    await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: datos,
      signal: corte,
      keepalive: true,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
