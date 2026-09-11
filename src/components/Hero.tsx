'use client';

import { useEffect, useRef } from 'react';
import { FORM_ID, SITE } from '@/lib/config';
import { IMAGES } from '@/lib/images.generated';
import { useReducedMotion } from '@/lib/hooks';
import { Picture } from './Picture';
import { BotonPrincipal, EnlaceWhatsapp, H1_CLASS, Titular } from './kit';

const CONFIANZA = ['★ 5,0 en Google', '15 días de garantía', 'Listo en el día'];

export function Hero() {
  const foto = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  /**
   * Dos movimientos sobre la misma capa, combinados en un solo transform:
   * un zoom lento al cargar (1,08 → 1) y un parallax suave al hacer scroll.
   * Se lee el scroll dentro de un rAF y se para en cuanto el hero sale de
   * pantalla, así que no se nota en el hilo principal.
   */
  useEffect(() => {
    const el = foto.current;
    if (!el) return;
    /* Se consulta aquí y no por el estado de React: el estado llega un render
       más tarde y para entonces el zoom ya habría dejado un transform puesto. */
    if (reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.transform = '';
      return;
    }

    let raf = 0;
    let dentro = true;
    const t0 = performance.now();
    const DURACION_ZOOM = 2600;

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([e]) => {
            dentro = e.isIntersecting;
          })
        : undefined;
    io?.observe(el);

    const pintar = (t: number) => {
      const p = Math.min(1, (t - t0) / DURACION_ZOOM);
      const eased = 1 - Math.pow(1 - p, 3);
      const escala = 1.08 - 0.08 * eased;
      const y = Math.min(window.scrollY * 0.3, 120);
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${escala.toFixed(4)})`;
      if (p < 1) raf = requestAnimationFrame(pintar);
      else raf = 0;
    };
    raf = requestAnimationFrame(pintar);

    const onScroll = () => {
      if (raf || !dentro) return;
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY * 0.3, 120);
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(1)`;
        raf = 0;
      });
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
          className="block h-full w-full"
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
          delay={120}
          className={`${H1_CLASS} mt-5 max-w-[14ch]`}
        />

        <p className="mt-5 max-w-[30ch] text-[1.0625rem] text-muted">
          Reprogramación a medida. Stage 1 desde {SITE.precioStage1} €.
        </p>

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <BotonPrincipal href={`#${FORM_ID}`} className="w-full sm:w-auto">
            Calcular mi coche
          </BotonPrincipal>
          <EnlaceWhatsapp className="text-[0.9375rem] text-muted underline decoration-white/20 underline-offset-[6px] transition-colors duration-300 hover:text-ink">
            Hablar por WhatsApp
          </EnlaceWhatsapp>
        </div>

        {/* Separadores como pseudoelemento del propio elemento, no como un
            hueco suelto: así nunca se despegan del texto al saltar de línea. */}
        <ul className="mt-10 flex flex-wrap items-center gap-y-2 text-[0.75rem] text-muted">
          {CONFIANZA.map((t, i) => (
            <li
              key={t}
              className={i > 0 ? 'border-l border-white/15 pl-4 ml-4' : ''}
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
