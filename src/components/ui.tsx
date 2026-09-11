'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FORM_ID, TEL_LINK, waLink } from '@/lib/config';
import { trackContact } from '@/lib/tracking';
import { useCountUp, useInViewOnce } from '@/lib/hooks';

/* ==========================================================================
   Reveal — entrada al hacer scroll
   Sin librería: IntersectionObserver + una transición de transform/opacity.
   El contenido ya está en el HTML; la animación sólo lo mueve. Si el usuario
   pide menos movimiento, el CSS global reduce la transición a 0 y se ve igual.
   ========================================================================== */

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'span';
}) {
  const [ref, visible] = useInViewOnce<HTMLElement>({ threshold: 0.14 });
  // `as` hace que el elemento cambie (div, li, section...): se resuelve como
  // ElementType para que la ref valga para cualquiera de ellos.
  const Comp = Tag as React.ElementType;
  return (
    <Comp
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : `translate3d(0, ${y}px, 0)`,
        transition: `opacity 620ms var(--ease-out-expo) ${delay}ms, transform 620ms var(--ease-out-expo) ${delay}ms`,
        willChange: visible ? 'auto' : 'transform, opacity',
      }}
    >
      {children}
    </Comp>
  );
}

/* ==========================================================================
   Botones
   ========================================================================== */

const baseBtn =
  'tap inline-flex items-center justify-center gap-2 rounded-xl px-5 text-center font-semibold ' +
  'transition-[transform,box-shadow,background-color] duration-200 active:scale-[0.985] ' +
  'disabled:pointer-events-none disabled:opacity-55';

