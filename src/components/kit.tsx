'use client';

import { type ReactNode } from 'react';
import { FORM_ID, TEL_LINK, waLink } from '@/lib/config';
import { trackContact } from '@/lib/tracking';
import { useCountUp, useInViewOnce } from '@/lib/hooks';

/* ==========================================================================
   Movimiento
   Los revelados de scroll van con IntersectionObserver y una transición CSS:
   cuestan 0 kB de JavaScript y los resuelve el compositor. Framer Motion se
   reserva para lo que de verdad lo necesita (cambio de pestaña de los stages,
   pasos del formulario y el check final), donde hay entrada y salida.
   ========================================================================== */

/** Bloque que sube y aparece al entrar en pantalla. */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'p' | 'span';
}) {
  const [ref, visible] = useInViewOnce<HTMLElement>({ threshold: 0.15 });
  const Comp = Tag as React.ElementType;
  return (
    <Comp
      ref={ref}
      className={`rise ${className}`}
      data-visible={visible ? 'true' : 'false'}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Comp>
  );
}

/**
 * Titular que aparece línea a línea: cada línea sube desde dentro de su propia
 * máscara. Las líneas se pasan sueltas a propósito, no se parten solas: en un
 * titular de cuatro palabras el sitio donde rompe es una decisión de diseño.
 */
export function Titular({
  lineas,
  className = '',
  delay = 0,
  as = 'h2',
  id,
}: {
  lineas: string[];
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2';
  id?: string;
}) {
  const [ref, visible] = useInViewOnce<HTMLHeadingElement>({ threshold: 0.2 });
  const Comp = as;
  return (
    <Comp id={id} ref={ref} className={className}>
      {lineas.map((linea, i) => (
        <span key={linea} className="line-mask" data-visible={visible ? 'true' : 'false'}>
          <span style={{ transitionDelay: `${delay + i * 90}ms` }}>{linea}</span>
        </span>
      ))}
    </Comp>
  );
}

/**
 * Contenedor de imagen con revelado por clip-path y un zoom de 1,06 a 1.
 *
 * Van dos capas a propósito. El clip-path se pone en la de dentro y se observa
 * la de fuera: si se observara la misma capa que lleva el recorte, su área
 * visible sería cero y el IntersectionObserver no la daría nunca por visible,
 * así que la imagen se quedaría tapada para siempre.
 */
export function RevealImg({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const [ref, visible] = useInViewOnce<HTMLDivElement>({ threshold: 0.12 });
  return (
    <div ref={ref} className={className}>
      <div
        className="reveal-img h-full w-full"
        data-visible={visible ? 'true' : 'false'}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {children}
      </div>
    </div>
  );
}

/* ==========================================================================
   Estructura
   ========================================================================== */

export function Section({
  id,
  children,
  className = '',
  labelledBy,
  light = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  /** Sección clara. Sólo reseñas y garantía. */
  light?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`section-y relative ${light ? 'bg-paper text-ink-dark' : 'bg-void'} ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

/** Tamaño de titular de sección. Un solo sitio donde tocarlo. */
export const H2_CLASS = 'text-[clamp(2.75rem,9vw,6rem)]';
/** Titular del hero y del cierre, algo mayor. */
export const H1_CLASS = 'text-[clamp(2.875rem,11vw,6.5rem)]';

/* ==========================================================================
   Botones
   Un único botón principal visible por pantalla. El azul sólo vive aquí.
   ========================================================================== */

const BASE =
  'group/btn inline-flex h-14 items-center justify-center gap-2 rounded-full px-7 ' +
  'text-[0.9375rem] font-medium transition-[transform,background-color,border-color,color] ' +
  'duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

export function BotonPrincipal({
  children,
  href,
  onClick,
  className = '',
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const cls = `${BASE} bg-accent text-white hover:bg-accent-hi ${className}`;
  /* data-cta marca los botones principales. La barra móvil los vigila para
     esconderse cuando ya hay uno en pantalla: nunca dos azules a la vez. */
  if (href) {
    return (
      <a href={href} onClick={onClick} className={cls} data-cta="">
        {children}
        <Flecha />
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} data-cta="">
      {children}
    </button>
  );
}

/** CTA al formulario. Todos los "calcular" de la página pasan por aquí. */
export function BotonCalcular({
  children = 'Calcular mi coche',
  className = '',
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <BotonPrincipal href={`#${FORM_ID}`} className={className}>
      {children}
    </BotonPrincipal>
  );
}

/** Enlace de WhatsApp. Centraliza el evento Contact. */
export function EnlaceWhatsapp({
  children,
  mensaje,
  className = '',
}: {
  children: ReactNode;
  mensaje?: string;
  className?: string;
}) {
  return (
    <a
      href={waLink(mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackContact('whatsapp')}
      className={className}
    >
      {children}
    </a>
  );
}

export function EnlaceTelefono({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <a href={TEL_LINK} onClick={() => trackContact('telefono')} className={className}>
      {children}
    </a>
  );
}

/* ==========================================================================
   Cifras
   ========================================================================== */

export function Contador({
  to,
  prefijo = '',
  sufijo = '',
  decimales = 0,
  className = '',
}: {
  to: number;
  prefijo?: string;
  sufijo?: string;
  decimales?: number;
  className?: string;
}) {
  const [ref, visible] = useInViewOnce<HTMLSpanElement>({ threshold: 0.5 });
  const valor = useCountUp(to, visible);
  const texto = valor.toLocaleString('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
  return (
    <span ref={ref} className={`num ${className}`}>
      <span aria-hidden>
        {prefijo}
        {texto}
        {sufijo}
      </span>
      {/* El valor final siempre está en el DOM, aunque el contador no arranque. */}
      <span className="sr-only">
        {prefijo}
        {to.toLocaleString('es-ES', { maximumFractionDigits: decimales })}
        {sufijo}
      </span>
    </span>
  );
}

/* ==========================================================================
   Iconos — inline y mínimos
   ========================================================================== */

export function Flecha({ className = 'h-4 w-4 btn-arrow' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className={className}>
      <path d="M5 12h13M12 5.5 18.5 12 12 18.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconoWhatsapp({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.17 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.52.1.46-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

export function Estrellas({ oscuro = false, className = '' }: { oscuro?: boolean; className?: string }) {
  return (
    <div className={`flex gap-1 ${className}`} role="img" aria-label="5 de 5 estrellas">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill={oscuro ? '#0A0A0A' : '#F5F5F2'}
          aria-hidden
          className="h-3 w-3"
        >
          <path d="M10 1.6l2.47 5.2 5.53.78-4 4.03.95 5.79L10 14.65 5.05 17.4 6 11.61l-4-4.03 5.53-.78L10 1.6Z" />
        </svg>
      ))}
    </div>
  );
}
