'use client';

import { CIFRAS } from '@/lib/content';
import { Contador, Reveal } from './kit';

/**
 * Cuatro celdas idénticas: 2×2 en móvil y en fila en escritorio.
 * Sin líneas ni tarjetas: las separa el aire y nada más.
 */
export function Cifras() {
  return (
    <section aria-label="VDN Performance en cifras" className="relative isolate bg-surface">
      <div className="shell">
        <ul className="grid grid-cols-2 gap-y-4 py-12 lg:grid-cols-4 lg:py-16">
          {CIFRAS.map((c, i) => (
            <Reveal
              key={c.pie}
              as="li"
              delay={i * 80}
              className="flex flex-col items-center justify-center text-center lg:items-start lg:pr-5 lg:text-left"
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
