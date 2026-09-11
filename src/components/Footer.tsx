'use client';

import Link from 'next/link';
import { SITE } from '@/lib/config';
import { abrirPanelCookies } from './CookieBanner';
import { EnlaceTelefono, EnlaceWhatsapp } from './kit';

const enlace =
  'text-muted transition-colors duration-300 hover:text-ink';

/** Pie mínimo: tres filas, sin columnas de relleno ni repetir lo de arriba. */
export function Footer() {
  return (
    <footer className="border-t border-hair bg-void pt-14 pb-32 lg:pb-16">
      <div className="shell">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <img
            src="/logo-vdn.webp"
            alt="VDN Performance"
            width={400}
            height={97}
            loading="lazy"
            className="h-6 w-auto self-start"
          />

          <nav aria-label="Contacto" className="flex flex-wrap gap-x-8 gap-y-3 text-[0.9375rem]">
            <EnlaceTelefono className={enlace}>{SITE.phoneDisplay}</EnlaceTelefono>
            <EnlaceWhatsapp className={enlace}>WhatsApp</EnlaceWhatsapp>
            <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className={enlace}>
              Instagram
            </a>
            <a href={SITE.tiktok} target="_blank" rel="noopener noreferrer" className={enlace}>
              TikTok
            </a>
            <a href={SITE.taller.maps} target="_blank" rel="noopener noreferrer" className={enlace}>
              {SITE.taller.calle}, {SITE.taller.ciudad}
            </a>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-hair pt-8 text-[0.8125rem] md:flex-row md:items-center md:justify-between">
          <nav aria-label="Información legal" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/aviso-legal" className={enlace}>
              Aviso legal
            </Link>
            <Link href="/politica-privacidad" className={enlace}>
              Privacidad
            </Link>
            <Link href="/politica-cookies" className={enlace}>
              Cookies
            </Link>
            <button type="button" onClick={abrirPanelCookies} className={`text-[0.8125rem] ${enlace}`}>
              Configurar cookies
            </button>
          </nav>
          <p className="text-muted">© 2026 VDN Performance</p>
        </div>
      </div>
    </footer>
  );
}
