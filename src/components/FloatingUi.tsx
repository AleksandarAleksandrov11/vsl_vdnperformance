'use client';

import { useEffect, useState } from 'react';
import { FORM_ID, waLink } from '@/lib/config';
import { trackContact } from '@/lib/tracking';
import { ArrowDown, WhatsappIcon } from './ui';

/**
 * Barra inferior fija y botón flotante de WhatsApp.
 *
 * Van juntos en un solo componente porque se estorban entre ellos y hay que
 * coordinarlos:
 *   · La barra aparece cuando el hero ya ha pasado.
 *   · El botón de WhatsApp sube por encima de la barra cuando ésta está puesta,
 *     para no taparla.
 *   · Con el formulario en pantalla desaparecen los dos: la barra sobra (el CTA
 *     ya está delante) y el botón flotante taparía el botón de enviar.
 */
export function FloatingUi() {
  const [pasadoHero, setPasadoHero] = useState(false);
  const [enFormulario, setEnFormulario] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setPasadoHero(window.scrollY > window.innerHeight * 0.72);
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const form = document.getElementById(FORM_ID);
    let io: IntersectionObserver | undefined;
    if (form && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => setEnFormulario(e.isIntersecting), {
        // Se considera "en el formulario" en cuanto asoma por abajo.
        rootMargin: '0px 0px -22% 0px',
      });
      io.observe(form);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, []);

  const barraVisible = pasadoHero && !enFormulario;
  const waVisible = !enFormulario;

  return (
    <>
      {/* --- Botón flotante de WhatsApp --- */}
      <a
        href={waLink()}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackContact('whatsapp')}
        aria-label="Escríbenos por WhatsApp"
        aria-hidden={!waVisible}
        tabIndex={waVisible ? 0 : -1}
        className="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#1FAD55] text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8)] transition-[transform,opacity] duration-300 active:scale-95"
        style={{
          /* `bottom` se queda fijo y el desplazamiento se hace con transform:
             cambiar `bottom` sería un cambio de maquetación y contaría como
             salto de contenido. Se sube por encima de lo que haya debajo: la
             barra inferior (4.5rem) y el aviso de cookies (--consent-h). */
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
          opacity: waVisible ? 1 : 0,
          transform: `translate3d(0, calc(-1 * (var(--consent-h, 0px) + ${
            barraVisible ? '4.5rem' : '0px'
          })), 0) scale(${waVisible ? 1 : 0.6})`,
          pointerEvents: waVisible ? 'auto' : 'none',
        }}
      >
        {/* Halo que late, apagado con prefers-reduced-motion por el CSS global. */}
        <span
          aria-hidden
          className="anim-pulse-ring absolute inset-0 rounded-full bg-[#1FAD55]"
          style={{ zIndex: -1 }}
        />
        <WhatsappIcon className="h-7 w-7" />
      </a>

      {/* --- Barra inferior fija con el CTA principal --- */}
      <div
        aria-hidden={!barraVisible}
        className="safe-b safe-x fixed inset-x-0 bottom-0 z-40 border-t border-[#1e1f26] bg-ink/92 backdrop-blur-xl transition-transform duration-300"
        style={{
          transform: barraVisible
            ? 'translate3d(0, calc(-1 * var(--consent-h, 0px)), 0)'
            : 'translate3d(0, 120%, 0)',
          pointerEvents: barraVisible ? 'auto' : 'none',
        }}
      >
        <div aria-hidden className="rule-blue h-px opacity-50" />
        <div className="shell gutter flex items-center gap-3 py-3">
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="font-display text-sm font-semibold tracking-wide text-chalk uppercase">
              ¿Cuánto gana tu coche?
            </p>
            <p className="truncate text-xs text-smoke">Presupuesto gratis en menos de 24 h</p>
          </div>
          <a
            href={`#${FORM_ID}`}
            tabIndex={barraVisible ? 0 : -1}
            className="bg-blue-grad tap flex flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[0.9375rem] font-semibold text-white shadow-[0_8px_26px_-10px_rgba(30,107,240,0.95)] transition-transform duration-200 active:scale-[0.98] sm:flex-none sm:px-6"
          >
            Calcular gratis
            <ArrowDown />
          </a>
        </div>
      </div>
    </>
  );
}
