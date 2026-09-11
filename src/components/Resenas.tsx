'use client';

import { SITE } from '@/lib/config';
import { RESENAS } from '@/lib/content';
import { Estrellas, Eyebrow, H2_CLASS, Reveal, Section, Titular } from './kit';

/**
 * Sección clara. Es el único respiro de blanco de toda la página, junto con la
 * garantía que va justo debajo: las dos comparten fondo para que se lean como
 * un mismo bloque y no como dos cambios de color seguidos.
 *
 * Las seis tarjetas son idénticas: misma altura por cuadrícula y el texto
 * recortado a cuatro líneas, así ninguna descuadra la rejilla.
 */
export function Resenas() {
  return (
    <Section light labelledBy="resenas-t" className="overflow-hidden pb-0 lg:pb-0">
      <div className="shell">
        <Reveal>
          <Eyebrow className="!text-muted-dark">Opiniones</Eyebrow>
        </Reveal>
        <Titular id="resenas-t" lineas={['5,0 en Google.']} className={`${H2_CLASS} mt-4`} />
      </div>

      {/* Móvil: carrusel. Escritorio: rejilla 3×2 con filas iguales. */}
      <div
        role="region"
        aria-label="Opiniones de clientes en Google"
        tabIndex={0}
        className="scrollbar-none rail mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 lg:hidden"
      >
        {RESENAS.map((r) => (
          <div key={r.nombre} className="w-[78vw] max-w-[21rem] shrink-0 snap-start">
            <Tarjeta {...r} />
          </div>
        ))}
      </div>

      <div className="shell mt-12 hidden lg:block lg:mt-16">
        <ul className="grid auto-rows-fr grid-cols-3 gap-4">
          {RESENAS.map((r, i) => (
            <Reveal key={r.nombre} as="li" delay={(i % 3) * 80} className="h-full">
              <Tarjeta {...r} />
            </Reveal>
          ))}
        </ul>
      </div>

      <div className="shell mt-10 lg:mt-12">
        <a
          href={SITE.googleReviews}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[0.9375rem] text-ink-dark underline decoration-black/20 underline-offset-[6px] transition-colors duration-300 hover:decoration-black/60"
        >
          Ver todas en Google
        </a>
      </div>
    </Section>
  );
}

function Tarjeta({ nombre, texto }: { nombre: string; texto: string }) {
  return (
    <figure className="radius flex h-full min-h-[13.5rem] flex-col border border-hair-dark bg-white/50 p-6">
      <Estrellas oscuro />
      <blockquote className="clamp-4 mt-5 flex-1 text-[0.9375rem] leading-relaxed text-ink-dark">
        {texto}
      </blockquote>
      <figcaption className="mt-5 text-[0.8125rem] text-muted-dark">{nombre}</figcaption>
    </figure>
  );
}
