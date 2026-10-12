'use client';

import { useEffect, useRef } from 'react';
import { FORM_ID, SITE } from '@/lib/config';
import { IMAGES } from '@/lib/images.generated';
import { useReducedMotion } from '@/lib/hooks';
import { Picture } from './Picture';
import { BotonPrincipal, EnlaceWhatsapp, H1_CLASS, Titular } from './kit';

const CONFIANZA = ['★ 5,0 en Google', '15 días de garantía electrónica', 'Listo en una mañana'];

export function Hero() {
  const foto = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  /**
   * Parallax suave al hacer scroll. El zoom de entrada (1,08 → 1) va en CSS
   * (.hero-zoom) sobre la capa de dentro, para que empiece con el primer
   * pintado sin esperar a este JS. Se lee el scroll dentro de un rAF y se para
   * en cuanto el hero sale de pantalla, así que no se nota en el hilo principal.
   */
  useEffect(() => {
    const el = foto.current;
    if (!el) return;
    /* Se consulta aquí y no por el estado de React: el estado llega un render
       más tarde y para entonces ya habría un transform puesto. */
    if (reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.transform = '';
      return;
    }

    let raf = 0;
    let dentro = true;

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([e]) => {
            dentro = e.isIntersecting;
          })
        : undefined;
    io?.observe(el);

    const pintar = () => {
      const y = Math.min(window.scrollY * 0.3, 120);
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      raf = 0;
    };
    if (window.scrollY > 0) pintar();

    const onScroll = () => {
      if (raf || !dentro) return;
      raf = requestAnimationFrame(pintar);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
    };
  }, [reduced]);

  return (
    <section
      id="top"
      className="veil relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden"
      style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* La foto marca el LCP: se precarga desde el HTML, sin esperar a que el
          navegador la descubra dentro del <picture>. Cada media es la misma que
          usa el <picture>, así que sólo se pide el encuadre que toca. */}
      {(
        [
          ['hero-v', '(max-width: 767px)'],
          ['hero-h', '(min-width: 768px)'],
        ] as const
      ).map(([clave, media]) => (
        <link
          key={clave}
          rel="preload"
          as="image"
          type="image/avif"
          media={media}
          imageSrcSet={IMAGES[clave].avif.map((s) => `${s.src} ${s.w}w`).join(', ')}
          imageSizes="100vw"
        />
      ))}

      <div ref={foto} className="absolute inset-0 -z-10 will-change-transform">
        <Picture
          name="hero-h"
          art={[{ name: 'hero-v', media: '(max-width: 767px)' }]}
          sizes="100vw"
          priority
          alt="BMW Serie 3 recién reprogramado saliendo del taller de VDN Performance en Collado Villalba"
          className="hero-zoom block h-full w-full"
          imgClassName="photo h-full w-full object-cover"
        />
      </div>

      <div className="shell hero-lift relative z-10 pb-4">
        <p className="eyebrow">
          {SITE.taller.ciudad} · {SITE.taller.provincia}
        </p>

        <Titular
          as="h1"
          lineas={['Tu coche', 'puede dar más.']}
          alCargar
          className={`${H1_CLASS} mt-5 max-w-[14ch]`}
        />

        <p className="mt-5 max-w-[30ch] text-[1.0625rem] text-muted">
          Reprogramación a medida. Stage 1 desde {SITE.precioStage1} €.
        </p>

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <BotonPrincipal href={`#${FORM_ID}`} className="w-full sm:w-auto">
            Calcular mi coche
          </BotonPrincipal>
          {/* -my compensa el py: el área táctil llega a 45 px en móvil y el enlace
              ocupa en la maquetación lo mismo que antes. */}
          <EnlaceWhatsapp className="-my-[11px] py-[11px] text-[0.9375rem] text-muted underline decoration-white/20 underline-offset-[6px] transition-colors duration-300 hover:text-ink sm:my-0 sm:py-0">
            Hablar por WhatsApp
          </EnlaceWhatsapp>
        </div>

        {/* En móvil van en columna y sin separadores: en una línea no caben los
            tres y, al saltar, la raya de separación se quedaba al principio de
            la segunda línea como si sobrara. */}
        <ul className="mt-10 flex flex-col gap-y-1.5 text-[0.75rem] text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-y-2">
          {CONFIANZA.map((t, i) => (
            <li key={t} className={i > 0 ? 'sm:ml-4 sm:border-l sm:border-white/15 sm:pl-4' : ''}>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
