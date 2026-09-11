/**
 * consent.ts — consentimiento de cookies (RGPD + LSSI art. 22.2).
 *
 * Reglas que implementa:
 *  · Nada de terceros se carga antes de que el usuario decida.
 *  · "Aceptar" y "Rechazar" pesan lo mismo; rechazar es un clic, igual que aceptar.
 *  · Las técnicas son necesarias para que la web funcione y no se pueden desactivar.
 *  · Las de marketing (Meta Pixel) vienen desactivadas por defecto.
 *  · La decisión se guarda y se puede cambiar desde "Configurar cookies" del pie.
 *
 * Se guarda en localStorage porque no necesita viajar al servidor: la web es
 * estática y el único tercero que depende del consentimiento es el píxel.
 */

export const CONSENT_KEY = 'vdn.consent.v1';

/** Si se cambia el texto del banner o las categorías, sube la versión. */
export const CONSENT_VERSION = 1;

export type Consent = {
  version: number;
  /** Siempre true: sin ellas la web no funciona. */
  necesarias: true;
  /** Meta Pixel. Por defecto false. */
  marketing: boolean;
  /** ISO 8601, para poder acreditar cuándo se dio el consentimiento. */
  fecha: string;
};

export const CONSENT_EVENT = 'vdn:consent';

function isConsent(value: unknown): value is Consent {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  return typeof c.marketing === 'boolean' && c.version === CONSENT_VERSION;
}

/** Devuelve la decisión guardada, o null si el usuario todavía no ha elegido. */
export function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isConsent(parsed) ? parsed : null;
  } catch {
    // Modo privado de Safari, almacenamiento bloqueado, JSON corrupto...
    // Sin decisión guardada = no hay consentimiento = no se carga nada.
    return null;
  }
}

/** Guarda la decisión y avisa al resto de la app (tracking, banner, pie). */
export function writeConsent(marketing: boolean): Consent {
  const consent: Consent = {
    version: CONSENT_VERSION,
    necesarias: true,
    marketing,
    fecha: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Si no se puede guardar, la decisión vale para esta visita igualmente.
  }
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: consent }));
  return consent;
}

/** Escucha cambios de consentimiento. Devuelve la función para dejar de escuchar. */
export function onConsentChange(fn: (c: Consent) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<Consent>).detail);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}

export function hasMarketingConsent(): boolean {
  return readConsent()?.marketing === true;
}
