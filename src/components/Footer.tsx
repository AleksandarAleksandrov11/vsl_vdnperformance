'use client';

import Link from 'next/link';
import { SITE } from '@/lib/config';
import { abrirPanelCookies } from './CookieBanner';
import { TelefonoLink } from './ui';

const LEGAL = [
  { href: '/aviso-legal', texto: 'Aviso legal' },
  { href: '/politica-privacidad', texto: 'Política de privacidad' },
  { href: '/politica-cookies', texto: 'Política de cookies' },
];

export function Footer() {
  return (
    <footer className="defer-paint safe-x border-t border-[#1c1d24] bg-ink-2 pt-12 pb-28 sm:pb-14">
      <div className="shell gutter">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          {/* --- Marca --- */}
          <div>
            <img
              src="/logo-vdn.webp"
              alt="VDN Performance"
              width={400}
              height={97}
              loading="lazy"
              className="h-7 w-auto"
            />
            <p className="mt-4 max-w-[36ch] text-[0.9375rem] text-smoke">
              Reprogramación de centralitas en Collado Villalba. Mapas hechos a medida para tu
              motor, con 15 días de garantía.
            </p>
            <div className="mt-5 flex gap-2">
              <Social href={SITE.instagram} label={`Instagram ${SITE.instagramHandle}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-4.5 w-4.5">
                  <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.25.07 1.65.07 4.85s0 3.6-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.25.06-1.65.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.51.01-4.75.07-1.15.05-1.77.24-2.18.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.15.24 1.77.4 2.18.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.15-.05 1.77-.24 2.18-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.15-.24-1.77-.4-2.18a3.63 3.63 0 0 0-.88-1.35 3.63 3.63 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4C15.51 4.01 15.14 4 12 4Zm0 3.04a4.96 4.96 0 1 1 0 9.92 4.96 4.96 0 0 1 0-9.92Zm0 8.18a3.22 3.22 0 1 0 0-6.44 3.22 3.22 0 0 0 0 6.44Zm6.31-8.38a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0Z" />
                </svg>
              </Social>
              <Social href={SITE.tiktok} label={`TikTok ${SITE.tiktokHandle}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-4.5 w-4.5">
                  <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.59 2.59 0 0 1-2.6 2.5 2.6 2.6 0 0 1 0-5.2c.27 0 .52.04.76.12v-3.2a5.86 5.86 0 0 0-.76-.05 5.73 5.73 0 1 0 5.73 5.73V9.03a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.27-1.48Z" />
                </svg>
              </Social>
            </div>
          </div>

          {/* --- Contacto --- */}
          <div>
            <h2 className="font-display text-xs font-semibold tracking-[0.2em] text-smoke uppercase">
              Contacto
            </h2>
            <ul className="mt-3 text-[0.9375rem] [&_a]:inline-block [&_a]:py-1.5 [&_button]:py-1.5 [&>li]:py-0.5">
              <li>
                <TelefonoLink className="text-chalk transition-colors hover:text-blue-300">
                  {SITE.phoneDisplay}
                </TelefonoLink>
              </li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="break-all text-mist transition-colors hover:text-blue-300"
                >
                  {SITE.email}
                </a>
              </li>
              <li>
                <a
                  href={SITE.taller.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mist transition-colors hover:text-blue-300"
                >
                  {SITE.taller.calle}
                  <br />
                  {SITE.taller.cp} {SITE.taller.ciudad}, {SITE.taller.provincia}
                </a>
              </li>
              <li className="text-smoke">{SITE.horario}</li>
            </ul>
          </div>

          {/* --- Legal --- */}
          <div>
            <h2 className="font-display text-xs font-semibold tracking-[0.2em] text-smoke uppercase">
              Información
            </h2>
            <ul className="mt-3 text-[0.9375rem] [&_a]:inline-block [&_a]:py-1.5 [&_button]:py-1.5 [&>li]:py-0.5">
              <li>
                <a
                  href={SITE.webPrincipal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mist transition-colors hover:text-blue-300"
                >
                  vdnperformance.es
                </a>
              </li>
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-mist transition-colors hover:text-blue-300">
                    {l.texto}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={abrirPanelCookies}
                  className="text-left text-mist underline decoration-[#3a3c45] underline-offset-4 transition-colors hover:text-blue-300"
                >
                  Configurar cookies
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[#1f2027] pt-6 text-[0.8125rem] text-[#83868f] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 VDN Performance</p>
          <p>
            {SITE.legalName} · NIF {SITE.nif}
          </p>
        </div>
      </div>
    </footer>
  );
}

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-xl border border-[#2a2b33] bg-white/[0.04] text-mist transition-colors hover:border-blue-400/60 hover:text-blue-300"
    >
      {children}
    </a>
  );
}
