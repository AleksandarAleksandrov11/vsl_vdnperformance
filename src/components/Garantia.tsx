'use client';

import { FORM_ID } from '@/lib/config';
import { BotonPrincipal, H2_CLASS, Reveal, Titular } from './kit';

/**
 * Bloque centrado, sin foto y sin adornos: sólo la promesa y el botón.
 * Sigue en fondo claro, pegado a las reseñas, para que las dos secciones se
 * lean como un solo respiro dentro de la página negra.
 */
export function Garantia() {
  return (
    <section
      aria-labelledby="garantia-t"
      className="bg-paper pt-24 pb-24 text-center text-ink-dark lg:pt-40 lg:pb-40"
    >
      <div className="shell">
        <Titular
          id="garantia-t"
          lineas={['15 días', 'para decidir.']}
          className={`${H2_CLASS} mx-auto max-w-[16ch]`}
        />

        <Reveal delay={140}>
          <p className="mx-auto mt-6 max-w-[32ch] text-[1.0625rem] text-muted-dark">
            Si no notas la diferencia, volvemos a original.
          </p>

          <BotonPrincipal href={`#${FORM_ID}`} className="mt-10 w-full sm:w-auto">
            Calcular mi coche
          </BotonPrincipal>
        </Reveal>
      </div>
    </section>
  );
}
