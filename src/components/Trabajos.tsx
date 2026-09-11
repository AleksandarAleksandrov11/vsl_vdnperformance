'use client';

import { TRABAJOS } from '@/lib/content';
import { Picture } from './Picture';
import { Eyebrow, H2_CLASS, Reveal, Section, Titular } from './kit';

/**
 * Carrusel que se mueve solo hacia la izquierda, sin parar.
 *
 * La lista se pinta dos veces y la tira se desplaza un -50 %: cuando termina la
 * primera copia, la segunda está exactamente donde empezó, así que el salto no
 * se ve. Es una única animación de `transform`, que resuelve el compositor.
 *
 * Se puede parar y arrastrar: al pasar el ratón o tocar con el dedo la animación
 * se pausa, y el propio contenedor tiene scroll horizontal, así que el gesto de
 * arrastrar sigue funcionando como en cualquier carrusel.
 *
 * Todas las tarjetas miden lo mismo: ancho fijo y `aspect-ratio` 4:5.
 */
export function Trabajos() {
  const tira = [...TRABAJOS, ...TRABAJOS];

  return (
    <Section tone="surface" labelledBy="trabajos-t" className="overflow-hidden">
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

      <div
        role="region"
        aria-label="Trabajos realizados"
        tabIndex={0}
        className="scrollbar-none group/car mt-12 overflow-x-auto overscroll-x-contain lg:mt-16"
      >
        <div
          className="anim-marquee flex w-max gap-3 md:gap-4"
          style={{ ['--marquee-duration' as string]: `${TRABAJOS.length * 7}s` }}
        >
          {tira.map((t, i) => (
            <article
              key={`${t.modelo}-${i}`}
              /* La segunda copia es puro relleno visual: un lector de pantalla
                 no tiene por qué oír la lista de coches dos veces. */
              aria-hidden={i >= TRABAJOS.length}
              className="w-[74vw] max-w-[20rem] shrink-0 sm:w-[46vw] lg:w-[21rem]"
            >
              <div className="veil-soft radius relative aspect-[4/5] overflow-hidden bg-void">
                <Picture
                  name={t.imagen}
                  alt={i >= TRABAJOS.length ? '' : `${t.modelo}, ${t.etiqueta}`}
                  sizes="(max-width: 640px) 74vw, (max-width: 1024px) 46vw, 336px"
                  className="block h-full w-full"
                  imgClassName="photo h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 z-10 p-5">
                  <h3 className="text-[1.0625rem] leading-tight font-medium">{t.modelo}</h3>
                  <p className="mt-1 text-[0.8125rem] text-muted">{t.etiqueta}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
