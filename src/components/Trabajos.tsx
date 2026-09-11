'use client';

import { TRABAJOS } from '@/lib/content';
import { Picture } from './Picture';
import { CtaFormulario, Eyebrow, H2, Lead, Reveal, Section } from './ui';

export function Trabajos() {
  return (
    <Section labelledBy="trabajos-t" defer>
      <div className="shell gutter">
        <Reveal className="max-w-[38rem]">
          <Eyebrow>Trabajos reales</Eyebrow>
          <H2 id="trabajos-t">Coches que han salido de aquí</H2>
          <Lead>
            Sin fotos de banco de imágenes. Todo lo que ves son coches de clientes que han pasado
            por el taller de Collado Villalba.
          </Lead>
        </Reveal>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {TRABAJOS.map((t, i) => (
            <Reveal
              key={t.modelo}
              as="li"
              delay={(i % 3) * 70}
              /* La quinta tarjeta ocupa dos columnas en móvil para que la
                 cuadrícula no quede coja con cinco elementos. */
              className={`h-full ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}
            >
              <article className="group relative h-full overflow-hidden rounded-2xl border border-[#25262e] bg-[#121218]">
                <div className={`relative ${i === 4 ? 'aspect-[16/10] lg:aspect-[4/5]' : 'aspect-[4/5]'}`}>
                  {t.imagen ? (
                    <Picture
                      name={t.imagen}
                      alt={`${t.modelo} · ${t.trabajo} en VDN Performance`}
                      sizes="(max-width: 640px) 46vw, (max-width: 1024px) 46vw, 30vw"
                      className="block h-full w-full"
                      imgClassName="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                    />
                  ) : (
                    <Placeholder modelo={t.modelo} />
                  )}

                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(10,10,12,0) 34%, rgba(10,10,12,0.82) 78%, rgba(10,10,12,0.96) 100%)',
                    }}
                  />

                  <span className="absolute top-2.5 right-2.5 rounded-md border border-blue-400/40 bg-ink/75 px-2 py-1 text-[0.6875rem] font-semibold text-blue-200 backdrop-blur-sm">
                    {t.destacado}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                    <h3 className="text-[0.9375rem] leading-tight tracking-wide text-chalk sm:text-base">
                      {t.modelo}
                    </h3>
                    <p className="mt-0.5 text-[0.75rem] text-mist sm:text-[0.8125rem]">{t.trabajo}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={60} className="mt-9 text-center">
          <CtaFormulario className="w-full sm:w-auto sm:px-8">
            Quiero saber cuánto gana el mío
          </CtaFormulario>
        </Reveal>
      </div>
    </Section>
  );
}

/**
 * Hueco elegante para un coche del que todavía no hay foto.
 * TODO: sustituir por la foto real en cuanto la mande el cliente
 * (ver assets-src/README.md y scripts/build-assets.mjs).
 */
function Placeholder({ modelo }: { modelo: string }) {
  return (
    <div className="bg-tech-grid absolute inset-0 grid place-items-center bg-[#101015]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'radial-gradient(70% 50% at 50% 45%, rgba(30,107,240,0.16), transparent 70%)' }}
      />
      <div className="relative px-4 text-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3c3f4a"
          strokeWidth="1.5"
          aria-hidden
          className="mx-auto h-8 w-8"
        >
          <path d="M3 17h18M5 17l1.6-5.2A2 2 0 0 1 8.5 10h7a2 2 0 0 1 1.9 1.4L19 17M6.5 17v2M17.5 17v2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-2 text-[0.6875rem] tracking-wide text-[#7c7f8a]">
          Foto de {modelo} en camino
        </p>
      </div>
    </div>
  );
}
