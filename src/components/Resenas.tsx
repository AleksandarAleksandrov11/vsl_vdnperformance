'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SITE } from '@/lib/config';
import { RESENAS } from '@/lib/content';
import { Estrellas, Eyebrow, H2_CLASS, Reveal, Section, Titular } from './kit';

/**
 * Sección clara, el respiro de la página.
 *
 * Móvil: carrusel con scroll-snap y dos flechas a los lados. Arrastrar con el
 * dedo sigue funcionando igual; las flechas son para quien prefiere ir tocando.
 * Escritorio: rejilla 3×2 con filas iguales.
 *
 * Las seis tarjetas miden lo mismo: altura mínima fija y texto recortado a
 * cuatro líneas, así ninguna descuadra la rejilla.
 */
export function Resenas() {
  const carril = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);

  /** El índice es la tarjeta cuyo centro está más cerca del centro del carril. */
  const alScroll = useCallback(() => {
    const el = carril.current;
    if (!el) return;
    const centro = el.scrollLeft + el.clientWidth / 2;
    let mejor = 0;
    let dist = Infinity;
    [...el.children].forEach((hijo, i) => {
      const h = hijo as HTMLElement;
      const d = Math.abs(h.offsetLeft + h.clientWidth / 2 - centro);
      if (d < dist) {
        dist = d;
        mejor = i;
      }
    });
    setIndice(mejor);
  }, []);

  useEffect(() => {
    const el = carril.current;
    if (!el) return;
    el.addEventListener('scroll', alScroll, { passive: true });
    return () => el.removeEventListener('scroll', alScroll);
  }, [alScroll]);

  /**
   * Da la vuelta: de la última se pasa a la primera y al revés. El salto largo
   * se hace sin animar; arrastrar 8 pantallas de reseñas para volver al
   * principio se ve como un fallo, no como un carrusel.
   */
  const ir = (delta: number) => {
    const el = carril.current;
    if (!el) return;
    const n = RESENAS.length;
    const destino = (indice + delta + n) % n;
    const hijo = el.children[destino] as HTMLElement | undefined;
    if (!hijo) return;
    const vuelta = Math.abs(destino - indice) > 1;
    el.scrollTo({
      left: hijo.offsetLeft - (el.clientWidth - hijo.clientWidth) / 2,
      behavior: vuelta ? 'auto' : 'smooth',
    });
  };

  return (
    <Section tone="paper" labelledBy="resenas-t" className="overflow-hidden pb-0 lg:pb-0">
      <div className="shell">
        <Reveal>
          <Eyebrow className="!text-muted-dark">Opiniones</Eyebrow>
        </Reveal>
        <Titular id="resenas-t" lineas={['5,0 en Google.']} className={`${H2_CLASS} mt-4`} />
      </div>

      {/* --- Móvil: carrusel centrado, con flechas --- */}
      <div className="relative mt-10 lg:hidden">
        {/* El relleno lateral es justo el que falta para que una tarjeta de
            82vw quede centrada: (100 - 82) / 2. Sin él, la primera y la última
            no pueden llegar al centro por mucho que se arrastre. */}
        <div
          ref={carril}
          role="region"
          aria-label="Opiniones de clientes en Google"
          tabIndex={0}
          className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[9vw] pb-1"
        >
          {RESENAS.map((r) => (
            <div key={r.nombre} className="w-[82vw] shrink-0 snap-center">
              <Tarjeta {...r} />
            </div>
          ))}
        </div>

        <FlechaCarrusel lado="izquierda" onClick={() => ir(-1)} />
        <FlechaCarrusel lado="derecha" onClick={() => ir(1)} />

        {/* Puntos: en nueve reseñas, sin ellos no se sabe por dónde vas. */}
        <div aria-hidden className="mt-5 flex justify-center gap-1.5">
          {RESENAS.map((r, i) => (
            <span
              key={r.nombre}
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                i === indice ? 'bg-ink-dark' : 'bg-black/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* --- Escritorio: rejilla --- */}
      <div className="shell mt-12 hidden lg:mt-14 lg:block">
        <ul className="grid auto-rows-fr grid-cols-3 gap-4">
          {RESENAS.map((r, i) => (
            <Reveal key={r.nombre} as="li" delay={(i % 3) * 80} className="h-full">
              <Tarjeta {...r} />
            </Reveal>
          ))}
        </ul>
      </div>

      <div className="shell mt-10">
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

/* ------------------------------------------------------------------ */

function FlechaCarrusel({ lado, onClick }: { lado: 'izquierda' | 'derecha'; onClick: () => void }) {
  const izq = lado === 'izquierda';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={izq ? 'Opinión anterior' : 'Opinión siguiente'}
      className={`absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-hair-dark bg-paper/90 text-ink-dark shadow-[0_2px_12px_rgba(0,0,0,0.1)] backdrop-blur-sm ${
        izq ? 'left-1' : 'right-1'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
        className="h-4 w-4"
        style={{ transform: izq ? 'rotate(180deg)' : undefined }}
      >
        <path d="M5 12h13M12 5.5 18.5 12 12 18.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
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
