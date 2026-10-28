/**
 * ad-variants.ts: qué dice el hero según el anuncio del que viene la visita.
 *
 * El script en línea de layout.tsx lee los UTM antes del primer pintado y
 * marca <html> con dos atributos:
 *   data-campaign  "descubrir" o "cerrar". Sale de utm_content (tofu*, mofu*,
 *                  bofu*) y, si no dice nada, de utm_campaign ("descubrir",
 *                  "cerrar"). utm_content manda sobre utm_campaign.
 *   data-ad        utm_content (o utm_campaign) normalizado: minúsculas, sin
 *                  espacios ni puntos y sin ".0" final ("TOFU1.0" -> "tofu1").
 * Los dos se guardan en sessionStorage: si la persona va a una legal y vuelve,
 * el hero sigue siendo el de su anuncio.
 *
 * Todas las variantes van en el HTML estático y el CSS enseña la que toca, así
 * que no hay parpadeo ni salto (CLS 0). Sólo usan datos que ya están en la web.
 * Cada titular ocupa las mismas dos líneas que el de por defecto a 390 px: es
 * el elemento LCP y no debe crecer. El botón principal es el mismo en todas.
 */

import { SITE } from './config';

export type VarianteHero = {
  antetitulo: string;
  titular: [string, string];
  subtitulo: string;
};

/** Descubrir (TOFU) y visitas sin UTM: el hero de siempre. */
export const POR_DEFECTO: VarianteHero = {
  antetitulo: `${SITE.taller.ciudad} · ${SITE.taller.provincia}`,
  titular: ['Tu coche', 'puede dar más.'],
  subtitulo: `Reprogramación a medida. Stage 1 desde ${SITE.precioStage1} €.`,
};

/** Por campaña. "descubrir" es la de por defecto. */
export const POR_CAMPANA: Record<'cerrar', VarianteHero> = {
  /* Cierre (MOFU/BOFU): quien ya conoce el taller, a pedir su precio. */
  cerrar: {
    antetitulo: 'Presupuesto gratis',
    titular: ['¿Cuánto gana', 'tu coche?'],
    subtitulo: `Stage 1 desde ${SITE.precioStage1} €. Te damos tu precio por WhatsApp.`,
  },
};

/**
 * Por anuncio concreto: la clave es el utm_content normalizado ("bofu1").
 * Manda sobre la campaña. Vacío por ahora: se rellena cuando haya textos de
 * cada anuncio.
 */
export const POR_ANUNCIO: Record<string, VarianteHero> = {};

/**
 * Script que corre en el <head> antes del primer pintado. Va como texto porque
 * se inserta en línea; tiene que ser ES5 y no puede fallar.
 */
export function scriptAnuncio(): string {
  return `(function(){try{var d=document.documentElement,q=new URLSearchParams(location.search),c=q.get('utm_content')||'',k=q.get('utm_campaign')||'',s=sessionStorage,g;
function n(v){return String(v).toLowerCase().replace(/\\s+/g,'').replace(/\\.0$/,'').replace(/\\./g,'')}
if(c||k){var ad=n(c||k),cc=n(c),kk=n(k),camp='';
if(/tofu/.test(cc))camp='descubrir';else if(/mofu|bofu/.test(cc))camp='cerrar';
else if(/cerrar|mofu|bofu/.test(kk))camp='cerrar';else if(/descubrir|tofu/.test(kk))camp='descubrir';
g={ad:ad,campaign:camp};s.setItem('vdn.ad.v1',JSON.stringify(g))}else{g=JSON.parse(s.getItem('vdn.ad.v1')||'null')}
if(g){if(g.ad)d.setAttribute('data-ad',g.ad);if(g.campaign)d.setAttribute('data-campaign',g.campaign)}}catch(e){}})()`;
}

/**
 * CSS que enseña la variante buena. Primero las de campaña y después las de
 * anuncio, que con la misma especificidad ganan por ir detrás.
 */
export function cssVariantes(): string {
  const reglas: string[] = ['[data-hero-v]:not([data-hero-v="defecto"]){display:none}'];
  for (const k of Object.keys(POR_CAMPANA)) {
    reglas.push(
      `html[data-campaign="${k}"] [data-hero-v]{display:none}`,
      `html[data-campaign="${k}"] [data-hero-v="campana-${k}"]{display:block}`,
    );
  }
  for (const k of Object.keys(POR_ANUNCIO)) {
    reglas.push(
      `html[data-ad="${k}"] [data-hero-v]{display:none}`,
      `html[data-ad="${k}"] [data-hero-v="anuncio-${k}"]{display:block}`,
    );
  }
  return reglas.join('');
}
