'use client';

import { FORM_ID } from '@/lib/config';
import { useScrollY } from '@/lib/hooks';

/**
 * Barra superior fija. Arranca transparente sobre el hero y, al bajar, se
 * vuelve negra con desenfoque para que el logo y el botón sigan legibles.
 * No hay menú: la landing no debe sacar a nadie de la página.
 */
export function Header() {
  const y = useScrollY();
  const solida = y > 24;

  return (
    <header
      className={`safe-x fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        solida
          ? 'border-b border-[#1e1f26] bg-ink/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="shell gutter flex h-14 items-center justify-between gap-3 sm:h-16">
        <a href="#top" className="flex shrink-0 items-center" aria-label="VDN Performance, ir al inicio">
          {/* El logo es el propio archivo de marca, recortado y con transparencia. */}
          <img
            src="/logo-vdn.webp"
            alt="VDN Performance"
            width={400}
            height={97}
            className="h-6 w-auto sm:h-7"
          />
        </a>

        <a
          href={`#${FORM_ID}`}
          className="bg-blue-grad inline-flex h-11 items-center rounded-lg px-3.5 text-[0.8125rem] font-semibold text-white shadow-[0_6px_22px_-10px_rgba(30,107,240,0.9)] transition-transform duration-200 active:scale-[0.97] sm:px-5 sm:text-sm"
        >
          Presupuesto gratis
        </a>
      </div>
      {/* Filo azul muy fino: sólo se ve cuando la barra ya es sólida. */}
      <div
        aria-hidden
        className={`rule-blue h-px transition-opacity duration-500 ${solida ? 'opacity-55' : 'opacity-0'}`}
      />
    </header>
  );
}
