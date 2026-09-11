'use client';

import { FORM_ID } from '@/lib/config';
import { useScrollY } from '@/lib/hooks';

/**
 * Barra mínima: logo y un botón pequeño. Nada más.
 * Sobre el hero es transparente; en cuanto se hace scroll pasa a negro con
 * desenfoque para que el logo siga legible sobre cualquier foto.
 */
export function Nav() {
  const solida = useScrollY() > 32;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        solida ? 'border-b border-hair bg-void/80 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <div className="shell flex h-16 items-center justify-between gap-4">
        <a href="#top" aria-label="VDN Performance, ir al inicio" className="flex items-center">
          <img src="/logo-vdn.webp" alt="VDN Performance" width={400} height={97} className="h-5 w-auto" />
        </a>

        <a
          href={`#${FORM_ID}`}
          className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-[0.8125rem] font-medium text-white transition-colors duration-300 hover:bg-accent-hi"
        >
          Calcular
        </a>
      </div>
    </header>
  );
}
