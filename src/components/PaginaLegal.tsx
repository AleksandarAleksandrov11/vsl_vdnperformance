import Link from 'next/link';
import type { ReactNode } from 'react';
import { SITE } from '@/lib/config';

/**
 * Marco común de las tres páginas legales: mismo fondo oscuro que la landing,
 * ancho de lectura cómodo en móvil y un botón claro para volver.
 *
 * IMPORTANTE — estos textos son una base redactada a partir de los datos que
 * facilitó el titular. No son asesoramiento jurídico: antes de publicar,
 * conviene que el titular (o su asesor) los revise y los ajuste a cómo trata
 * los datos de verdad.
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
    <div className="min-h-svh bg-ink">
      <header className="safe-x border-b border-[#1c1d24] bg-ink-2">
        <div className="shell gutter flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center" aria-label="Volver a la portada">
            <img src="/logo-vdn.webp" alt="VDN Performance" width={400} height={97} className="h-6 w-auto" />
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#2f3038] bg-white/[0.05] px-4 text-[0.875rem] font-semibold text-chalk transition-colors hover:border-blue-400/60"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden className="h-4 w-4">
              <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver
          </Link>
        </div>
      </header>

      <main className="shell gutter py-12 sm:py-16">
        <div className="mx-auto max-w-[46rem]">
          <h1 className="text-metal text-[clamp(1.875rem,7vw,3rem)] leading-[1.05]">{titulo}</h1>
          <p className="mt-3 text-[0.8125rem] text-smoke">Última actualización: {actualizado}</p>
          <div aria-hidden className="rule-blue mt-6 h-px opacity-60" />

          <div className="legal mt-8">{children}</div>

          <div className="mt-12 border-t border-[#1f2027] pt-6">
            <Link
              href="/"
              className="bg-blue-grad tap inline-flex items-center justify-center rounded-xl px-6 font-semibold text-white"
            >
              Volver a la página
            </Link>
          </div>
        </div>
      </main>

      {/* Hueco de sobra abajo: el aviso de cookies no debe tapar el último
          párrafo cuando se llega al final de la página. */}
      <footer className="safe-x border-t border-[#1c1d24] bg-ink-2 pt-8 pb-40 sm:pb-10">
        <div className="shell gutter text-[0.8125rem] text-[#83868f]">
          <p>
            {SITE.legalName} · NIF {SITE.nif} · {SITE.taller.calle}, {SITE.taller.cp}{' '}
            {SITE.taller.ciudad} ({SITE.taller.provincia})
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/aviso-legal" className="hover:text-blue-300">
              Aviso legal
            </Link>
            <Link href="/politica-privacidad" className="hover:text-blue-300">
              Política de privacidad
            </Link>
            <Link href="/politica-cookies" className="hover:text-blue-300">
              Política de cookies
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Apartado numerado de un texto legal. */
export function Apartado({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="text-[1.125rem] tracking-wide text-chalk normal-case sm:text-xl">{titulo}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

/** Ficha de datos (titular, responsable del tratamiento...). */
export function Ficha({ filas }: { filas: [string, ReactNode][] }) {
  return (
    <dl className="overflow-hidden rounded-2xl border border-[#25262e] bg-[#15151b]">
      {filas.map(([k, v], i) => (
        <div
          key={k}
          className={`grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4 ${
            i > 0 ? 'border-t border-[#22232b]' : ''
          }`}
        >
          <dt className="text-[0.8125rem] font-medium text-smoke">{k}</dt>
          <dd className="text-[0.9375rem] text-chalk">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
