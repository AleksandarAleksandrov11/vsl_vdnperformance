/**
 * tracking.ts — TODA la medición de la landing pasa por aquí.
 *
 * Un único sitio donde mirar qué se mide, cuándo y con qué consentimiento.
 * No hay ninguna llamada a fbq fuera de este archivo.
 *
 * Eventos:
 *   Carga de página, o al aceptar ......... fbq('track', 'PageView')
 *   Responde el paso 1 del formulario ...... fbq('track', 'ViewContent', { content_name: 'Calculadora' })
 *                                            + fbq('trackCustom', 'FormStart') (se mantiene por
 *                                            si hay conversiones personalizadas que lo usan)
 *   Clic en cualquier enlace wa.me o tel: .. fbq('track', 'Contact', { content_category })
 *   Formulario guardado en la hoja (OK) .... fbq('track', 'Lead', {...}, { eventID })
 *
 * El eventID del Lead se genera con crypto.randomUUID() y viaja también a la
 * hoja (`event_id`) y a la API de Conversiones desde /api/lead/. Meta recibe el
 * mismo Lead por los dos caminos, ve el mismo ID y lo cuenta una sola vez.
 */

import { META_PIXEL_ID, SITE } from './config';
import { hasMarketingConsent, onConsentChange } from './consent';

type FbqArgs = unknown[];
interface Fbq {
  (...args: FbqArgs): void;
  callMethod?: (...args: FbqArgs) => void;
  queue: FbqArgs[];
  push: Fbq;
  loaded: boolean;
  version: string;
}

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let pixelInjected = false;
let pageViewSent = false;

/**
 * fbclid con el que llegó la visita desde el anuncio. Se guarda sólo en
 * memoria: hasta que la persona acepta no se escribe nada en su navegador.
 */
const fbclidEntrada =
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('fbclid') : null;

/** Cola de eventos disparados antes de tener consentimiento. */
type PendingEvent = { kind: 'track' | 'trackCustom'; name: string; params?: object; opts?: object };
const pending: PendingEvent[] = [];

/* ------------------------------------------------------------------ *
 * Carga del píxel — sólo se ejecuta con consentimiento de marketing.
 * ------------------------------------------------------------------ */

function injectPixel(): void {
  if (pixelInjected || typeof window === 'undefined') return;
  pixelInjected = true;

  /* Snippet oficial de Meta, con la cola que recoge los eventos disparados
     mientras fbevents.js todavía se está descargando. */
  const f = window;
  if (f.fbq) return;
  const n = function (...args: FbqArgs) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
  } as unknown as Fbq;
  n.queue = [];
  n.loaded = true;
  n.version = '2.0';
  n.push = n;
  f.fbq = n;
  f._fbq = n;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq?.('init', META_PIXEL_ID);
}

/* ------------------------------------------------------------------ *
 * Cookies de Meta
 * ------------------------------------------------------------------ */

