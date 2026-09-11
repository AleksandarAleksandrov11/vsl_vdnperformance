'use client';

import { abrirPanelCookies } from './CookieBanner';

/** Reabre el panel de consentimiento desde el cuerpo de la política de cookies. */
export function BotonConfigurarCookies() {
  return (
    <button
      type="button"
      onClick={abrirPanelCookies}
      className="tap inline-flex items-center justify-center rounded-xl border border-[#2f3038] bg-white/[0.05] px-5 font-semibold text-chalk transition-colors hover:border-blue-400/60"
    >
      Configurar cookies
    </button>
  );
}
