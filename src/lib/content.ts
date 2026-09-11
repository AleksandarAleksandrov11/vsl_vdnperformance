/**
 * content.ts — todos los textos de la landing.
 * Separados del maquetado para que el cliente pueda cambiar una reseña, una
 * pregunta o un precio sin tocar ningún componente.
 */

import { SITE } from './config';
import type { ImageKey } from './images.generated';

/* --- 2. Tira de marcas --------------------------------------------------- */

export const MARCAS = [
  'BMW',
  'Mercedes',
  'Audi',
  'Volkswagen',
  'Ford',
  'Renault',
  'Seat',
  'Skoda',
  'Opel',
  'Kia',
  'Hyundai',
  'Toyota',
  'Peugeot',
  'Citroën',
] as const;

/* --- 3. ¿Por qué VDN Performance? ---------------------------------------- */

export type Razon = {
  valor: number;
  prefijo?: string;
  sufijo: string;
  titulo: string;
  texto: string;
};

export const RAZONES: Razon[] = [
  {
    valor: 15,
    sufijo: 'D',
    titulo: 'Garantía real',
    texto: '15 días para volver al mapa original. Sin letra pequeña.',
  },
  {
    valor: 30,
    prefijo: '+',
    sufijo: '%',
    titulo: 'Más potencia',
    texto:
      'Ganancia media en potencia y par, con mejora de consumo en conducción suave.',
  },
  {
    valor: 24,
    sufijo: 'H',
    titulo: 'Entrega rápida',
    texto: 'La mayoría de reprogramaciones se hacen en el mismo día.',
  },
  {
    valor: 10,
    prefijo: '+',
    sufijo: '',
    titulo: 'Años de experiencia',
    texto: 'Más de una década reprogramando y preparando coches.',
  },
];

/* --- 5. Servicios -------------------------------------------------------- */

export type Servicio = {
  id: string;
  nombre: string;
  etiqueta?: string;
  descripcion: string;
  detalle: string;
  precio: string;
  cta: string;
  destacado?: boolean;
};

export const SERVICIOS: Servicio[] = [
  {
    id: 'stage-1',
    nombre: 'Stage 1',
    etiqueta: 'Más elegido',
    descripcion: 'Reprogramación del software original, sin cambiar piezas.',
    detalle:
      'Hasta un 30 % más de potencia, mejor respuesta y menos consumo en conducción normal.',
    precio: `Desde ${SITE.precioStage1} €`,
    cta: 'Calcular mi Stage 1',
    destacado: true,
  },
  {
    id: 'stage-2',
    nombre: 'Stage 2',
    descripcion: 'Software más mejoras físicas: intercooler, downpipe, admisión.',
    detalle: 'El motor respira mejor y se le puede sacar bastante más que en Stage 1.',
    precio: 'Precio según coche',
    cta: 'Pedir presupuesto',
  },
  {
    id: 'stage-3',
    nombre: 'Stage 3',
    descripcion: 'Preparación seria: turbo, inyección y componentes reforzados.',
    detalle: 'Se estudia proyecto por proyecto, con el motor y el uso del coche por delante.',
    precio: 'Precio según proyecto',
    cta: 'Cuéntanos tu proyecto',
  },
];

export const OTROS_SERVICIOS = [
  {
    nombre: 'Pops & Bangs',
    texto: 'Petardeo en el escape al levantar el pie, ajustado para no castigar el motor.',
  },
  {
    nombre: 'Hardcut / Flatcut',
    texto: 'Corte de inyección en el limitador, con ese golpe seco de coche preparado.',
  },
  {
    nombre: 'EGR',
    texto: 'Gestión de la válvula EGR, el clásico punto débil de muchos diésel.',
  },
  { nombre: 'DPF', texto: 'Tratamiento del filtro de partículas cuando ya da problemas.' },
  {
    nombre: 'Stage 0',
    texto:
      'Puesta a punto antes de reprogramar. Recomendado en coches de más de 120.000 km: primero el motor sano, después la potencia.',
  },
] as const;

