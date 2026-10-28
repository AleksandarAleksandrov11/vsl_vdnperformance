/**
 * tracking.ts: TODA la medición del navegador pasa por aquí.
 *
 * Un único sitio donde mirar qué se mide, cuándo y con qué consentimiento.
 * No hay ninguna llamada a fbq fuera de este archivo. El píxel sólo se carga
 * con consentimiento de marketing (consent.ts); el Lead de servidor (CAPI) lo
 * manda /api/lead/ para todos los leads, con o sin consentimiento.
 *
 * Eventos del píxel:
 *   Carga de página, o al aceptar ......... PageView
 *   Contesta la primera pregunta ........... ViewContent { content_name: 'Calculadora' }
 *                                            (se encola sin consentimiento, como siempre)
 *   Contesta la primera pregunta ........... FormStart, una vez por sesión
 *   Completa cada paso ..................... FormStep { step }, una vez por paso
 *   Error de validación .................... FormError { step, field }
 *     (los tres Form* sólo con el píxel cargado: sin consentimiento no se encolan)
 *   La hoja confirma el presupuesto ........ Lead { content_name } con eventID,
 *                                            una sola vez por event_id, sin valor
 *   WhatsApp tras enviar ................... Contact { content_category:
 *                                            'gracias-auto' | 'gracias-boton' | 'error-envio' }
 *
 * El event_id del Lead nace al empezar el formulario y viaja a la hoja
 * (`event_id`), al Lead del píxel (eventID) y a la CAPI. Meta recibe el mismo
 * Lead por los dos caminos, ve el mismo ID y lo cuenta una sola vez.
 */

import { META_PIXEL_ID } from './config';
import { hasMarketingConsent, onConsentChange } from './consent';
import { capturarUtm, leerClic } from './leads';

type FbqArgs = unknown[];
interface Fbq {
  (...args: FbqArgs): void;
  callMethod?: (...args: FbqArgs) => void;
  queue: FbqArgs[];
  push: Fbq;
  loaded: boolean;
  version: string;
  disablePushState?: boolean;
}

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let pixelInjected = false;
let pageViewSent = false;

/** Datos de coincidencia avanzada para el init del píxel, ya normalizados. */
export type UsuarioPixel = { ph: string; fn?: string; country: string };

/** Cola de eventos disparados antes de tener consentimiento. */
type PendingEvent = {
  kind: 'track' | 'trackCustom';
  name: string;
  params?: object;
  opts?: object;
  usuario?: UsuarioPixel;
};
const pending: PendingEvent[] = [];

/* ------------------------------------------------------------------ *
 * Memoria de la sesión: qué se ha medido ya
 * ------------------------------------------------------------------ */

const LEADS_KEY = 'vdn.leads.v1';
const FORMSTART_KEY = 'vdn.formstart.v1';
const PASOS_KEY = 'vdn.pasos.v1';

