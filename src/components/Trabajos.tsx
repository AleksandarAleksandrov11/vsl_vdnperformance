'use client';

import { TRABAJOS } from '@/lib/content';
import { Picture } from './Picture';
import { Eyebrow, H2_CLASS, Reveal, Section, Titular } from './kit';

/**
 * Carrusel horizontal con scroll-snap nativo: se arrastra con el dedo, tiene el
 * rebote del sistema y no necesita ni una línea de librería.
 *
 * Todas las tarjetas miden exactamente lo mismo: el ancho lo fija la clase y el
 * alto sale de un aspect-ratio 4:5 fijo, así que da igual lo que ocupe el texto.
 */
export function Trabajos() {
  return (
    <Section labelledBy="trabajos-t" className="overflow-hidden">
      <div className="shell">
        <Reveal>
          <Eyebrow>Trabajos</Eyebrow>
        </Reveal>
        <Titular
          id="trabajos-t"
          lineas={['Coches reales.', 'Resultados reales.']}
          className={`${H2_CLASS} mt-4`}
        />
      </div>

      {/* El carril sangra hasta el borde y el padding hace de margen: la primera
          tarjeta queda alineada con el titular y la última no se pega al borde. */}
      <div
        role="region"
        aria-label="Trabajos realizados"
        tabIndex={0}
        className="scrollbar-none rail mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 md:gap-4 lg:mt-16"
      >
        {TRABAJOS.map((t) => (
          <article
            key={t.modelo}
            className="w-[74vw] max-w-[20rem] shrink-0 snap-start sm:w-[46vw] lg:w-[21rem]"
          >
            <div className="veil-soft radius relative aspect-[4/5] overflow-hidden bg-surface">
              {t.imagen ? (
                <Picture
                  name={t.imagen}
                  alt={`${t.modelo}, ${t.etiqueta}`}
                  sizes="(max-width: 640px) 74vw, (max-width: 1024px) 46vw, 336px"
                  className="block h-full w-full"
                  imgClassName="photo h-full w-full object-cover"
                />
              ) : (
                <SinFoto />
              )}

              <div className="absolute inset-x-0 bottom-0 z-10 p-5">
                <h3 className="text-[1.0625rem] leading-tight font-medium">{t.modelo}</h3>
                <p className="mt-1 text-[0.8125rem] text-muted">{t.etiqueta}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/**
 * Hueco para el coche del que todavía no hay foto.
 * TODO: sustituir por la foto real del Golf R 7.5 en cuanto llegue
 * (ver assets-src/README.md y scripts/build-assets.mjs).
 */
function SinFoto() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-surface">
      <p className="text-[0.75rem] text-muted">Foto en camino</p>
    </div>
  );
}
