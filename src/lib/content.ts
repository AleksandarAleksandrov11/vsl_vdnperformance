/**
 * content.ts — todos los textos de la landing.
 *
 * Regla de estilo de esta página: titulares de 2 a 6 palabras, frases de 15
 * palabras como máximo, nada de párrafos. Si algo no cabe, se quita; no se
 * encoge la tipografía.
 */

import type { ImageKey } from './images.generated';

/* --- 2. Cifras ----------------------------------------------------------- */

export type Cifra = { valor: number; prefijo?: string; sufijo: string; pie: string; decimales?: number };

export const CIFRAS: Cifra[] = [
  { valor: 30, prefijo: '+', sufijo: '%', pie: 'Potencia media' },
  { valor: 1, sufijo: ' día', pie: 'En el taller' },
  { valor: 15, sufijo: ' días', pie: 'De garantía' },
  { valor: 5, sufijo: ' ★', pie: 'En Google', decimales: 1 },
];

/* --- 3. Stages ----------------------------------------------------------- */

export type Stage = {
  id: string;
  pestana: string;
  titulo: string;
  puntos: [string, string, string];
  precio: string;
  cta: string;
  imagen: ImageKey;
};

export const STAGES: Stage[] = [
  {
    id: 'stage-1',
    pestana: 'Stage 1',
    titulo: 'Solo software. Cero piezas.',
    puntos: ['Hasta +30% de potencia', 'Más par desde abajo', 'Menos consumo'],
    precio: 'Desde 219 €',
    cta: 'Calcular mi Stage 1',
    imagen: 'stage-1',
  },
  {
    id: 'stage-2',
    pestana: 'Stage 2',
    titulo: 'Software y mecánica.',
    puntos: ['Admisión, escape e intercooler', 'Más rendimiento', 'Para uso diario'],
    precio: 'Precio según coche',
    cta: 'Pedir precio',
    imagen: 'stage-2',
  },
  {
    id: 'stage-3',
    pestana: 'Stage 3',
    titulo: 'Preparación seria.',
    puntos: ['Turbo mayor o hibridado', 'Inyectores', 'Máximo rendimiento'],
    precio: 'Precio según proyecto',
    cta: 'Pedir precio',
    imagen: 'stage-3',
  },
];

/* --- 5. Proceso ---------------------------------------------------------- */

export type Paso = { n: string; titulo: string; linea: string; imagen: ImageKey };

export const PASOS: Paso[] = [
  { n: '01', titulo: 'Dinos tu coche', linea: '30 segundos, desde el móvil.', imagen: 'paso-1' },
  { n: '02', titulo: 'Te damos el precio', linea: 'Por WhatsApp, en menos de 24 h.', imagen: 'paso-2' },
  { n: '03', titulo: 'Te lo llevas hoy', linea: 'Diagnosis, mapa a medida y prueba.', imagen: 'paso-3' },
];

/* --- 6. Trabajos --------------------------------------------------------- */

export type Trabajo = { modelo: string; etiqueta: string; imagen: ImageKey | null };

export const TRABAJOS: Trabajo[] = [
  { modelo: 'BMW E46 330d', etiqueta: 'Stage 1 · +55 CV', imagen: 'work-e46-330d' },
  // TODO: falta la foto del Golf R 7.5; la tarjeta sale con el hueco vacío.
  { modelo: 'VW Golf R 7.5', etiqueta: 'Stage 2', imagen: null },
  { modelo: 'BMW E46 320i', etiqueta: 'Stage 1', imagen: 'work-e46-320i' },
  { modelo: 'BMW E60 530d', etiqueta: 'Stage 2 · +80 CV', imagen: 'work-e60-530d' },
  // TODO: la foto es de un Audi A3 TDI en diagnosis, no de un A4.
  { modelo: 'Audi A4 2.0 TDI', etiqueta: 'Puesta a punto', imagen: 'work-a4-tdi' },
  // Tarjetas extra con las fotos que quedaban. Etiqueta genérica a propósito:
  // no consta qué se le hizo exactamente a cada uno.
  { modelo: 'BMW Serie 3 E90', etiqueta: 'Reprogramación', imagen: 'work-e90' },
  { modelo: 'Audi A3', etiqueta: 'Reprogramación', imagen: 'work-a3' },
  { modelo: 'Range Rover Sport', etiqueta: 'Reprogramación', imagen: 'work-rrsport' },
];

/* --- 7. Reseñas ---------------------------------------------------------- */

export type Resena = { nombre: string; texto: string };

export const RESENAS: Resena[] = [
  { nombre: 'teeo_18', texto: 'Servicio de 10. Llevé mi coche a hacer Stage 1 y quedó brutal.' },
  {
    nombre: 'Ikerws',
    texto: 'Unos máquinas, súper majos y cercanos. El coche se nota más suelto y va de lujo.',
  },
  {
    nombre: 'sergio rm',
    texto: 'Mi 1.6 HDI ya no es perezoso. Diego es todo un profesional, trato de 10.',
  },
  {
    nombre: 'Irene Rabasco',
    texto:
      'Increíble el cambio en mi coche. Bajó más de 1,5 l a los 100 km. Servicio muy rápido y serio.',
  },
  {
    nombre: 'Paula Sanchez',
    texto: 'Atención inmejorable. Llevé mi coche a hacer un Stage 1 y no puedo estar más satisfecha.',
  },
  {
    nombre: 'Miguel',
    texto: 'Stage 1 en Audi A3. Rápidos, profesionales y Diego muy amable. Totalmente recomendables.',
  },
];

/* --- 10. Dudas ----------------------------------------------------------- */

export type Pregunta = { p: string; r: string };

export const FAQ: Pregunta[] = [
  {
    p: '¿Es peligroso para el motor?',
    r: 'No, si está bien hecho. Trabajamos dentro de los márgenes de seguridad y el mapa se ajusta a tu coche.',
  },
  { p: '¿Es reversible?', r: 'Totalmente. Guardamos siempre tu mapa original.' },
  { p: '¿Cuánto se tarda?', r: 'En una mañana lo tienes.' },
  {
    p: '¿Pasa la ITV?',
    r: 'Por supuesto. Es una modificación totalmente indetectable, donde no se modifica nada mecánico.',
  },
  {
    p: '¿Sirve si mi coche tiene muchos kilómetros?',
    r: 'Sí. Mientras esté bien cuidado, una repro a medida siempre sienta bien.',
  },
  {
    p: '¿Cuánto cuesta?',
    r: 'El Stage 1 desde 219 €. Te damos tu precio exacto gratis en menos de 24 h.',
  },
];
