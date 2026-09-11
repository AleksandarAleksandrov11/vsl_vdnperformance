'use client';

import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { useId, useRef, useState } from 'react';
import { FORM_ID } from '@/lib/config';
import { STAGES } from '@/lib/content';
import { useReducedMotion } from '@/lib/hooks';
import { Picture } from './Picture';
import { BotonPrincipal, Eyebrow, H2_CLASS, Reveal, Section, Titular } from './kit';

const TRANS = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const };

/**
 * Selector de stage con pestañas.
 *
 * La altura del bloque no cambia al cambiar de pestaña: la foto tiene una
 * relación de aspecto fija y la columna de texto tiene una altura mínima que
 * cabe el contenido más largo de los tres. Así el botón no se mueve de sitio y
 * no hay salto de maquetación al tocar una pestaña.
 */
export function Stages() {
  const [activo, setActivo] = useState(0);
  const reduced = useReducedMotion();
  const baseId = useId();
  const tabsRef = useRef<HTMLDivElement>(null);

  const stage = STAGES[activo];

  /** Flechas izquierda y derecha entre pestañas, como manda el patrón de tabs. */
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const siguiente =
      e.key === 'ArrowRight'
        ? (activo + 1) % STAGES.length
        : (activo - 1 + STAGES.length) % STAGES.length;
    setActivo(siguiente);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[siguiente]?.focus();
  }

  return (
    <Section labelledBy="stages-t">
      <div className="shell">
        <Reveal>
          <Eyebrow>Servicios</Eyebrow>
        </Reveal>
        <Titular id="stages-t" lineas={['Elige tu nivel.']} className={`${H2_CLASS} mt-4`} />

        {/* --- Pestañas --- */}
        <Reveal delay={120} className="mt-10">
          <div
            ref={tabsRef}
            role="tablist"
            aria-label="Niveles de reprogramación"
            onKeyDown={onKeyDown}
            className="inline-flex rounded-full border border-hair p-1"
          >
            {STAGES.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                id={`${baseId}-tab-${i}`}
                aria-selected={activo === i}
                aria-controls={`${baseId}-panel-${i}`}
                tabIndex={activo === i ? 0 : -1}
                onClick={() => setActivo(i)}
                className={`h-11 rounded-full px-4 text-[0.875rem] font-medium transition-colors duration-300 sm:px-7 ${
                  activo === i ? 'bg-accent text-white' : 'text-muted hover:text-ink'
                }`}
              >
                {s.pestana}
              </button>
            ))}
          </div>
        </Reveal>

        {/* --- Panel --- */}
        <LazyMotion features={domAnimation} strict>
          <div
            role="tabpanel"
            id={`${baseId}-panel-${activo}`}
            aria-labelledby={`${baseId}-tab-${activo}`}
            className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16"
          >
            {/* Foto: el contenedor fija el ratio, así el alto nunca cambia. */}
            <div className="radius relative aspect-[4/3] overflow-hidden bg-surface">
              <AnimatePresence initial={false} mode="popLayout">
                <m.div
                  key={stage.id}
                  initial={{ opacity: 0, scale: reduced ? 1 : 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={TRANS}
                  className="absolute inset-0"
                >
                  <Picture
                    name={stage.imagen}
                    sizes="(max-width: 1024px) 92vw, 560px"
                    className="block h-full w-full"
                    imgClassName="photo h-full w-full object-cover"
                  />
                </m.div>
              </AnimatePresence>
            </div>

            {/* Texto: altura mínima calculada para el stage más largo. */}
            <div className="flex min-h-[19rem] flex-col sm:min-h-[17rem]">
              <AnimatePresence initial={false} mode="wait">
                <m.div
                  key={stage.id}
                  initial={{ opacity: 0, y: reduced ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduced ? 0 : -12 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-1 flex-col"
                >
                  <h3 className="text-[clamp(1.75rem,5.5vw,2.75rem)]">{stage.titulo}</h3>

                  <ul className="mt-7 space-y-0">
                    {stage.puntos.map((p) => (
                      <li
                        key={p}
                        className="border-t border-hair py-3.5 text-[0.9375rem] text-muted last:border-b"
                      >
                        {p}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-7 text-[1.0625rem] text-ink">{stage.precio}</p>
                </m.div>
              </AnimatePresence>

              <BotonPrincipal href={`#${FORM_ID}`} className="mt-7 w-full sm:w-fit">
                {stage.cta}
              </BotonPrincipal>
            </div>
          </div>
        </LazyMotion>
      </div>
    </Section>
  );
}
