/**
 * leads.ts: captura de UTM y fbclid, y envío del formulario a /api/lead/.
 */

import { SHEETS_WEBHOOK_URL } from './config';

const UTM_KEY = 'vdn.utm.v1';
const CLIC_KEY = 'vdn.clic.v1';

export type Utm = {
  utm_source: string;
  utm_campaign: string;
  utm_content: string;
};

/** fbclid del anuncio y ms del primer clic con ese fbclid. */
export type Clic = { fbclid: string; ts: number };

const VACIO: Utm = { utm_source: '', utm_campaign: '', utm_content: '' };

function leerJson<T>(clave: string): T | null {
  try {
    const v = window.sessionStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function guardarJson(clave: string, valor: unknown): void {
  try {
    window.sessionStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sessionStorage bloqueado: seguimos con lo que haya en memoria. */
  }
}

/**
 * Guarda los UTM y el fbclid en cuanto llega la visita, en sessionStorage.
 * Es almacenamiento propio y necesario para atender la solicitud (saber de qué
 * anuncio viene el presupuesto), así que no depende del consentimiento.
 *
 * · Si la persona recarga, va a una legal y vuelve, o el navegador de Instagram
 *   restaura la página sin parámetros, los UTM siguen ahí.
 * · Unos UTM buenos nunca se sobrescriben con vacíos: sólo se cambian si la URL
 *   trae otros.
 * · El fbclid se guarda con la hora del primer clic; si llega otro distinto, se
 *   cambia por el nuevo con su hora.
 */
export function capturarUtm(): Utm {
  if (typeof window === 'undefined') return VACIO;

  const params = new URLSearchParams(window.location.search);
  const deLaUrl: Utm = {
    utm_source: params.get('utm_source') ?? '',
    utm_campaign: params.get('utm_campaign') ?? '',
    utm_content: params.get('utm_content') ?? '',
  };
  if (Object.values(deLaUrl).some(Boolean)) guardarJson(UTM_KEY, deLaUrl);

  const fbclid = params.get('fbclid');
  if (fbclid && leerJson<Clic>(CLIC_KEY)?.fbclid !== fbclid) {
    guardarJson(CLIC_KEY, { fbclid, ts: Date.now() } satisfies Clic);
  }
  return leerUtm();
}

/**
 * Lo mismo que capturarUtm, como script en línea para el <head>: corre en
 * cuanto llega la página, antes de que cargue React. Si la persona recarga o
 * se va antes de que la web termine de cargar, los UTM ya están guardados.
 * Tiene que ser ES5 y no puede fallar.
 */
export function scriptCapturaVisita(): string {
  return `(function(){try{var q=new URLSearchParams(location.search),s=sessionStorage,u={utm_source:q.get('utm_source')||'',utm_campaign:q.get('utm_campaign')||'',utm_content:q.get('utm_content')||''};
if(u.utm_source||u.utm_campaign||u.utm_content)s.setItem('${UTM_KEY}',JSON.stringify(u));
var f=q.get('fbclid'),c=JSON.parse(s.getItem('${CLIC_KEY}')||'null');
if(f&&(!c||c.fbclid!==f))s.setItem('${CLIC_KEY}',JSON.stringify({fbclid:f,ts:Date.now()}))}catch(e){}})()`;
}

export function leerUtm(): Utm {
  if (typeof window === 'undefined') return VACIO;
  return { ...VACIO, ...(leerJson<Partial<Utm>>(UTM_KEY) ?? {}) };
}

/** El fbclid con el que llegó la visita en esta sesión, si llegó con uno. */
export function leerClic(): Clic | null {
  if (typeof window === 'undefined') return null;
  const c = leerJson<Clic>(CLIC_KEY);
  return c && typeof c.fbclid === 'string' && c.fbclid ? c : null;
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

/**
 * Lo que el navegador añade para la API de Conversiones. /api/lead/ lo usa
 * para la CAPI y no lo reenvía nunca a la hoja.
 */
export type ExtraMedicion = { consent_marketing: boolean; fbp?: string; fbc?: string };

/**
 * Manda el lead a /api/lead/, que lo reenvía al Apps Script y contesta si la
 * hoja lo guardó de verdad.
 */
export async function enviarLead(lead: Lead, extra: ExtraMedicion): Promise<ResultadoEnvio> {
  const clic = leerClic();
  const cuerpo = {
    ...lead,
    ...leerUtm(),
    fbclid: clic?.fbclid ?? '',
    fbclid_ts: clic ? String(clic.ts) : '',
    fbc: extra.fbc ?? '',
    fbp: extra.fbp ?? '',
    consent_marketing: extra.consent_marketing,
    event_source_url: `${window.location.origin}${window.location.pathname}`,
  };

  /* Con mala cobertura una petición se puede quedar colgada minutos. El Apps
     Script suele tardar de 2 a 8 segundos, pero el servidor le espera hasta
     30; aquí se esperan 35 para no cortar antes que él. */
  const corte = AbortSignal.timeout ? AbortSignal.timeout(35000) : undefined;

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