export function CtaPrimary({
  children,
  href,
  onClick,
  className = '',
  type = 'button',
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const cls = `${baseBtn} bg-blue-grad text-white glow-blue hover:glow-blue-strong ${className}`;
  if (href) {
    return (
      <a href={href} onClick={onClick} className={cls} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export function CtaGhost({
  children,
  href,
  onClick,
  className = '',
  ariaLabel,
  target,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  target?: string;
}) {
  const cls =
    `${baseBtn} border border-[#2f3038] bg-white/[0.045] text-chalk backdrop-blur-sm ` +
    `hover:border-blue-400/60 hover:bg-white/[0.08] ${className}`;
  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={cls}
        aria-label={ariaLabel}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

/** CTA que baja al formulario. Todos los "calcula / presupuesto" usan este. */
export function CtaFormulario({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <CtaPrimary href={`#${FORM_ID}`} className={className}>
      {children}
      <ArrowDown />
    </CtaPrimary>
  );
}

/** CTA de WhatsApp. Centraliza el evento Contact para no repetirlo por ahí. */
export function CtaWhatsapp({
  children,
  mensaje,
  className = '',
  variant = 'ghost',
}: {
  children: ReactNode;
  mensaje?: string;
  className?: string;
  variant?: 'ghost' | 'primary';
}) {
  const props = {
    href: waLink(mensaje),
    onClick: () => trackContact('whatsapp'),
    className,
    target: '_blank',
  };
  if (variant === 'primary') {
    return (
      <a
        {...props}
        rel="noopener noreferrer"
        className={`${baseBtn} bg-[#1FAD55] text-white shadow-[0_10px_34px_-14px_rgba(31,173,85,0.9)] hover:bg-[#25c462] ${className}`}
      >
        <WhatsappIcon /> {children}
      </a>
    );
  }
  return (
    <CtaGhost {...props}>
      <WhatsappIcon /> {children}
    </CtaGhost>
  );
}

export function TelefonoLink({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <a href={TEL_LINK} onClick={() => trackContact('telefono')} className={className}>
      {children}
    </a>
  );
}

/* ==========================================================================
   Estructura de sección
   ========================================================================== */

export function Section({
  id,
  children,
  alt = false,
  className = '',
  labelledBy,
  defer = false,
}: {
  id?: string;
  children: ReactNode;
  /** true pinta el fondo alterno #111114. */
  alt?: boolean;
  className?: string;
  labelledBy?: string;
  /** true en las secciones que quedan lejos del pliegue (ver .defer-paint). */
  defer?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`relative ${alt ? 'bg-ink-2' : 'bg-ink'} ${
        defer ? 'defer-paint' : ''
      } py-16 sm:py-20 lg:py-28 ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`font-display text-[0.68rem] font-semibold tracking-[0.28em] text-blue-300 uppercase sm:text-xs ${className}`}
    >
      {children}
    </p>
  );
}

export function H2({
  children,
  id,
  className = '',
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={`text-metal mt-3 text-[clamp(1.75rem,7.4vw,3.25rem)] leading-[1.03] ${className}`}
    >
      {children}
    </h2>
  );
}

export function Lead({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`mt-4 text-[1.0625rem] text-mist sm:text-lg ${className}`}>{children}</p>;
}

/** Línea azul fina de separación entre secciones. */
export function RuleBlue({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`rule-blue h-px w-full opacity-60 ${className}`} />;
}

/* ==========================================================================
   Tarjeta con brillo que sigue al dedo o al ratón
   En móvil no hay puntero, así que el brillo se enciende suave al entrar en
   pantalla y se queda quieto. No se anima nada más que opacidad y posición de
   un degradado, que va por composición.
   ========================================================================== */

export function GlowCard({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article';
}) {
  const ref = useRef<HTMLElement>(null);
  const [enPantalla, setEnPantalla] = useState(false);
  const Comp = Tag as React.ElementType;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Brillo suave al entrar en pantalla (es lo único que se ve en móvil).
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            setEnPantalla(true);
            io?.disconnect();
          }
        },
        { threshold: 0.3 },
      );
      io.observe(el);
    } else {
      setEnPantalla(true);
    }

    // El seguimiento del puntero sólo se engancha si hay puntero fino.
    const fino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fino) return () => io?.disconnect();

    let raf = 0;
    const mover = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
        raf = 0;
      });
    };
    const entrar = () => el.style.setProperty('--glow', '1');
    const salir = () => el.style.setProperty('--glow', '0');

    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerenter', entrar);
    el.addEventListener('pointerleave', salir);
    return () => {
      io?.disconnect();
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerenter', entrar);
      el.removeEventListener('pointerleave', salir);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Comp
      ref={ref}
      className={`group relative isolate overflow-hidden rounded-2xl border border-[#25262e] bg-[#131318] ${className}`}
      style={{ ['--mx' as string]: '50%', ['--my' as string]: '0%', ['--glow' as string]: '0' }}
    >
      {/* Brillo que sigue al ratón */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[var(--glow)] transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(340px circle at var(--mx) var(--my), rgba(46,123,255,0.16), transparent 62%)',
        }}
      />
      {/* Destello de entrada, el que se ve en móvil */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px transition-opacity duration-700"
        style={{
          opacity: enPantalla ? 1 : 0,
          background: 'linear-gradient(90deg, transparent, rgba(46,123,255,0.85), transparent)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 -z-10 h-32 w-4/5 -translate-x-1/2 rounded-full blur-2xl transition-opacity duration-1000"
        style={{ opacity: enPantalla ? 0.5 : 0, background: 'rgba(30,107,240,0.3)' }}
      />
      {children}
    </Comp>
  );
}

/* ==========================================================================
   Contador animado
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
      {/* El valor final va en el DOM para lectores de pantalla y para el caso
          de que el contador no llegue a arrancar. */}
      <span aria-hidden>
        {prefijo}
        {texto}
        {sufijo}
      </span>
      <span className="sr-only">
        {prefijo}
        {to.toLocaleString('es-ES', { maximumFractionDigits: decimales })}
        {sufijo}
      </span>
    </span>
  );
}

/* ==========================================================================
   Iconos
   Inline y mínimos: no merece la pena una librería de iconos para doce trazos.
   ========================================================================== */

export function WhatsappIcon({ className = 'h-[1.15em] w-[1.15em]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.17 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.52.1.46-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

export function ArrowDown({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden className={className}>
      <path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRight({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Check({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden className={className}>
      <path d="M4 12.5 9.5 18 20 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Estrellas({ n = 5, className = '' }: { n?: number; className?: string }) {
  return (
    <div className={`flex gap-0.5 ${className}`} role="img" aria-label={`${n} de 5 estrellas`}>
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="#FFB703" aria-hidden className="h-4 w-4">
          <path d="M10 1.6l2.47 5.2 5.53.78-4 4.03.95 5.79L10 14.65 5.05 17.4 6 11.61l-4-4.03 5.53-.78L10 1.6Z" />
        </svg>
      ))}
    </div>
  );
}
