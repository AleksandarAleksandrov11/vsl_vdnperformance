'use client';

import { abrirPanelCookies } from './CookieBanner';

/** Reabre el panel de consentimiento desde el cuerpo de la política de cookies. */
export function BotonConfigurarCookies() {
  return (
    <button
      type="button"
      onClick={abrirPanelCookies}
      className="mt-6 inline-flex h-12 items-center rounded-full border border-hair px-6 text-[0.875rem] font-medium text-ink transition-colors duration-300 hover:border-white/30"
    >
      Configurar cookies
    </button>
  );
}
