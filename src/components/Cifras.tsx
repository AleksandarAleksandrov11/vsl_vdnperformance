'use client';

import { CIFRAS } from '@/lib/content';
import { Contador, Reveal } from './kit';

/**
 * Cuatro celdas idénticas: 2×2 en móvil y en fila en escritorio.
 * Las separan líneas finas, no tarjetas: menos elementos, más aire.
 */
export function Cifras() {
  return (
    <section aria-label="VDN Performance en cifras" className="bg-void">
      <div className="shell">
        <ul className="grid grid-cols-2 border-t border-hair lg:grid-cols-4">
          {CIFRAS.map((c, i) => (
            <Reveal
              key={c.pie}
              as="li"
              delay={i * 80}
              className={`flex h-32 flex-col justify-center border-b border-hair py-8 sm:h-36 lg:h-40 ${
                // Separadores internos: nunca en la primera columna de cada fila.
                i % 2 === 1 ? 'border-l pl-5 sm:pl-8' : 'pr-5'
              } lg:border-l lg:pl-8 lg:first:border-l-0 lg:first:pl-0`}
            >
              <p className="num text-[clamp(2rem,7vw,3.25rem)] leading-none font-medium tracking-[-0.03em] text-ink">
                <Contador
                  to={c.valor}
                  prefijo={c.prefijo}
                  sufijo={c.sufijo}
                  decimales={c.decimales ?? 0}
                />
              </p>
              <p className="mt-2 text-[0.8125rem] text-muted">{c.pie}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
