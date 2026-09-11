'use client';

import { useState } from 'react';
import { FORM_ID } from '@/lib/config';
import { OTROS_SERVICIOS, SERVICIOS } from '@/lib/content';
import { Picture } from './Picture';
import { ArrowDown, Eyebrow, GlowCard, H2, Lead, Reveal, Section } from './ui';

export function Servicios() {
  return (
    <Section id="servicios" labelledBy="servicios-t" className="overflow-hidden">
      {/* Foto de fondo muy apagada: da profundidad sin robar protagonismo. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22]">
        <Picture
          name="servicios-wide"
          alt=""
          sizes="100vw"
          className="block h-full w-full"
          imgClassName="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #0A0A0C 0%, rgba(10,10,12,0.6) 45%, #0A0A0C 100%)',
          }}
        />
      </div>

      <div className="shell gutter">
        <Reveal className="max-w-[40rem]">
          <Eyebrow>Servicios</Eyebrow>
          <H2 id="servicios-t">Elige hasta dónde quieres llegar</H2>
          <Lead>
            Del Stage 1, que es sólo electrónica, a una preparación completa. Te decimos lo que le
            viene bien a tu coche, no lo que más nos interesa vender.
          </Lead>
        </Reveal>

        <ul className="mt-10 grid gap-4 lg:grid-cols-3">
          {SERVICIOS.map((s, i) => (
            <Reveal key={s.id} as="li" delay={i * 80} className="h-full">
              <GlowCard
                className={`flex h-full flex-col p-5 sm:p-6 ${
                  s.destacado ? 'border-blue-500/45 bg-[#0e1220]' : ''
                }`}
              >
                {s.destacado && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px"
                    style={{ background: 'linear-gradient(90deg,transparent,#2E7BFF,transparent)' }}
                  />
                )}

                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl tracking-wide text-chalk sm:text-[1.75rem]">{s.nombre}</h3>
                  {s.etiqueta && (
                    <span className="bg-blue-grad shrink-0 rounded-md px-2 py-1 text-[0.6875rem] font-semibold tracking-wide text-white uppercase">
                      {s.etiqueta}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-[0.9375rem] text-mist">{s.descripcion}</p>
                <p className="mt-2 text-[0.875rem] text-smoke">{s.detalle}</p>

                <p
                  className={`font-display mt-5 text-xl font-bold ${
                    s.destacado ? 'text-blue-grad' : 'text-chalk'
                  }`}
                >
                  {s.precio}
                </p>

                <a
                  href={`#${FORM_ID}`}
                  className={`tap mt-4 flex items-center justify-center gap-2 rounded-xl px-4 text-[0.9375rem] font-semibold transition-[transform,background-color,border-color] duration-200 active:scale-[0.98] ${
                    s.destacado
                      ? 'bg-blue-grad glow-blue text-white'
                      : 'border border-[#2f3038] bg-white/[0.045] text-chalk hover:border-blue-400/60'
                  }`}
                >
                  {s.cta}
                  <ArrowDown />
                </a>
              </GlowCard>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={80} className="mt-6">
          <OtrosServicios />
        </Reveal>
      </div>
    </Section>
  );
}

/** Acordeón compacto con los servicios sueltos que no son un Stage. */
function OtrosServicios() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#25262e] bg-[#121218]">
      <h3>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls="otros-servicios"
          className="tap flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <span className="text-[0.9375rem] tracking-wide text-chalk sm:text-base">
            Otros servicios
          </span>
          <span className="flex items-center gap-2 text-[0.8125rem] font-normal normal-case">
            <span className="hidden text-smoke sm:inline">
              Pops &amp; Bangs, Hardcut, EGR, DPF, Stage 0
            </span>
            <Chevron abierto={abierto} />
          </span>
        </button>
      </h3>

      <div
        id="otros-servicios"
        hidden={!abierto}
        className="border-t border-[#22232b] px-5 pt-4 pb-5"
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OTROS_SERVICIOS.map((o) => (
            <li key={o.nombre} className="rounded-xl border border-[#22232b] bg-[#16161c] p-3.5">
              <p className="font-display text-sm font-semibold tracking-wide text-blue-300 uppercase">
                {o.nombre}
              </p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-smoke">{o.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Chevron({ abierto, className = '' }: { abierto: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden
      className={`h-4 w-4 shrink-0 text-blue-300 transition-transform duration-300 ${
        abierto ? 'rotate-180' : ''
      } ${className}`}
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