function leerLista(clave: string): string[] {
  try {
    const v = JSON.parse(window.sessionStorage.getItem(clave) ?? '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function anadirALista(clave: string, valor: string): void {
  try {
    const lista = leerLista(clave);
    if (!lista.includes(valor)) window.sessionStorage.setItem(clave, JSON.stringify([...lista, valor]));
  } catch {
    /* sin sessionStorage: queda la memoria de esta página */
  }
}

/** event_id ya medidos (enviados o en cola). Ni un doble envío ni la cola los duplican. */
const leadsMedidos = new Set<string>();
/** Pasos del embudo ya medidos en esta sesión. */
const pasosMedidos = new Set<string>();

/* ------------------------------------------------------------------ *
 * Carga del píxel: sólo se ejecuta con consentimiento de marketing.
 * ------------------------------------------------------------------ */

function injectPixel(): void {
  if (pixelInjected || typeof window === 'undefined') return;
  pixelInjected = true;

  /* Snippet oficial de Meta, con la cola que recoge los eventos disparados
     mientras fbevents.js todavía se está descargando. */
  const f = window;
  if (f.fbq) return;
  const n = function (...args: FbqArgs) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue.push(args);
  } as unknown as Fbq;
  n.queue = [];
  n.loaded = true;
  n.version = '2.0';
  n.push = n;
  /* Sin esto, el píxel manda otro PageView cada vez que cambia la URL, y
     cada botón "Calcular" (un enlace a #presupuesto) la cambia. */
  n.disablePushState = true;
  f.fbq = n;
  f._fbq = n;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  /* Sin autoConfig, el píxel no mide clics ni datos de la página por su cuenta:
     sólo los eventos que se mandan desde aquí. Tiene que ir antes del init. */
  window.fbq?.('set', 'autoConfig', false, META_PIXEL_ID);
  window.fbq?.('init', META_PIXEL_ID);
}

/** true si el píxel está cargado (o se puede cargar ya, porque hay consentimiento). */
function pixelDisponible(): boolean {
  if (typeof window === 'undefined' || !hasMarketingConsent()) return false;
  injectPixel();
  return !!window.fbq;
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
 * formato de Meta: fb.<índice de dominio>.<ms del primer clic>.<fbclid>.
 *
 * Dominio: el raíz del host. En producción, www.vdnperformance.com, la cookie
 * queda en `.vdnperformance.com` (índice 1), y vale para www y para el dominio
 * sin www. Dura 90 días, como la que crea el píxel. Si ya hay una con ese mismo
 * fbclid, no se toca. Sin consentimiento no se escribe ninguna cookie: el
 * fbclid sólo está en sessionStorage y la CAPI construye el fbc en el servidor.
 */
function guardarFbc(): void {
  const clic = leerClic();
  if (!clic) return;
  const actual = leerCookie('_fbc');
  if (actual?.endsWith(`.${clic.fbclid}`)) return;
  const host = window.location.hostname;
  const raiz = host.split('.').slice(-2).join('.');
  const conDominio = host.includes('.') && !/^\d+(\.\d+){3}$/.test(host);
  const valor = `fb.${conDominio ? 1 : 0}.${clic.ts}.${clic.fbclid}`;
  document.cookie =
    `_fbc=${valor}; Max-Age=7776000; Path=/; SameSite=Lax` +
    (conDominio ? `; Domain=.${raiz}` : '') +
    (window.location.protocol === 'https:' ? '; Secure' : '');
}

/**
 * Lo que va a /api/lead/ para la CAPI. _fbc y _fbp se leen si existen, haya
 * o no consentimiento ahora (pueden venir de una visita anterior); no se
 * escribe nada.
 */
export function datosMedicion(): { consent_marketing: boolean; fbp?: string; fbc?: string } {
  if (typeof window === 'undefined') return { consent_marketing: false };
  return { consent_marketing: hasMarketingConsent(), fbp: leerCookie('_fbp'), fbc: leerCookie('_fbc') };
}

/* ------------------------------------------------------------------ *
 * Envío
 * ------------------------------------------------------------------ */

function send(ev: PendingEvent): void {
  const fbq = window.fbq;
  if (!fbq) return;
  // Coincidencia avanzada: se vuelve a llamar a init con los datos antes del Lead.
  if (ev.usuario) fbq('init', META_PIXEL_ID, ev.usuario);
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
  if (!pixelDisponible()) {
    pending.push(ev);
    return;
  }
  send(ev);
}

/** Sólo si el píxel está cargado; sin consentimiento no se encola. */
function emitSiCargado(ev: PendingEvent): boolean {
  if (!pixelDisponible()) return false;
  send(ev);
  return true;
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
 * Se llama una vez desde el layout. Guarda los UTM y el fbclid de la visita.
 * Si ya hay consentimiento, carga el píxel y manda el PageView. Si no, se
 * queda escuchando: en cuanto el usuario acepta, carga el píxel en ese momento
 * y vacía la cola.
 */
export function initTracking(): () => void {
  if (typeof window === 'undefined') return () => {};
  capturarUtm();
  for (const id of leerLista(LEADS_KEY)) leadsMedidos.add(id);
  for (const p of leerLista(PASOS_KEY)) pasosMedidos.add(p);

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

  start();
  return onConsentChange((c) => {
    if (c.marketing) start();
  });
}

/* ------------------------------------------------------------------ *
 * Eventos de la landing
 * ------------------------------------------------------------------ */

/** El usuario contesta la primera pregunta: empieza la calculadora. */
export function trackFormStart(): void {
  emit({ kind: 'track', name: 'ViewContent', params: { content_name: 'Calculadora' } });
  if (leerLista(FORMSTART_KEY).length) return;
  if (emitSiCargado({ kind: 'trackCustom', name: 'FormStart' })) anadirALista(FORMSTART_KEY, '1');
}

/** Paso del formulario completado (1 a 5). Una vez por paso y sesión. */
export function trackFormStep(step: number): void {
  const clave = String(step);
  if (pasosMedidos.has(clave)) return;
  if (emitSiCargado({ kind: 'trackCustom', name: 'FormStep', params: { step } })) {
    pasosMedidos.add(clave);
    anadirALista(PASOS_KEY, clave);
  }
}

/** Error de validación en un paso. Cada vez que salta. */
export function trackFormError(step: number, field: string): void {
  emitSiCargado({ kind: 'trackCustom', name: 'FormError', params: { step, field } });
}

export type CategoriaContacto = 'gracias-auto' | 'gracias-boton' | 'error-envio';

/** Paso a WhatsApp desde la pantalla de gracias o desde la de error de envío. */
export function trackContact(categoria: CategoriaContacto): void {
  emit({ kind: 'track', name: 'Contact', params: { content_category: categoria } });
}

/**
 * Presupuesto guardado en la hoja. `eventId` es el mismo de la hoja y de la
 * CAPI. Una sola vez por event_id, aunque se llame dos veces o se vacíe la cola.
 */
export function trackLead(eventId: string, usuario?: UsuarioPixel): void {
  if (typeof window === 'undefined' || leadsMedidos.has(eventId)) return;
  leadsMedidos.add(eventId);
  anadirALista(LEADS_KEY, eventId);
  emit({
    kind: 'track',
    name: 'Lead',
    params: { content_name: 'Presupuesto reprogramación' },
    opts: { eventID: eventId },
    usuario,
  });
}

/** ID único del Lead, compartido entre el píxel, la hoja y la CAPI. */
export function nuevoEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Respaldo para navegadores sin randomUUID (o sin contexto seguro).
  return `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
