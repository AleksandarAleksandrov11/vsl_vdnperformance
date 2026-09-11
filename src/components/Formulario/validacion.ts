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
