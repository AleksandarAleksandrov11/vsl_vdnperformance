'use client';

import { SITE } from '@/lib/config';
import { RESENAS } from '@/lib/content';
import { CtaGhost, Estrellas, Eyebrow, H2, Lead, Reveal, Section } from './ui';

/**
 * Reseñas de Google.
 * En móvil, carrusel que se arrastra con el dedo y engancha en cada tarjeta
 * (scroll-snap nativo: sin JS, sin librería de carrusel y con el rebote del
 * sistema). A partir de lg pasa a cuadrícula.
 */
export function Resenas() {
  return (
    <Section alt labelledBy="resenas-t" defer className="overflow-hidden">
      <div className="shell gutter">
        <Reveal className="max-w-[38rem]">
          <Eyebrow>Lo que dicen los clientes</Eyebrow>
          <H2 id="resenas-t">5,0 en Google. Sin trampa.</H2>
          <Lead>
            Reseñas reales de gente de la zona que ha dejado su coche aquí. Ninguna está
            retocada ni recortada.
          </Lead>
        </Reveal>
      </div>

      {/* Carrusel: el contenedor sangra hasta el borde y el padding hace de
          margen, así la primera tarjeta queda alineada con el título y la
          última no se pega al borde derecho. */}
      <div
        className="scrollbar-none mt-9 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[clamp(1.25rem,5vw,2.5rem)] pb-2 lg:hidden"
        role="region"
        aria-label="Reseñas de clientes en Google"
        tabIndex={0}
      >
        {RESENAS.map((r) => (
          <div key={r.nombre} className="w-[78vw] max-w-[20rem] shrink-0 snap-start">
            <Tarjeta nombre={r.nombre} texto={r.texto} />
          </div>
        ))}
      </div>

      {/* Cuadrícula de escritorio */}
      <div className="shell gutter mt-9 hidden lg:block">
        <ul className="grid grid-cols-3 gap-4">
          {RESENAS.map((r, i) => (
            <Reveal key={r.nombre} as="li" delay={(i % 3) * 70} className="h-full">
              <Tarjeta nombre={r.nombre} texto={r.texto} />
            </Reveal>
          ))}
        </ul>
      </div>

      <div className="shell gutter mt-8 text-center">
        <p className="font-display text-[0.9375rem] tracking-wide text-chalk">
          <span className="text-blue-grad text-xl font-bold">5,0 ★</span>{' '}
          <span className="text-smoke normal-case">en Google · Más de 20 reseñas</span>
        </p>
        <CtaGhost href={SITE.googleReviews} target="_blank" className="mt-4 w-full sm:w-auto">
          Ver todas las reseñas en Google
        </CtaGhost>
      </div>
    </Section>
  );
}

function Tarjeta({ nombre, texto }: { nombre: string; texto: string }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-[#25262e] bg-[#16161c] p-4 sm:p-5">
      <Estrellas />
      <blockquote className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-mist">
        «{texto}»
      </blockquote>
      <figcaption className="mt-4 flex items-center justify-between gap-3 border-t border-[#22232b] pt-3">
        <span className="truncate text-[0.875rem] font-medium text-chalk">{nombre}</span>
        <a
          href={SITE.googleReviews}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-[0.75rem] text-smoke transition-colors hover:text-blue-300"
        >
          <GoogleG />
          Google
        </a>
      </figcaption>
    </figure>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5">
      <path fill="#4285F4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.9a5.05 5.05 0 0 1-2.19 3.31v2.77h3.54c2.08-1.91 3.25-4.72 3.25-8.09Z" />
      <path fill="#34A853" d="M12 23c2.95 0 5.42-.98 7.23-2.66l-3.54-2.77c-.98.66-2.23 1.05-3.69 1.05-2.85 0-5.26-1.92-6.12-4.5H2.23v2.86A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.88 14.12a6.6 6.6 0 0 1 0-4.23V7.03H2.23a11 11 0 0 0 0 9.94l3.65-2.85Z" />
      <path fill="#EA4335" d="M12 5.38c1.6 0 3.05.55 4.19 1.64l3.14-3.14C17.42 2.1 14.95 1 12 1a11 11 0 0 0-9.77 6.03l3.65 2.86c.86-2.58 3.27-4.5 6.12-4.5Z" />
    </svg>
  );
}
