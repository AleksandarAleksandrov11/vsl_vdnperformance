/** Reglas de validación del formulario, aparte para poder probarlas sueltas. */

export const NO_LO_SABE = 'No lo sabe';

export const ANIO_MIN = 1990;
export const ANIO_MAX = new Date().getFullYear();
export const CV_MIN = 40;
export const CV_MAX = 800;

export function validaModelo(v: string): string | null {
  return v.trim().length >= 2 ? null : 'Escribe al menos la marca y el modelo.';
}

export function validaAnio(v: string): string | null {
  if (!/^\d{4}$/.test(v.trim())) return 'Pon el año con cuatro cifras. Por ejemplo, 2016.';
  const n = Number(v);
  if (n < ANIO_MIN || n > ANIO_MAX) return `Tiene que estar entre ${ANIO_MIN} y ${ANIO_MAX}.`;
  return null;
}

export function validaMotor(v: string): string | null {
  return v.trim().length >= 2 ? null : 'Escribe el motor, o pulsa en "No lo sé".';
}

export function validaPotencia(v: string): string | null {
  if (!/^\d{2,3}$/.test(v.trim())) return 'Pon los caballos en números. Por ejemplo, 150.';
  const n = Number(v);
  if (n < CV_MIN || n > CV_MAX) return `Tiene que estar entre ${CV_MIN} y ${CV_MAX} CV.`;
  return null;
}

export function validaNombre(v: string): string | null {
  return v.trim().length >= 2 ? null : 'Dinos tu nombre para poder escribirte.';
}

/**
 * Teléfono español: nueve dígitos que empiezan por 6, 7, 8 o 9.
 * Se aceptan espacios, puntos y guiones, y el prefijo +34, 0034 o 34 suelto.
 */
export function normalizaTelefono(v: string): string | null {
  const limpio = v.replace(/[\s.\-()]/g, '');
  const sinPrefijo = limpio.replace(/^(\+34|0034|34)/, '');
  return /^[6-9]\d{8}$/.test(sinPrefijo) ? sinPrefijo : null;
}

export function validaTelefono(v: string): string | null {
  return normalizaTelefono(v) ? null : 'Escribe un móvil español de 9 cifras.';
}

/* --- Teléfono con prefijo de país ---------------------------------------- */

/** Valor del selector para escribir el prefijo a mano. */
export const PREFIJO_OTRO = 'otro';

const soloDigitos = (v: string) => v.replace(/\D/g, '');

/** Prefijo efectivo: el del selector o, con "Otro", el escrito a mano. */
export function prefijoEfectivo(prefijo: string, prefijoOtro: string): string {
  return prefijo === PREFIJO_OTRO ? soloDigitos(prefijoOtro) : prefijo;
}

/**
 * Con +34, la validación de siempre (validaTelefono). Con otro prefijo, el
 * número sin prefijo tiene que tener entre 6 y 14 cifras.
 */
export function validaTelefonoCon(prefijo: string, prefijoOtro: string, v: string): string | null {
  const p = prefijoEfectivo(prefijo, prefijoOtro);
  if (p === '34') return validaTelefono(v);
  if (!/^\d{1,4}$/.test(p)) return 'Escribe el prefijo de tu país, por ejemplo 351.';
  const n = soloDigitos(v).length;
  return n >= 6 && n <= 14 ? null : 'Escribe el número sin el prefijo, de 6 a 14 cifras.';
}

/**
 * Valor que va a la hoja, en el mismo campo `telefono` de siempre:
 *  · con +34, los 9 dígitos, exactamente como hasta ahora;
 *  · con otro prefijo, "+" + prefijo + número ("+351912345678"). El 0 inicial
 *    de algunos números nacionales sobra en formato internacional y se quita
 *    (salvo en Italia, donde forma parte del número).
 */
export function telefonoParaHoja(prefijo: string, prefijoOtro: string, v: string): string {
  const p = prefijoEfectivo(prefijo, prefijoOtro);
  if (p === '34') return normalizaTelefono(v) ?? v;
  let n = soloDigitos(v);
  if (p !== '39') n = n.replace(/^0+/, '');
  return `+${p}${n}`;
}

/**
 * Si se pega un número con "+" o "00" delante, separa el prefijo para no
 * duplicarlo. Devuelve null si no empieza así o si el prefijo no es de la lista.
 */
export function separarPrefijo(v: string, prefijos: readonly string[]): { prefijo: string; resto: string } | null {
  const m = v.trim().match(/^(?:\+|00)\s*(.*)$/);
  if (!m) return null;
  const d = soloDigitos(m[1]);
  const prefijo = [...prefijos].sort((a, b) => b.length - a.length).find((p) => d.startsWith(p));
  return prefijo ? { prefijo, resto: d.slice(prefijo.length) } : null;
}
