'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { SITE } from '@/lib/config';
import { abrirPanelCookies } from './CookieBanner';
import { EnlaceTelefono, EnlaceWhatsapp } from './kit';

/**
 * Pie en columnas, cada una con su título en el azul de marca.
 * Las redes van con su logo, no con su nombre: se reconocen antes y ocupan
 * menos. El nombre completo queda en el aria-label, que es lo que lee un
 * lector de pantalla.
 */
export function Footer() {
  return (
    <footer className="border-t border-hair bg-void pt-16 pb-32 lg:pb-20">
      <div className="shell">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          {/* --- Marca --- */}
          <div>
            <img
              src="/logo-vdn.webp"
              alt="VDN Performance"
              width={400}
              height={97}
              loading="lazy"
              className="h-7 w-auto self-start"
            />
            <p className="mt-5 max-w-[30ch] text-[0.875rem] text-muted">
              Reprogramación de centralitas en Collado Villalba.
            </p>
          </div>

          {/* --- Contacto --- */}
          <div>
            <Titulo>Contacto</Titulo>
            <ul className="mt-4 space-y-2.5 text-[0.9375rem]">
              <li>
                <EnlaceTelefono className={enlace}>{SITE.phoneDisplay}</EnlaceTelefono>
              </li>
              <li>
                <EnlaceWhatsapp className={enlace}>WhatsApp</EnlaceWhatsapp>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className={`${enlace} break-all`}>
                  {SITE.email}
                </a>
              </li>
            </ul>
          </div>

          {/* --- Taller --- */}
          <div>
            <Titulo>Taller</Titulo>
            <address className="mt-4 text-[0.9375rem] not-italic">
              <a href={SITE.taller.maps} target="_blank" rel="noopener noreferrer" className={enlace}>
                {SITE.taller.calle}
                <br />
                {SITE.taller.cp} {SITE.taller.ciudad}
              </a>
              <p className="mt-2.5 text-muted">{SITE.horario}</p>
            </address>
          </div>

          {/* --- Redes --- */}
          <div>
            <Titulo>Redes sociales</Titulo>
            <div className="mt-4 flex gap-2.5">
              <Red href={SITE.instagram} label={`Instagram, ${SITE.instagramHandle}`}>
                <Instagram />
              </Red>
              <Red href={SITE.tiktok} label={`TikTok, ${SITE.tiktokHandle}`}>
                <TikTok />
              </Red>
              <Red href={SITE.webPrincipal} label="vdnperformance.es, la web principal">
                <Globo />
              </Red>
            </div>
          </div>
        </div>

        {/* --- Legal --- */}
        <div className="mt-14 flex flex-col gap-4 border-t border-hair pt-8 text-[0.8125rem] md:flex-row md:items-center md:justify-between">
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
            <button
              type="button"
              onClick={abrirPanelCookies}
              className={`text-[0.8125rem] ${enlace}`}
            >
              Configurar cookies
            </button>
          </nav>
          <p className="text-muted">© 2026 VDN Performance</p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */

const enlace = 'text-muted transition-colors duration-300 hover:text-ink';

/** Título de columna, en el azul de marca. */
function Titulo({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[0.75rem] font-medium tracking-[0.16em] text-accent-hi uppercase">
      {children}
    </h2>
  );
}

function Red({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full border border-hair text-muted transition-colors duration-300 hover:border-white/30 hover:text-ink"
    >
      {children}
    </a>
  );
}

/* --- Logos --- */

function Instagram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-[1.15rem] w-[1.15rem]">
      <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.25.07 1.65.07 4.85s0 3.6-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.25.06-1.65.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.51.01-4.75.07-1.15.05-1.77.24-2.18.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.15.24 1.77.4 2.18.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.15-.05 1.77-.24 2.18-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.15-.24-1.77-.4-2.18a3.63 3.63 0 0 0-.88-1.35 3.63 3.63 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4C15.51 4.01 15.14 4 12 4Zm0 3.04a4.96 4.96 0 1 1 0 9.92 4.96 4.96 0 0 1 0-9.92Zm0 8.18a3.22 3.22 0 1 0 0-6.44 3.22 3.22 0 0 0 0 6.44Zm6.31-8.38a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0Z" />
    </svg>
  );
}

function TikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-[1.15rem] w-[1.15rem]">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.59 2.59 0 0 1-2.6 2.5 2.6 2.6 0 0 1 0-5.2c.27 0 .52.04.76.12v-3.2a5.86 5.86 0 0 0-.76-.05 5.73 5.73 0 1 0 5.73 5.73V9.03a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.27-1.48Z" />
    </svg>
  );
}

function Globo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
      className="h-[1.15rem] w-[1.15rem]"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
    </svg>
  );
}