/* --- 6. Cómo funciona ---------------------------------------------------- */

export const PASOS = [
  { n: 1, titulo: 'Nos dices tu coche', texto: 'Treinta segundos y cuatro preguntas. Nada más.' },
  {
    n: 2,
    titulo: 'Te escribimos por WhatsApp',
    texto: 'Cuánto gana tu coche y cuánto cuesta, en menos de 24 horas y sin compromiso.',
  },
  {
    n: 3,
    titulo: 'Traes el coche',
    texto: 'Diagnosis, copia del archivo original y reprogramación hecha a medida para tu motor.',
  },
  {
    n: 4,
    titulo: 'Te lo llevas el mismo día',
    texto: 'Con la prueba en carretera hecha y 15 días de garantía para volver atrás.',
  },
] as const;

/* --- 8. Trabajos reales -------------------------------------------------- */

export type Trabajo = {
  modelo: string;
  trabajo: string;
  destacado: string;
  /** null = todavía no hay foto real de ese coche. */
  imagen: ImageKey | null;
};

export const TRABAJOS: Trabajo[] = [
  { modelo: 'BMW E46 330d', trabajo: 'Stage 1', destacado: '+55 CV', imagen: 'work-e46-330d' },
  // TODO: imagen real — no hay ninguna foto del Golf R 7.5 en los assets.
  { modelo: 'VW Golf R 7.5', trabajo: 'Stage 2', destacado: 'Pops & Bangs', imagen: null },
  { modelo: 'BMW E46 320i', trabajo: 'Stage 1', destacado: 'Hardcut', imagen: 'work-e46-320i' },
  { modelo: 'BMW E60 530d', trabajo: 'Stage 2', destacado: '+80 CV', imagen: 'work-e60-530d' },
  {
    modelo: 'Audi A4 2.0 TDI',
    trabajo: 'Diagnosis y puesta a punto',
    destacado: 'Stage 0',
    // TODO: la foto es de un Audi A3 TDI en diagnosis, no de un A4.
    imagen: 'work-audi-diag',
  },
];

/* --- 9. Reseñas de Google ------------------------------------------------ */

export type Resena = { nombre: string; texto: string };

export const RESENAS: Resena[] = [
  {
    nombre: 'Irene Rabasco',
    texto:
      'Increíble el cambio en mi coche. Lo llevé para reprogramar la centralita y reducir los consumos. Bajó más de 1,5 l a los 100 km. Servicio muy rápido y serio.',
  },
  {
    nombre: 'Sergio Portillo',
    texto:
      'Llevé mi Audi A4 1.9 TDI a hacer Stage 1 y mejor imposible. Se encargan de todo hasta el último detalle. Te aconsejan sobre qué es lo mejor para tu coche, con un trato excelente y personalizado. Sin duda los mejores de la zona.',
  },
  {
    nombre: 'sergio rm',
    texto:
      'Mi 1.6 HDI ya no es perezoso y ahora sí que me gusta la sensación al pisar el acelerador. Diego es todo un profesional, trato de 10.',
  },
  {
    nombre: 'RPM Garage',
    texto:
      'Muy rápidos y profesionales. Llevé mi Golf 4 a hacer Stage 2, admisión y escape. No puedo estar más contento con el resultado.',
  },
  {
    nombre: 'Antonio Lpz',
    texto:
      '¡Geniales! Un servicio muy bueno. Me han asesorado y ahora mi coche rinde mucho mejor para arrastrar mi caravana. Gracias Diego por tu profesionalidad.',
  },
  {
    nombre: 'Miguel',
    texto:
      'Stage 1 en Audi A3. Buen servicio, rápidos y profesionales. Diego muy amable, me explicó varias cosas del coche para sacarle todo el rendimiento. Totalmente recomendables.',
  },
  {
    nombre: 'Ikerws',
    texto:
      'Unos máquinas, súper majos y cercanos. El coche se nota más suelto y va de lujo. 100% recomendados 👌',
  },
  {
    nombre: 'Paula Sanchez',
    texto:
      'Atención inmejorable. Llevé mi coche a hacer un Stage 1 y no puedo estar más satisfecha con el trabajo realizado.',
  },
  {
    nombre: 'Manu',
    texto:
      'Muy buen servicio. Fui a reprogramar el coche porque quería reducir los consumos. Los chicos muy amables y rápidos.',
  },
  {
    nombre: 'Rayan El Puirto',
    texto:
      'Fui recomendado por un amigo y salí súper contento con el resultado, y sobre todo informado de lo que se había hecho. 100% recomendable.',
  },
  { nombre: 'teeo_18', texto: 'Servicio de 10. Llevé mi coche a hacer Stage 1 y quedó brutal.' },
  {
    nombre: 'Antonio Sánchez',
    texto:
      'Gran servicio. Llevé mi coche a bajarle los consumos y me voy encantado. Un precio muy económico.',
  },
];

