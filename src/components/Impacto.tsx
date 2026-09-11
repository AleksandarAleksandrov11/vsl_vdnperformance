'use client';

import { Picture } from './Picture';
import { CtaFormulario, Reveal } from './ui';

/** Bloque a sangre, el golpe emocional entre "cómo funciona" y los trabajos. */
export function Impacto() {
  return (
    <section
      aria-labelledby="impacto-t"
      className="relative isolate flex min-h-[78svh] items-center overflow-hidden py-20 sm:min-h-[70svh] lg:py-28"
    >
      <div className="absolute inset-0 -z-20">
        <Picture
          name="impact-wide"
          art={[{ name: 'impact-portrait', media: '(max-width: 639px)' }]}
          alt=""
          sizes="100vw"
          className="block h-full w-full"
          imgClassName="h-full w-full object-cover object-center"
        />
      </div>

      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, #0A0A0C 0%, rgba(10,10,12,0.62) 38%, rgba(10,10,12,0.86) 78%, #0A0A0C 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(90% 60% at 50% 100%, rgba(20,74,190,0.3), transparent 70%)' }}
      />

      <div className="shell gutter relative text-center">
        <Reveal>
          <h2
            id="impacto-t"
            className="text-metal mx-auto max-w-[22ch] text-[clamp(2rem,9.6vw,4.5rem)] leading-[0.98]"
          >
            Tu vecino tiene el mismo coche. Y corre más.
          </h2>
          <p className="mx-auto mt-5 max-w-[44ch] text-[1.0625rem] text-mist sm:text-lg">
            Presupuesto gratis en menos de 24 h y 15 días para volver a original si no te convence.
          </p>
          <CtaFormulario className="mt-8 w-full sm:w-auto sm:px-8">Despierta tu coche</CtaFormulario>
        </Reveal>
      </div>
    </section>
  );
}
