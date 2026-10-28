'use client';

import { Logo } from './Logo';
import { abrirPanelCookies } from './CookieBanner';
import { BotonCalcular } from './kit';

/**
 * Pie mínimo: marca, qué hace el taller, el botón al formulario y lo legal.
 * Sin teléfono, dirección ni redes: en una landing de anuncios cada enlace
 * que saca de la página es un presupuesto que no se pide. Los textos legales
 * se abren en otra pestaña para que el formulario siga como estaba.
 */
export function Footer() {
  return (
    <footer className="border-t border-hair bg-void pt-16 pb-32 lg:pb-20">
      <div className="shell">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Logo lazy className="h-7 w-auto self-start" />
            <p className="mt-5 max-w-[30ch] text-[0.875rem] text-muted">
              Reprogramación de centralitas en Collado Villalba.
            </p>
          </div>

          <BotonCalcular className="w-full sm:w-auto" />
        </div>

        {/* --- Legal --- */}
        <div className="mt-14 flex flex-col gap-4 border-t border-hair pt-8 text-[0.8125rem] md:flex-row md:items-center md:justify-between">
          <nav aria-label="Información legal" className="flex flex-wrap gap-x-6 gap-y-2">
            <EnlaceLegal href="/aviso-legal/">Aviso legal</EnlaceLegal>
            <EnlaceLegal href="/politica-privacidad/">Privacidad</EnlaceLegal>
            <EnlaceLegal href="/politica-cookies/">Cookies</EnlaceLegal>
            <button
              type="button"
              onClick={abrirPanelCookies}
              className={`text-[0.8125rem] ${enlace}`}
            >
              Configurar cookies
            </button>
          </nav>
          <p className="text-muted">
            © 2026 VDN Performance · Web creada por{' '}
            <a href="https://www.aasmarketing.com/" className={enlace}>AAS Marketing</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */

const enlace = 'text-muted transition-colors duration-300 hover:text-ink';

/** Enlace a un texto legal, en pestaña nueva: el formulario no pierde nada. */
function EnlaceLegal({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener" className={enlace}>
      {children}
    </a>
  );
}
