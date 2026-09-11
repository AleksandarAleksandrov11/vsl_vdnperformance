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
  { valor: 100, prefijo: '+', sufijo: '', pie: 'Coches reprogramados' },
  { valor: 15, sufijo: ' días', pie: 'Garantía de electrónica' },
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
    puntos: ['Hasta +30% de potencia', 'Más par', 'Menos consumo'],
    precio: 'Desde 219 €',
    cta: 'Calcular mi Stage 1',
    imagen: 'stage-1',
  },
  {
    id: 'stage-2',
    pestana: 'Stage 2',
    titulo: 'Software y mecánica.',
    puntos: ['Admisión, escape e intercooler', 'Más rendimiento', 'El motor respira mejor'],
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
  { n: '03', titulo: 'Listo en una mañana', linea: 'Diagnosis, mapa a medida y prueba.', imagen: 'paso-3' },
];

/* --- 6. Trabajos --------------------------------------------------------- */

/* `ganancia` va aparte del trabajo a propósito: es el dato que se lee primero
   y así no se pierde dentro de una lista larga de intervenciones. */
export type Trabajo = { modelo: string; trabajo: string; ganancia: string; imagen: ImageKey };

/* Sólo coches de los que hay foto. El VW Golf R 7.5 sale de la lista hasta que
   llegue la suya: en un carrusel que no para, un hueco vacío canta mucho. */
export const TRABAJOS: Trabajo[] = [
  {
    modelo: 'BMW E46 320d',
    trabajo: 'Stage 2, solución EGR, sonda lambda, hardcut y deep idle',
    ganancia: '+70 CV',
    imagen: 'work-e46-330d',
  },
  { modelo: 'BMW E46 330d', trabajo: 'Stage 1', ganancia: '+60 CV', imagen: 'work-e46-320i' },
  {
    modelo: 'BMW E60 530d',
    trabajo: 'Stage 1 y solución DPF',
    ganancia: '+60 CV',
    imagen: 'work-e60-530d',
  },
  // TODO: la foto es de un Audi A3 TDI en diagnosis, no de un A4.
  { modelo: 'Audi A4 2.0 TDI', trabajo: 'Stage 1', ganancia: '+40 CV', imagen: 'work-a4-tdi' },
  {
    modelo: 'BMW Serie 3 E90',
    trabajo: 'Stage 1 y solución EGR',
    ganancia: '+40 CV',
    imagen: 'work-e90',
  },
  { modelo: 'Audi A3', trabajo: 'Stage 1', ganancia: '+30 CV', imagen: 'work-a3' },
  {
    modelo: 'Range Rover Sport',
    trabajo: 'Stage 1, solución EGR y sonda lambda',
    ganancia: '+50 CV',
    imagen: 'work-rrsport',
  },
];

/* --- 7. Reseñas ---------------------------------------------------------- */

export type Resena = { nombre: string; texto: string };

/* Nueve reseñas reales de Google, en rejilla de 3×3. Están elegidas por
   variedad (gasolina y diésel, Stage 1 y 2, consumo y potencia) y recortadas
   por frases enteras cuando eran muy largas: no se reescribe lo que dijo
   nadie, sólo se corta. */
export const RESENAS: Resena[] = [
  {
    nombre: 'Irene Rabasco',
    texto:
      'Increíble el cambio en mi coche. Bajó más de 1,5 l a los 100 km. Servicio muy rápido y serio.',
  },
  {
    nombre: 'Sergio Portillo',
    texto:
      'Llevé mi Audi A4 1.9 TDI a hacer Stage 1 y mejor imposible. Sin duda los mejores de la zona.',
  },
  {
    nombre: 'RPM Garage',
    texto:
      'Muy rápidos y profesionales. Llevé mi Golf 4 a hacer Stage 2, admisión y escape. No puedo estar más contento.',
  },
  { nombre: 'teeo_18', texto: 'Servicio de 10. Llevé mi coche a hacer Stage 1 y quedó brutal.' },
  {
    nombre: 'sergio rm',
    texto: 'Mi 1.6 HDI ya no es perezoso. Diego es todo un profesional, trato de 10.',
  },
  {
    nombre: 'Antonio Sánchez',
    texto:
      'Gran servicio. Llevé mi coche a anular EGR y bajarle los consumos y me voy encantado, muy económico.',
  },
  {
    nombre: 'DLS Detailing',
    texto:
      'Muy contento con el trabajo en mi Golf R. Les contacté para hacerle pops y quedó muy bien.',
  },
  {
    nombre: 'Ikerws',
    texto: 'Unos máquinas, súper majos y cercanos. El coche se nota más suelto y va de lujo.',
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
    r: 'No. Trabajamos dentro de los márgenes de seguridad y el mapa se ajusta a tu coche.',
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
