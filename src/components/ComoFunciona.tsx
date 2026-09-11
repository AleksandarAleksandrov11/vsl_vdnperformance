'use client';

import { PASOS } from '@/lib/content';
import { useInViewOnce } from '@/lib/hooks';
import { Picture } from './Picture';
import { Eyebrow, H2, Lead, Reveal, Section } from './ui';

/**
 * Los cuatro pasos, unidos por una línea azul que se dibuja al entrar.
 *
 * La línea es un div al que se le anima `transform: scaleY` (vertical en móvil)
 * o `scaleX` (horizontal en escritorio) desde 0. Es un transform puro, así que
 * lo resuelve el compositor y no repinta nada.
 */
export function ComoFunciona() {
  const [ref, visible] = useInViewOnce<HTMLDivElement>({ threshold: 0.18 });

  return (
    <Section alt labelledBy="como-t" className="overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.2]">
        <Picture
          name="proceso-wide"
          alt=""
          sizes="100vw"
          className="block h-full w-full"
          imgClassName="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #111114, rgba(17,17,20,0.55), #111114)' }}
        />
      </div>

      <div className="shell gutter">
        <Reveal className="max-w-[38rem]">
          <Eyebrow>Cómo funciona</Eyebrow>
          <H2 id="como-t">De tu móvil al taller en cuatro pasos</H2>
          <Lead>Sin llamadas eternas ni presupuestos que no llegan. Así de simple.</Lead>
        </Reveal>

        <div ref={ref} className="relative mt-11">
          {/* --- Riel de la línea azul --- */}
          {/* Móvil: vertical, pegada a la columna de los números. */}
          <div
            aria-hidden
            className="absolute top-3 bottom-8 left-[1.375rem] w-px bg-[#24252d] lg:hidden"
          >
            <div
              className="h-full w-full origin-top"
              style={{
                background: 'linear-gradient(180deg, #0047CC, #2E7BFF 55%, rgba(46,123,255,0))',
                transform: visible ? 'scaleY(1)' : 'scaleY(0)',
                transition: 'transform 1500ms cubic-bezier(0.22,1,0.28,1) 120ms',
              }}
            />
          </div>
          {/* Escritorio: horizontal, a la altura de los números. */}
          <div
            aria-hidden
            className="absolute top-[1.375rem] right-[12%] left-[12%] hidden h-px bg-[#24252d] lg:block"
          >
            <div
              className="h-full w-full origin-left"
              style={{
                background: 'linear-gradient(90deg, #0047CC, #2E7BFF 55%, rgba(46,123,255,0.25))',
                transform: visible ? 'scaleX(1)' : 'scaleX(0)',
                transition: 'transform 1500ms cubic-bezier(0.22,1,0.28,1) 120ms',
              }}
            />
          </div>

          <ol className="relative grid gap-7 lg:grid-cols-4 lg:gap-6">
            {PASOS.map((p, i) => (
              <li key={p.n} className="flex gap-4 lg:flex-col lg:items-center lg:text-center">
                <span
                  className="font-display relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border text-lg font-bold transition-[background-color,border-color,color] duration-500"
                  style={{
                    transitionDelay: `${360 + i * 260}ms`,
                    borderColor: visible ? '#2E7BFF' : '#2a2b33',
                    background: visible ? 'linear-gradient(135deg,#0047CC,#1E6BF0)' : '#15161b',
                    color: visible ? '#fff' : '#83868f',
                    boxShadow: visible ? '0 8px 26px -10px rgba(30,107,240,0.9)' : 'none',
                  }}
                >
                  {p.n}
                </span>
                <div className="min-w-0 pt-1 lg:pt-3">
                  <h3 className="text-[1.0625rem] tracking-wide text-chalk sm:text-lg">
                    {p.titulo}
                  </h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-smoke">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