/* --- 12. Preguntas frecuentes -------------------------------------------- */

export type Pregunta = { p: string; r: string };

export const FAQ: Pregunta[] = [
  {
    p: '¿Es peligroso para el motor?',
    r: 'No, si está bien hecho. Se trabaja dentro de los márgenes de seguridad del motor y el mapa se ajusta a tu coche en concreto. No se le mete un archivo genérico descargado de internet.',
  },
  {
    p: '¿Es reversible?',
    r: 'Totalmente. Siempre guardamos el mapa original de cada cliente por si en algún momento quieres volver a tener tu coche de serie. Además, tienes 15 días de garantía para volver al original.',
  },
  {
    p: '¿Cuánto se tarda?',
    r: 'En una mañana lo tienes. Dejas el coche, hacemos la diagnosis, el mapa y la prueba en carretera, y te lo llevas el mismo día. Abrimos todos los días de 8:00 a 23:00.',
  },
  {
    p: '¿Cómo es el proceso?',
    r: 'Primero, diagnosis: miramos el estado real del motor y comprobamos que todo esté como tiene que estar. Después leemos la centralita y guardamos una copia del archivo original. Y aquí está la diferencia: el mapa se ajusta a tu motor y a tu forma de conducir. No es un archivo genérico, es un traje a medida para tu coche.',
  },
  {
    p: '¿Qué diferencia hay entre Stage 1, 2 y 3?',
    r: 'El Stage 1 es solo electrónica: no se toca ni una pieza, se optimizan los parámetros del motor dentro de sus márgenes de seguridad. El Stage 2 ya lleva modificaciones mecánicas como escape, admisión o intercooler: el motor respira mejor y se le puede sacar más. El Stage 3 ya es preparación seria, con turbo mayor o hibridado e inyectores.',
  },
  {
    p: '¿Gasta más o menos?',
    r: 'En conducción normal acabas gastando menos, porque el coche va más ágil y responde mucho antes. Si pisas más, gastará más.',
  },
  {
    p: 'Mi coche es muy viejo o tiene muchos kilómetros, ¿merece la pena?',
    r: 'Eso es lo de menos. Mientras el coche esté bien cuidado y mantenido, una repro a medida siempre sienta bien.',
  },
  {
    p: 'Tengo que poner a punto el coche primero.',
    r: 'No hay problema: te dejamos una cita reservada para cuando lo tengas. Y si lo necesitas, también hacemos la puesta a punto (Stage 0) antes de reprogramar.',
  },
  {
    p: '¿Cuánto cuesta?',
    r: `El Stage 1 empieza desde ${SITE.precioStage1} €. Es una reprogramación completamente a medida y el precio exacto depende de tu motor. Te lo decimos gratis en menos de 24 horas.`,
  },
  {
    p: '¿Pasa la ITV?',
    r: 'Por supuesto. Es una modificación totalmente indetectable, donde no se modifica nada mecánico.',
  },
];

/* --- 10. Garantía -------------------------------------------------------- */

export const GARANTIA_CHECKS = [
  'Reversibilidad completa',
  'Guardamos siempre tu archivo original',
  'Compromiso por escrito',
] as const;
