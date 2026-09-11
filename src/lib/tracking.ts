/**
 * tracking.ts — TODA la medición de la landing pasa por aquí.
 *
 * Un único sitio donde mirar qué se mide, cuándo y con qué consentimiento.
 * No hay ninguna llamada a fbq fuera de este archivo.
 *
 * Eventos:
 *   Carga de página (con consentimiento) ... fbq('track', 'PageView')
 *   Responde el paso 1 del formulario ...... fbq('trackCustom', 'FormStart')
 *   Clic en WhatsApp o en el teléfono ...... fbq('track', 'Contact')
 *   Formulario enviado .................... fbq('track', 'Lead', {...}, { eventID })
 *
 * El eventID del Lead se genera con crypto.randomUUID() y viaja también a la
 * hoja de cálculo como `event_id`. Así, el día que se conecte la API de
 * Conversiones desde el servidor, Meta puede deduplicar el mismo Lead recibido
 * por los dos caminos y no se cuenta dos veces.
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
    injectPixel();
    if (!pageViewSent) {
      pageViewSent = true;
      send({ kind: 'track', name: 'PageView' });
    }
    flushPending();
  };

  start();
  return onConsentChange((c) => {
    if (c.marketing) start();
  });
}

/* ------------------------------------------------------------------ *
 * Eventos de la landing
 * ------------------------------------------------------------------ */

/** El usuario contesta la primera pregunta del formulario. */
export function trackFormStart(): void {
  emit({ kind: 'trackCustom', name: 'FormStart' });
}

/** Clic en cualquier enlace de WhatsApp o de teléfono. */
export function trackContact(canal: 'whatsapp' | 'telefono'): void {
  emit({ kind: 'track', name: 'Contact', params: { content_category: canal } });
}

/** Formulario enviado. `eventId` es el mismo que se guarda en la hoja. */
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
