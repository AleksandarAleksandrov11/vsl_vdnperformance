import Link from 'next/link';
import type { ReactNode } from 'react';
import { SITE } from '@/lib/config';

/**
 * Marco de las tres páginas legales: columna de lectura estrecha, mucho
 * interlineado y nada más en pantalla. Son textos largos que casi siempre se
 * leen en el móvil.
 *
 * IMPORTANTE — estos textos son una base redactada a partir de los datos que
 * facilitó el titular. No son asesoramiento jurídico: antes de publicar,
 * conviene que el titular o su asesoría los revisen.
 */
export function PaginaLegal({
  titulo,
  actualizado = 'enero de 2026',
  children,
}: {
  titulo: string;
  actualizado?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-void">
      <header className="border-b border-hair">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="Volver a la portada" className="flex items-center">
            <img src="/logo-vdn.webp" alt="VDN Performance" width={400} height={97} className="h-5 w-auto" />
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-hair px-5 text-[0.8125rem] font-medium text-ink transition-colors duration-300 hover:border-white/30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className="h-4 w-4">
              <path d="M19 12H5M12 5.5 5.5 12 12 18.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver
          </Link>
        </div>
      </header>

      <main className="shell py-20 lg:py-28">
        <div className="prose-col">
          <h1 className="text-[clamp(2.25rem,7vw,3.5rem)]">{titulo}</h1>
          <p className="mt-5 text-[0.8125rem] text-muted">Última actualización: {actualizado}</p>

          <div className="legal mt-14">{children}</div>
        </div>
      </main>

      {/* Hueco de sobra abajo: el aviso de cookies no debe tapar el último
          párrafo cuando se llega al final. */}
      <footer className="border-t border-hair pt-10 pb-40 sm:pb-14">
        <div className="shell prose-col text-[0.8125rem] text-muted">
          <p>
            {SITE.legalName} · NIF {SITE.nif} · {SITE.taller.calle}, {SITE.taller.cp}{' '}
            {SITE.taller.ciudad} ({SITE.taller.provincia})
          </p>
          <nav aria-label="Información legal" className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/aviso-legal" className="transition-colors hover:text-ink">
              Aviso legal
            </Link>
            <Link href="/politica-privacidad" className="transition-colors hover:text-ink">
              Privacidad
            </Link>
            <Link href="/politica-cookies" className="transition-colors hover:text-ink">
              Cookies
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Apartado numerado de un texto legal. */
export function Apartado({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}

/** Ficha de datos (titular, responsable del tratamiento...). */
export function Ficha({ filas }: { filas: [string, ReactNode][] }) {
  return (
    <dl className="mt-6 border-t border-hair">
      {filas.map(([k, v]) => (
        <div key={k} className="grid gap-1 border-b border-hair py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
          <dt className="text-[0.8125rem] text-muted">{k}</dt>
          <dd className="text-[0.9375rem] text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