function leerCookie(nombre: string): string | undefined {
  const m = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/**
 * Con consentimiento, guarda el fbclid del anuncio en la cookie _fbc, con el
 * formato de Meta: fb.<índice de dominio>.<ms de creación>.<fbclid>. Se pone en
 * el dominio raíz (.vdnperformance.com, índice 1) y dura 90 días, como la que
 * crea el píxel. Si ya hay una con ese mismo fbclid, no se toca.
 */
function guardarFbc(): void {
  if (!fbclidEntrada) return;
  const actual = leerCookie('_fbc');
  if (actual?.endsWith(`.${fbclidEntrada}`)) return;
  const host = window.location.hostname;
  const raiz = host.split('.').slice(-2).join('.');
  const conDominio = host.includes('.') && !/^\d+(\.\d+){3}$/.test(host);
  const valor = `fb.${conDominio ? 1 : 0}.${Date.now()}.${fbclidEntrada}`;
  document.cookie =
    `_fbc=${valor}; Max-Age=7776000; Path=/; SameSite=Lax` +
    (conDominio ? `; Domain=.${raiz}` : '') +
    (window.location.protocol === 'https:' ? '; Secure' : '');
}

/** fbp y fbc para la API de Conversiones. Vacíos si no hay consentimiento. */
export function datosMedicion(): { marketing: boolean; fbp?: string; fbc?: string } {
  if (typeof window === 'undefined' || !hasMarketingConsent()) return { marketing: false };
  return { marketing: true, fbp: leerCookie('_fbp'), fbc: leerCookie('_fbc') };
}

function send(ev: PendingEvent): void {
  const fbq = window.fbq;
  if (!fbq) return;
  if (ev.opts) fbq(ev.kind, ev.name, ev.params ?? {}, ev.opts);
  else if (ev.params) fbq(ev.kind, ev.name, ev.params);
  else fbq(ev.kind, ev.name);
}

/**
 * Dispara un evento si hay consentimiento. Si no lo hay, lo guarda: si el
 * usuario acepta más tarde, se envía entonces y no se pierde la conversión.
 */
function emit(ev: PendingEvent): void {
  if (typeof window === 'undefined') return;
  if (!hasMarketingConsent()) {
    pending.push(ev);
    return;
  }
  injectPixel();
  send(ev);
}

function flushPending(): void {
  while (pending.length) {
    const ev = pending.shift();
    if (ev) send(ev);
  }
}

/* ------------------------------------------------------------------ *
 * Arranque
 * ------------------------------------------------------------------ */

/**
 * Se llama una vez desde el layout. Si ya hay consentimiento, carga el píxel y
 * manda el PageView. Si no, se queda escuchando: en cuanto el usuario acepta,
 * carga el píxel en ese momento y vacía la cola.
 */
export function initTracking(): () => void {
  if (typeof window === 'undefined') return () => {};

  const start = () => {
    if (!hasMarketingConsent()) return;
    guardarFbc();
    injectPixel();
    if (!pageViewSent) {
      pageViewSent = true;
      send({ kind: 'track', name: 'PageView' });
    }
    flushPending();
  };

  /* Contact en un solo sitio: cualquier enlace a WhatsApp o a un teléfono de
     cualquier página, sin tener que acordarse de ponerlo en cada botón. Va en
     fase de captura para medir el clic aunque el enlace abra otra app. */
  const alClicar = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.('a[href]');
    const href = a?.getAttribute('href') ?? '';
    if (href.startsWith('tel:')) trackContact('telefono');
    else if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) trackContact('whatsapp');
  };
  document.addEventListener('click', alClicar, true);

  start();
  const dejar = onConsentChange((c) => {
    if (c.marketing) start();
  });
  return () => {
    dejar();
    document.removeEventListener('click', alClicar, true);
  };
}

/* ------------------------------------------------------------------ *
 * Eventos de la landing
 * ------------------------------------------------------------------ */

/** El usuario contesta la primera pregunta: empieza la calculadora. */
export function trackFormStart(): void {
  emit({ kind: 'track', name: 'ViewContent', params: { content_name: 'Calculadora' } });
  emit({ kind: 'trackCustom', name: 'FormStart' });
}

/** Clic en cualquier enlace de WhatsApp o de teléfono (lo llama initTracking). */
function trackContact(canal: 'whatsapp' | 'telefono'): void {
  emit({ kind: 'track', name: 'Contact', params: { content_category: canal } });
}

/** Formulario guardado en la hoja. `eventId` es el mismo de la hoja y de la CAPI. */
export function trackLead(eventId: string): void {
  emit({
    kind: 'track',
    name: 'Lead',
    params: {
      content_name: 'Presupuesto reprogramación',
      value: SITE.precioStage1,
      currency: 'EUR',
    },
    opts: { eventID: eventId },
  });
}

/** ID único del Lead, compartido entre el píxel y la hoja de cálculo. */
export function nuevoEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Respaldo para navegadores sin randomUUID (o sin contexto seguro).
  return `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
