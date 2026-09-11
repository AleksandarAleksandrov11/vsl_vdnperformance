'use client';

import { SITE } from '@/lib/config';
import { Picture } from './Picture';
import { BotonCalcular, H1_CLASS, Reveal, Titular } from './kit';

/** Última pantalla: foto a sangre, un titular, un botón. Nada más. */
export function Cierre() {
  return (
    <section
      aria-labelledby="cierre-t"
      className="veil relative isolate flex min-h-[92svh] items-end overflow-hidden"
    >
      <div className="absolute inset-0 -z-10">
        <Picture
          name="cierre-h"
          art={[{ name: 'cierre-v', media: '(max-width: 767px)' }]}
          alt=""
          sizes="100vw"
          className="block h-full w-full"
          imgClassName="photo h-full w-full object-cover"
        />
      </div>

      <div className="shell relative z-10 pb-20 lg:pb-28">
        <Titular id="cierre-t" lineas={['Tu coche.', 'Sin freno.']} className={`${H1_CLASS} max-w-[12ch]`} />

        <Reveal delay={160}>
          <BotonCalcular className="mt-10 w-full sm:w-auto" />
          <p className="mt-8 text-[0.8125rem] text-muted">
            Todos los días de 8:00 a 23:00 · {SITE.taller.ciudad}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
