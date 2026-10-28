/**
 * prefijos.ts: prefijos de país del teléfono. Lo usan el selector del
 * formulario y el servidor (para el país de la API de Conversiones), así que
 * los dos ven siempre la misma lista.
 *
 * Cómo viaja el teléfono a la hoja, en el mismo campo `telefono` de siempre:
 *   · con +34, los 9 dígitos sin prefijo, exactamente como hasta ahora;
 *   · con otro prefijo, el número entero con su prefijo: "+351912345678".
 */

export type Prefijo = { codigo: string; pais: string; iso: string };

/** España primero (es el de por defecto); después los más habituales. */
export const PREFIJOS: Prefijo[] = [
  { codigo: '34', pais: 'España', iso: 'es' },
  { codigo: '351', pais: 'Portugal', iso: 'pt' },
  { codigo: '33', pais: 'Francia', iso: 'fr' },
  { codigo: '39', pais: 'Italia', iso: 'it' },
  { codigo: '49', pais: 'Alemania', iso: 'de' },
  { codigo: '44', pais: 'Reino Unido', iso: 'gb' },
  { codigo: '40', pais: 'Rumanía', iso: 'ro' },
  { codigo: '212', pais: 'Marruecos', iso: 'ma' },
  { codigo: '54', pais: 'Argentina', iso: 'ar' },
  { codigo: '591', pais: 'Bolivia', iso: 'bo' },
  { codigo: '55', pais: 'Brasil', iso: 'br' },
  { codigo: '56', pais: 'Chile', iso: 'cl' },
  { codigo: '57', pais: 'Colombia', iso: 'co' },
  { codigo: '506', pais: 'Costa Rica', iso: 'cr' },
  { codigo: '53', pais: 'Cuba', iso: 'cu' },
  { codigo: '593', pais: 'Ecuador', iso: 'ec' },
  { codigo: '503', pais: 'El Salvador', iso: 'sv' },
  { codigo: '502', pais: 'Guatemala', iso: 'gt' },
  { codigo: '504', pais: 'Honduras', iso: 'hn' },
  { codigo: '52', pais: 'México', iso: 'mx' },
  { codigo: '505', pais: 'Nicaragua', iso: 'ni' },
  { codigo: '507', pais: 'Panamá', iso: 'pa' },
  { codigo: '595', pais: 'Paraguay', iso: 'py' },
  { codigo: '51', pais: 'Perú', iso: 'pe' },
  { codigo: '1809', pais: 'República Dominicana', iso: 'do' },
  { codigo: '598', pais: 'Uruguay', iso: 'uy' },
  { codigo: '58', pais: 'Venezuela', iso: 've' },
];

export const PREFIJO_POR_DEFECTO = '34';

/**
 * País (ISO en minúsculas) de un número con prefijo, sólo dígitos. Gana el
 * prefijo más largo que coincida. Devuelve null si no es de ninguno de la lista.
 */
export function paisDeNumero(digitos: string): string | null {
  let mejor: Prefijo | null = null;
  for (const p of PREFIJOS) {
    if (digitos.startsWith(p.codigo) && (!mejor || p.codigo.length > mejor.codigo.length)) mejor = p;
  }
  return mejor?.iso ?? null;
}
