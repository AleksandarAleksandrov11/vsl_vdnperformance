'use client';

import { GARANTIA_CHECKS } from '@/lib/content';
import { Picture } from './Picture';
import { Check, CtaFormulario, Eyebrow, H2, Reveal, Section } from './ui';

export function Garantia() {
  return (
    <Section labelledBy="garantia-t" defer className="overflow-hidden">
      <div className="shell gutter">
        <div className="relative overflow-hidden rounded-3xl border border-[#25262e] bg-[#0f0f14]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[80%] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl"
          />
          <div aria-hidden className="rule-blue absolute inset-x-0 top-0 h-px opacity-70" />

          <div className="grid items-center gap-8 p-6 sm:p-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:p-12">
            <Reveal>
              <Escudo />
              <Eyebrow className="mt-5">Cero riesgo</Eyebrow>
              <H2 id="garantia-t">
                15 días de prueba.
                <br />
                Cero riesgo.
              </H2>
              <p className="mt-4 max-w-[46ch] text-[1.0625rem] text-mist sm:text-lg">
                Si en 15 días no notas la diferencia, volvemos al mapa original de fábrica. Sólo
                cobramos la recuperación del mapa estándar.
              </p>

              <ul className="mt-6 space-y-2.5">
                {GARANTIA_CHECKS.map((c) => (
                  <li key={c} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-500/15 text-blue-300">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-[0.9375rem] text-chalk">{c}</span>
                  </li>
                ))}
              </ul>

              <CtaFormulario className="mt-8 w-full sm:w-auto sm:px-8">
                Quiero probarlo sin riesgo
              </CtaFormulario>
            </Reveal>

            <Reveal delay={110} className="order-first lg:order-none">
              <div className="relative overflow-hidden rounded-2xl border border-[#24252d]">
                <Picture
                  name="garantia"
                  sizes="(max-width: 1024px) 88vw, 420px"
                  className="block w-full"
                  imgClassName="w-full object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(10,10,12,0.1), rgba(10,10,12,0.25) 60%, rgba(10,10,12,0.7))',
                  }}
                />
                <p className="absolute inset-x-0 bottom-0 p-4 text-[0.8125rem] text-mist">
                  Tu archivo original se guarda siempre. Volver atrás es cuestión de minutos.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Escudo() {
  return (
    <div className="relative inline-grid h-16 w-16 place-items-center">
      <span
        aria-hidden
        className="absolute inset-0 rounded-2xl border border-blue-400/35"
        style={{ background: 'linear-gradient(135deg, rgba(0,71,204,0.3), rgba(46,123,255,0.08))' }}
      />
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className="relative h-8 w-8">
        <path
          d="M12 2.5 20 5.6v6c0 4.5-3.2 8.5-8 9.9-4.8-1.4-8-5.4-8-9.9v-6L12 2.5Z"
          stroke="#5AA0FF"
          strokeWidth="1.6"
          strokeLinejoin="round"
          fill="rgba(46,123,255,0.12)"
        />
        <path
          d="m8.4 12.2 2.5 2.5 4.7-5"
          stroke="#9CC4FF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
