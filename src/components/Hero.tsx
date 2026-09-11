'use client';

import { useEffect, useRef } from 'react';
import { FORM_ID, SITE } from '@/lib/config';
import { useReducedMotion } from '@/lib/hooks';
import { IMAGES } from '@/lib/images.generated';
import { Picture } from './Picture';
import { ArrowDown, CtaPrimary, CtaWhatsapp } from './ui';

const BADGES = [
  `Stage 1 desde ${SITE.precioStage1} €`,
  `${SITE.garantiaDias} días de garantía`,
  'Presupuesto en menos de 24 h',
  '★ 5,0 en Google',
];

export function Hero() {
  const capaFoto = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  /**
   * Parallax: la foto sube a un tercio de la velocidad del scroll, con tope de
   * 90 px para que no se despegue del encuadre. Sólo se toca `transform`, se
   * lee el scroll dentro de un rAF y se corta en cuanto el hero sale de
   * pantalla, así que en un móvil normal no se nota en el hilo principal.
   */
  useEffect(() => {
    const el = capaFoto.current;
    if (!el || reduced) return;

    let raf = 0;
    let activo = true;

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([e]) => {
            activo = e.isIntersecting;
          })
        : undefined;
    io?.observe(el);

    const onScroll = () => {
      if (raf || !activo) return;
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY * 0.32, 90);
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        raf = 0;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <section
      id="top"
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pt-20 pb-10 sm:justify-center sm:pb-16"
      style={{
        paddingBottom: 'calc(2.25rem + env(safe-area-inset-bottom, 0px))',
        paddingTop: 'calc(4.75rem + env(safe-area-inset-top, 0px))',
      }}
    >
      {/* Se precarga la foto del hero desde aquí (React 19 sube estos <link> al
          head) para que el navegador la pida nada más leer el HTML, sin esperar
          a descubrirla dentro del <picture>. Cada media coincide con el corte
          que usa el <picture>, así que sólo se pide el encuadre que toca.

          Sin fetchPriority alto a propósito: el LCP de esta página lo marca el
          texto del hero, no la foto (Chrome no cuenta como candidato a LCP una
          imagen que cubre toda la pantalla y hace de fondo). Darle prioridad
          alta le quitaría ancho de banda a la hoja de estilos y a la tipografía,
          que son justo lo que sí retrasa al texto. */}
      {(
        [
          ['hero-portrait', '(max-width: 767px)'],
          ['hero-wide', '(min-width: 768px)'],
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

      {/* --- Foto --- */}
      <div ref={capaFoto} className="absolute inset-0 -z-20 will-change-transform">
        <Picture
          name="hero-wide"
          art={[{ name: 'hero-portrait', media: '(max-width: 767px)' }]}
          sizes="100vw"
          priority
          alt="BMW Serie 3 recién reprogramado saliendo del taller de VDN Performance en Collado Villalba"
          className="block h-full w-full"
          imgClassName="h-full w-full object-cover object-[50%_42%]"
        />
      </div>

      {/* --- Velos: oscurecen la foto para que el texto tenga contraste de sobra --- */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,12,0.88) 0%, rgba(10,10,12,0.52) 26%, rgba(10,10,12,0.72) 62%, #0A0A0C 98%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 70% at 50% 108%, rgba(20,74,190,0.34), transparent 62%)',
        }}
      />
      {/* Rejilla técnica, desvaneciéndose hacia abajo. */}
      <div
        aria-hidden
        className="bg-tech-grid absolute inset-0 -z-10 opacity-70"
        style={{
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), transparent 68%)',
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), transparent 68%)',
        }}
      />

      {/* --- Contenido --- */}
      <div className="shell gutter hero-lift relative">
        <div className="max-w-[44rem]">
          <p
            className="anim-rise font-display inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-[0.625rem] font-semibold tracking-[0.1em] text-blue-200 uppercase backdrop-blur-sm xs:text-[0.6875rem] xs:tracking-[0.14em] sm:text-xs sm:tracking-[0.16em]"
            style={{ animationDelay: '40ms' }}
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Reprogramación profesional · Collado Villalba
          </p>

          {/* El destello recorre el titular una vez al cargar. El pseudoelemento
              va recortado al bloque, así que sólo brilla sobre el texto. */}
          <h1
            className="anim-rise anim-sheen relative mt-4 overflow-hidden text-[clamp(2.125rem,10.8vw,5.5rem)] leading-[0.96] sm:mt-5"
            style={{ animationDelay: '110ms' }}
          >
            <span className="text-metal block">Tu coche puede dar más.</span>
            <span className="text-metal block">Mucho más.</span>
          </h1>

          <p
            className="anim-rise mt-4 max-w-[34rem] text-[1.0625rem] text-mist sm:mt-5 sm:text-xl"
            style={{ animationDelay: '190ms' }}
          >
            Stage 1, 2 y 3 con garantía de {SITE.garantiaDias} días. Te decimos cuánto gana tu
            coche antes de que vengas.
          </p>

          <div
            className="anim-rise mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center"
            style={{ animationDelay: '265ms' }}
          >
            <CtaPrimary href={`#${FORM_ID}`} className="w-full text-[1.0625rem] sm:w-auto">
              Calcula cuánto gana tu coche
              <ArrowDown />
            </CtaPrimary>
            <CtaWhatsapp className="w-full sm:w-auto">Escríbenos por WhatsApp</CtaWhatsapp>
          </div>

          <ul
            className="anim-rise mt-6 flex flex-wrap gap-x-2 gap-y-2 sm:mt-7"
            style={{ animationDelay: '340ms' }}
          >
            {BADGES.map((b) => (
              <li
                key={b}
                className="rounded-md border border-white/10 bg-white/[0.055] px-2.5 py-1.5 text-[0.75rem] font-medium text-mist backdrop-blur-sm sm:text-[0.8125rem]"
              >
                {b}
              </li>
            ))}
          </ul>

          <p
            className="anim-rise mt-3.5 text-[0.8125rem] text-smoke"
            style={{ animationDelay: '400ms' }}
          >
            Abierto todos los días de 8:00 a 23:00
          </p>
        </div>
      </div>
    </section>
  );
}
