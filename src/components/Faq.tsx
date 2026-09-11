'use client';

import { useState } from 'react';
import { FAQ } from '@/lib/content';
import { Chevron } from './Servicios';
import { Eyebrow, H2, Lead, Reveal, Section } from './ui';

export function Faq() {
  /* Acordeón de apertura única: dos preguntas abiertas a la vez obligan a
     buscar, y en móvil dejan la respuesta fuera de pantalla. */
  const [abierta, setAbierta] = useState<number | null>(0);

  return (
    <Section alt labelledBy="faq-t" defer>
      <div className="shell gutter">
        <Reveal className="max-w-[38rem]">
          <Eyebrow>Dudas razonables</Eyebrow>
          <H2 id="faq-t">Preguntas frecuentes</H2>
          <Lead>Lo que nos preguntan casi todos los días, contestado sin rodeos.</Lead>
        </Reveal>

        <div className="mx-auto mt-9 max-w-3xl">
          <ul className="space-y-2.5">
            {FAQ.map((f, i) => {
              const abierto = abierta === i;
              return (
                <li
                  key={f.p}
                  className={`overflow-hidden rounded-2xl border bg-[#16161c] transition-colors duration-300 ${
                    abierto ? 'border-blue-500/40' : 'border-[#25262e]'
                  }`}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setAbierta(abierto ? null : i)}
                      aria-expanded={abierto}
                      aria-controls={`faq-r-${i}`}
                      id={`faq-p-${i}`}
                      className="tap flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5"
                    >
                      <span className="text-[0.9375rem] leading-snug tracking-wide text-chalk sm:text-base">
                        {f.p}
                      </span>
                      <Chevron abierto={abierto} />
                    </button>
                  </h3>
                  <div
                    id={`faq-r-${i}`}
                    role="region"
                    aria-labelledby={`faq-p-${i}`}
                    hidden={!abierto}
                    className="px-4 pb-4 sm:px-5 sm:pb-5"
                  >
                    <p className="border-t border-[#22232b] pt-3 text-[0.9375rem] leading-relaxed text-mist">
                      {f.r}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Section>
  );
}
