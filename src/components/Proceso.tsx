'use client';

import { useEffect, useRef, useState } from 'react';
import { PASOS } from '@/lib/content';
import { Picture } from './Picture';
import { Eyebrow, H2_CLASS, Reveal, RevealImg, Section, Titular } from './kit';

/**
 * Escritorio: la columna de la izquierda se queda fija (sticky) y los pasos
 * avanzan con el scroll; la foto cambia con el paso activo.
 * Móvil: los tres pasos apilados, cada uno con su foto y su revelado.
 *
 * Son dos maquetados distintos del mismo contenido, no dos contenidos: el móvil
 * no puede permitirse una sección fijada de tres pantallas de alto.
 */
export function Proceso() {
  return (
    <Section tone="void" textura="grain" labelledBy="proceso-t">
      <div className="shell">
        <Reveal>
          <Eyebrow>Cómo funciona</Eyebrow>
        </Reveal>
        <Titular id="proceso-t" lineas={['Así de fácil.']} className={`${H2_CLASS} mt-4`} />
      </div>

      <ProcesoMovil />
      <ProcesoEscritorio />
    </Section>
  );
}

/* ------------------------------------------------------------------ */

function ProcesoMovil() {
  return (
    <div className="shell mt-14 space-y-16 lg:hidden">
      {PASOS.map((p, i) => (
        <div key={p.n}>
          <RevealImg className="radius relative aspect-[4/5] overflow-hidden bg-surface">
            <Picture
              name={p.imagen}
              sizes="92vw"
              className="block h-full w-full"
              imgClassName="photo h-full w-full object-cover"
            />
          </RevealImg>

          <Reveal delay={80} className="mt-6 flex gap-5">
            <span className="num shrink-0 text-[0.8125rem] text-muted">{p.n}</span>
            <div>
              <h3 className="text-[1.5rem]">{p.titulo}</h3>
              <p className="mt-2 text-[0.9375rem] text-muted">{p.linea}</p>
            </div>
          </Reveal>
          {i < PASOS.length - 1 && <div aria-hidden className="mt-16 h-px bg-hair" />}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ProcesoEscritorio() {
  const contenedor = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(0);

  /**
   * El paso activo sale de cuánto se ha recorrido el contenedor, no de un
   * IntersectionObserver por paso: así el cambio cae siempre en el mismo punto
   * del scroll y la foto no parpadea entre dos pasos.
   */
  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const recorrido = (window.innerHeight * 0.5 - r.top) / r.height;
        const i = Math.max(0, Math.min(PASOS.length - 1, Math.floor(recorrido * PASOS.length)));
        setActivo(i);
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={contenedor} className="shell mt-20 hidden lg:block">
      <div className="grid grid-cols-2 gap-20">
        {/* Columna fija con la foto */}
        <div className="sticky top-24 h-fit">
          <div className="radius relative aspect-[4/5] overflow-hidden bg-surface">
            {PASOS.map((p, i) => (
              <div
                key={p.n}
                className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: activo === i ? 1 : 0 }}
                aria-hidden={activo !== i}
              >
                <Picture
                  name={p.imagen}
                  sizes="50vw"
                  className="block h-full w-full"
                  imgClassName="photo h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Columna que scrollea con los pasos */}
        {/* El paso activo se distingue por color, no bajando la opacidad del
            bloque: un texto al 32 % se queda muy por debajo del contraste
            mínimo y deja de ser legible de verdad, no sólo "apagado". */}
        <ol>
          {PASOS.map((p, i) => (
            <li key={p.n} className="flex min-h-[60vh] flex-col justify-center">
              <span className="num text-[0.8125rem] text-muted">{p.n}</span>
              <h3
                className={`mt-4 text-[clamp(2rem,3.4vw,3rem)] transition-colors duration-500 ${
                  activo === i ? 'text-ink' : 'text-muted'
                }`}
              >
                {p.titulo}
              </h3>
              <p className="mt-4 text-[1.0625rem] text-muted">{p.linea}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
