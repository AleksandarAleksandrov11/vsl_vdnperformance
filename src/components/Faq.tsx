'use client';

import { useState } from 'react';
import { FAQ } from '@/lib/content';
import { H2_CLASS, Section, Titular } from './kit';

/**
 * Acordeón de líneas finas, sin tarjetas ni cajas: sólo una regla horizontal
 * entre preguntas. De apertura única, porque con dos respuestas abiertas a la
 * vez en móvil la segunda se va fuera de pantalla.
 */
export function Faq() {
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <Section id="dudas" labelledBy="faq-t">
      <div className="shell">
        <Titular id="faq-t" lineas={['Dudas.']} className={H2_CLASS} />

        <ul className="mt-12 border-t border-hair lg:mt-16">
          {FAQ.map((f, i) => {
            const abierto = abierta === i;
            return (
              <li key={f.p} className="border-b border-hair">
                <h3>
                  <button
                    type="button"
                    onClick={() => setAbierta(abierto ? null : i)}
                    aria-expanded={abierto}
                    aria-controls={`faq-${i}`}
                    id={`faq-b-${i}`}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="text-[1.0625rem] font-medium sm:text-[1.25rem]">{f.p}</span>
                    <Mas abierto={abierto} />
                  </button>
                </h3>
                <div
                  id={`faq-${i}`}
                  role="region"
                  aria-labelledby={`faq-b-${i}`}
                  hidden={!abierto}
                  className="pb-7"
                >
                  <p className="max-w-[56ch] text-[0.9375rem] leading-relaxed text-muted">{f.r}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

/** Cruz que gira 45° para volverse un menos. Sólo transform. */
function Mas({ abierto }: { abierto: boolean }) {
  return (
    <span aria-hidden className="relative block h-4 w-4 shrink-0">
      <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-muted" />
      <span
        className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-muted transition-transform duration-500"
        style={{ transform: `translateY(-50%) rotate(${abierto ? 0 : 90}deg)` }}
      />
    </span>
  );
}
