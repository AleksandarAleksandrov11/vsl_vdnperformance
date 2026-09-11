'use client';

import { MARCAS } from '@/lib/content';

/**
 * Marquee infinito de marcas.
 *
 * La lista se pinta dos veces y la tira se desplaza un -50 %: justo cuando
 * termina la primera copia, la segunda está exactamente donde empezó la
 * primera, así que el salto al reiniciar no se ve. Es una sola animación de
 * `transform`, que va por composición y no toca el hilo principal.
 *
 * La segunda copia lleva aria-hidden para que un lector de pantalla no lea
 * catorce marcas dos veces.
 */
export function Marcas() {
  const lista = [...MARCAS];

  return (
    <section aria-labelledby="marcas-t" className="relative border-y border-[#1c1d24] bg-ink-2 py-7 sm:py-9">
      <h2 id="marcas-t" className="gutter shell font-display text-center text-xs font-medium tracking-[0.22em] text-smoke uppercase sm:text-sm">
        Reprogramamos todas las marcas
      </h2>

      <div
        className="relative mt-5 overflow-hidden"
        style={{
          // Los extremos se desvanecen para que las marcas no se corten en seco.
          maskImage: 'linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent)',
        }}
      >
        <div className="anim-marquee flex w-max" style={{ ['--marquee-duration' as string]: '42s' }}>
          {[0, 1].map((copia) => (
            <ul key={copia} aria-hidden={copia === 1} className="flex shrink-0 items-center">
              {lista.map((marca) => (
                <li
                  key={marca}
                  className="font-display px-5 text-[0.9375rem] font-semibold tracking-[0.13em] whitespace-nowrap text-[#8a8d97] uppercase transition-colors duration-300 hover:text-chalk sm:px-7 sm:text-lg"
                >
                  {marca}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
