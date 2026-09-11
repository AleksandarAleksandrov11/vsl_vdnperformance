'use client';

import { SITE } from '@/lib/config';
import { CtaFormulario, CtaWhatsapp, Reveal } from './ui';

export function CtaFinal() {
  return (
    <section
      aria-labelledby="cta-final-t"
      className="defer-paint relative isolate overflow-hidden bg-ink py-20 text-center sm:py-24 lg:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(80% 58% at 50% 0%, rgba(20,74,190,0.3), transparent 68%)' }}
      />
      <div
        aria-hidden
        className="bg-tech-grid absolute inset-0 -z-10 opacity-45"
        style={{
          maskImage: 'radial-gradient(70% 60% at 50% 30%, #000, transparent)',
          WebkitMaskImage: 'radial-gradient(70% 60% at 50% 30%, #000, transparent)',
        }}
      />
      <div aria-hidden className="rule-blue absolute inset-x-0 top-0 h-px opacity-60" />

      <div className="shell gutter">
        <Reveal>
          <h2
            id="cta-final-t"
            className="text-metal mx-auto max-w-[20ch] text-[clamp(2rem,9.2vw,4.25rem)] leading-[0.98]"
          >
            ¿Listo para sacarle todo a tu coche?
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-[1.0625rem] text-mist sm:text-lg">
            Cuatro preguntas, treinta segundos, y te decimos gratis lo que puede ganar. Sin
            compromiso y sin llamadas pesadas.
          </p>

          <div className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row sm:justify-center">
            <CtaFormulario className="w-full sm:w-auto sm:px-8">Calcular mi presupuesto</CtaFormulario>
            <CtaWhatsapp className="w-full sm:w-auto">Escríbenos por WhatsApp</CtaWhatsapp>
          </div>

          <p className="mt-6 text-[0.875rem] text-smoke">
            Abierto todos los días de 8:00 a 23:00 en {SITE.taller.ciudad}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
