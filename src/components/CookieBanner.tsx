'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { readConsent, writeConsent } from '@/lib/consent';

const EVENTO_ABRIR = 'vdn:abrir-cookies';

/** Lo llama el botón "Configurar cookies" del pie para reabrir el panel. */
export function abrirPanelCookies() {
  window.dispatchEvent(new Event(EVENTO_ABRIR));
}

type Vista = 'oculto' | 'banner' | 'panel';

/**
 * Banner de consentimiento (RGPD + LSSI art. 22.2).
 *
 * · Aparece abajo, y sobre el botón flotante de WhatsApp, pero deja libre la
 *   parte de arriba: nunca tapa el CTA principal.
 * · "Aceptar" y "Rechazar" son dos botones del mismo tamaño y el mismo peso
 *   visual. Rechazar cuesta exactamente lo mismo que aceptar: un clic.
 * · Mientras no haya decisión no se carga nada de terceros (lo garantiza
 *   tracking.ts, que sólo inyecta el píxel con consentimiento).
 */
export function CookieBanner() {
  const [vista, setVista] = useState<Vista>('oculto');
  const [marketing, setMarketing] = useState(false);
  const barraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const guardado = readConsent();
    if (!guardado) {
      // Un respiro antes de aparecer, pero corto: el hueco ya está reservado
      // desde el layout, así que salir pronto no mueve nada de sitio.
      const t = setTimeout(() => setVista('banner'), 250);
      return () => clearTimeout(t);
    }
    setMarketing(guardado.marketing);
  }, []);

  useEffect(() => {
    const abrir = () => {
      setMarketing(readConsent()?.marketing ?? false);
      setVista('panel');
    };
    window.addEventListener(EVENTO_ABRIR, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR, abrir);
  }, []);

  /* El alto real del aviso se publica como --consent-h. Lo usan el hero (para
     que su contenido no quede debajo) y los botones flotantes (para subirse por
     encima). Al decidir vuelve a 0 y todo recupera su sitio. */
  useEffect(() => {
    const raiz = document.documentElement;
    const el = barraRef.current;
    if (vista !== 'banner' || !el) {
      raiz.style.setProperty('--consent-h', '0px');
      return;
    }
    const medir = () => raiz.style.setProperty('--consent-h', `${el.offsetHeight}px`);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => {
      ro.disconnect();
      raiz.style.setProperty('--consent-h', '0px');
    };
  }, [vista]);

  function decidir(aceptaMarketing: boolean) {
    writeConsent(aceptaMarketing);
    setMarketing(aceptaMarketing);
    setVista('oculto');
  }

  if (vista === 'oculto') return null;

  /* ------------------------------ Panel ------------------------------ */
  if (vista === 'panel') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookies-panel-t"
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      >
        <div className="safe-b max-h-[86svh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#2a2b33] bg-[#111117] p-5 shadow-2xl sm:p-6">
          <h2 id="cookies-panel-t" className="text-xl text-chalk">
            Configurar cookies
          </h2>
          <p className="mt-2 text-[0.875rem] text-smoke">
            Decide qué se puede usar mientras navegas. Puedes cambiarlo cuando quieras desde
            «Configurar cookies», en el pie de página.
          </p>

          <div className="mt-5 space-y-3">
            <Categoria
              titulo="Cookies técnicas"
              texto="Hacen que la web funcione y guardan tu decisión sobre las cookies. Sin ellas no se puede navegar, así que no se pueden desactivar."
              activa
              fija
            />
            <Categoria
              titulo="Cookies de marketing"
              texto="Meta Pixel. Miden si alguien llega desde un anuncio de Instagram o Facebook y si acaba pidiendo presupuesto. Vienen desactivadas."
              activa={marketing}
              onChange={setMarketing}
            />
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => decidir(marketing)}
              className="bg-blue-grad tap rounded-xl px-4 font-semibold text-white"
            >
              Guardar preferencias
            </button>
            <button
              type="button"
              onClick={() => decidir(true)}
              className="tap rounded-xl border border-[#2f3038] bg-white/[0.05] px-4 font-semibold text-chalk"
            >
              Aceptar todas
            </button>
          </div>

          <p className="mt-4 text-center text-[0.75rem] text-[#83868f]">
            <Link href="/politica-cookies" className="underline underline-offset-2 hover:text-blue-300">
              Política de cookies
            </Link>
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------ Banner ----------------------------- */
  /* Compacto a propósito: dos líneas de texto y una fila de botones. Cuanto
     menos alto, menos tapa el CTA del hero en un móvil pequeño. */
  return (
    <div
      ref={barraRef}
      role="dialog"
      aria-label="Aviso de cookies"
      className="safe-b safe-x fixed inset-x-0 bottom-0 z-[55] border-t border-[#26272f] bg-ink/97 backdrop-blur-xl"
    >
      <div aria-hidden className="rule-blue h-px opacity-45" />
      <div className="shell gutter py-3 sm:flex sm:items-center sm:gap-6 sm:py-3.5">
        <p className="text-[0.8125rem] leading-snug text-mist sm:flex-1">
          Cookies propias para que la web funcione y, si nos dejas, de Meta para medir anuncios.{' '}
          <Link
            href="/politica-cookies"
            className="text-blue-300 underline decoration-blue-300/40 underline-offset-2"
          >
            Ver la política de cookies
          </Link>
          .
        </p>

        <div className="mt-2.5 grid grid-cols-3 gap-2 sm:mt-0 sm:w-auto sm:shrink-0 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => decidir(true)}
            className="bg-blue-grad h-11 rounded-xl px-2 text-[0.875rem] font-semibold text-white sm:px-6"
          >
            Aceptar
          </button>
          <button
            type="button"
            onClick={() => decidir(false)}
            className="h-11 rounded-xl border border-[#2f3038] bg-white/[0.06] px-2 text-[0.875rem] font-semibold text-chalk sm:px-6"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => setVista('panel')}
            className="h-11 rounded-xl px-2 text-[0.875rem] text-smoke underline decoration-[#3a3c45] underline-offset-4 transition-colors hover:text-chalk sm:px-4"
          >
            Configurar
          </button>
        </div>
      </div>
    </div>
  );
}

function Categoria({
  titulo,
  texto,
  activa,
  fija = false,
  onChange,
}: {
  titulo: string;
  texto: string;
  activa: boolean;
  fija?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-[#26272f] bg-[#16161c] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[0.9375rem] tracking-wide text-chalk normal-case">{titulo}</h3>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-smoke">{texto}</p>
        </div>

        {fija ? (
          <span className="shrink-0 rounded-md border border-[#2f3038] px-2 py-1 text-[0.6875rem] text-smoke">
            Siempre
          </span>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={activa}
            aria-label={titulo}
            onClick={() => onChange?.(!activa)}
            className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200 ${
              activa ? 'border-blue-400 bg-blue-600' : 'border-[#3a3c45] bg-[#22232b]'
            }`}
          >
            <span
              className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
              style={{ transform: activa ? 'translateX(1.25rem)' : 'translateX(0)' }}
            />
          </button>
        )}
      </div>
    </div>
  );
}
