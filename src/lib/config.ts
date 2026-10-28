/**
 * config.ts — todo lo que el cliente puede querer cambiar, en un solo sitio.
 * Si cambia un teléfono, un precio o el webhook, se toca aquí y nada más.
 */

export const SITE = {
  url: 'https://www.vdnperformance.com',
  name: 'VDN Performance',
  legalName: 'Diego Sánchez Rabasco',
  nif: '05733122G',
  webPrincipal: 'https://vdnperformance.es',
  email: 'vdnperformance@gmail.com',
  /** Para tel: y wa.me — sin espacios ni símbolos. */
  phoneRaw: '34711523484',
  phoneDisplay: '711 52 34 84',
  phoneIntl: '+34 711 52 34 84',
  taller: {
    calle: 'C. Calibre, 72',
    cp: '28400',
    ciudad: 'Collado Villalba',
    provincia: 'Madrid',
    pais: 'ES',
    lat: 40.6376,
    lng: -4.0043,
    maps: 'https://www.google.com/maps/search/?api=1&query=C.+Calibre+72,+28400+Collado+Villalba,+Madrid',
  },
  fiscal: {
    calle: 'C/ San Rafael 16',
    cp: '28430',
    ciudad: 'Alpedrete',
    provincia: 'Madrid',
  },
  horario: 'Todos los días de 8:00 a 23:00',
  horarioCorto: 'De 8:00 a 23:00, todos los días',
  instagram: 'https://www.instagram.com/vdnperformance/',
  instagramHandle: '@vdnperformance',
  tiktok: 'https://www.tiktok.com/@vdnperformance',
  tiktokHandle: '@vdnperformance',
  googleReviews: 'https://share.google/gLzv3BUfM0bFMjUPq',
  precioStage1: 219,
  garantiaDias: 15,
} as const;

/**
 * Enlace de WhatsApp al taller con el mensaje ya escrito. Sólo se usa en la
 * pantalla de gracias y en la de error de envío: antes del formulario no hay
 * ningún enlace que saque de la página.
 */
export function waLink(mensaje: string): string {
  return `https://wa.me/${SITE.phoneRaw}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Apps Script que recibe los leads y los escribe en la hoja de cálculo.
 * Lo llama /api/lead/ desde el servidor, con `URLSearchParams` (Apps Script lee
 * `e.parameter`). El navegador sólo lo llama directo en el plan B de leads.ts.
 */
export const SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbz8ORocSTJkqaaKDZ7gyc1cyMm_3kHrqVdbSfuIJOXrKAfHbnbZyilC_gw0_IFJlyAy/exec';

/** Meta Pixel. Sólo se carga si el usuario acepta las cookies de marketing. */
export const META_PIXEL_ID = '1264303155893965';

/** Ancla del formulario. Se usa en todos los CTA que bajan a él. */
export const FORM_ID = 'presupuesto';
