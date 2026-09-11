'use client';

import { useEffect, useState } from 'react';
import { FORM_ID, waLink } from '@/lib/config';
import { trackContact } from '@/lib/tracking';
import { IconoWhatsapp } from './kit';

/**
 * Única pieza fija en móvil: aparece cuando el hero ya ha pasado y desaparece
 * con el formulario en pantalla. No hay botón flotante de WhatsApp aparte —
 * va aquí dentro, para no amontonar dos elementos en la misma esquina.
 *
 * Se mueve sólo con transform, nunca cambiando `bottom`: así el aviso de
 * cookies puede apartarla sin provocar un salto de contenido.
 */
export function BarraMovil() {
  const [pasadoHero, setPasadoHero] = useState(false);
  const [enFormulario, setEnFormulario] = useState(false);
  const [ctaALaVista, setCtaALaVista] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setPasadoHero(window.scrollY > window.innerHeight * 0.8);
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const form = document.getElementById(FORM_ID);
    let io: IntersectionObserver | undefined;
    if (form && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => setEnFormulario(e.isIntersecting), {
        rootMargin: '0px 0px -25% 0px',
      });
      io.observe(form);
    }

    /* Regla del diseño: un solo botón principal en pantalla. Si la sección que
       se está mirando ya tiene el suyo, la barra sobra y se aparta. */
    let ioCta: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      const vistos = new Set<Element>();
      ioCta = new IntersectionObserver(
        (entradas) => {
          for (const e of entradas) {
            if (e.isIntersecting) vistos.add(e.target);
            else vistos.delete(e.target);
          }
          setCtaALaVista(vistos.size > 0);
        },
        // Se descuenta el alto de la propia barra: un CTA que queda justo
        // debajo de ella no cuenta como visible.
        { rootMargin: '0px 0px -96px 0px' },
      );
      document.querySelectorAll('[data-cta]').forEach((el) => ioCta?.observe(el));
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
      ioCta?.disconnect();
    };
  }, []);

  const visible = pasadoHero && !enFormulario && !ctaALaVista;

  return (
    <div
      aria-hidden={!visible}
      className="safe-b fixed inset-x-0 bottom-0 z-40 border-t border-hair bg-void/90 backdrop-blur-xl transition-transform duration-500 lg:hidden"
      style={{
        transform: visible
          ? 'translate3d(0, calc(-1 * var(--consent-h, 0px)), 0)'
          : 'translate3d(0, 120%, 0)',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="flex items-center gap-2 px-5 py-3">
        <a
          href={`#${FORM_ID}`}
          tabIndex={visible ? 0 : -1}
          className="inline-flex h-14 flex-1 items-center justify-center rounded-full bg-accent px-6 text-[0.9375rem] font-medium text-white transition-transform duration-300 active:scale-[0.98]"
        >
          Calcular mi coche
        </a>
        <a
          href={waLink()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackContact('whatsapp')}
          tabIndex={visible ? 0 : -1}
          aria-label="Escríbenos por WhatsApp"
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-hair text-ink transition-colors duration-300 active:scale-[0.98]"
        >
          <IconoWhatsapp />
        </a>
      </div>
    </div>
  );
}
