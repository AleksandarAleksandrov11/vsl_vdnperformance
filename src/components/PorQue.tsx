'use client';

import { RAZONES } from '@/lib/content';
import { Contador, Eyebrow, GlowCard, H2, Lead, Reveal, Section } from './ui';

export function PorQue() {
  return (
    <Section labelledBy="porque-t" className="overflow-hidden">
      <div className="shell gutter">
        <Reveal className="max-w-[38rem]">
          <Eyebrow>Por qué nosotros</Eyebrow>
          <H2 id="porque-t">¿Por qué VDN Performance?</H2>
          <Lead>
            Un taller real, con un profesional detrás que te explica lo que le hace a tu coche y no
            promete lo que no puede cumplir.
          </Lead>
        </Reveal>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {RAZONES.map((r, i) => (
            <Reveal key={r.titulo} as="li" delay={i * 70} className="h-full">
              <GlowCard className="flex h-full flex-col p-4 sm:p-6">
                <p className="font-display text-[clamp(1.9rem,8vw,2.9rem)] leading-none font-bold">
                  <span className="text-blue-grad">
                    <Contador to={r.valor} prefijo={r.prefijo} sufijo={r.sufijo} />
                  </span>
                </p>
                <h3 className="mt-3 text-[0.9375rem] tracking-wide text-chalk sm:text-base">
                  {r.titulo}
                </h3>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-smoke sm:text-sm">
                  {r.texto}
                </p>
              </GlowCard>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}
