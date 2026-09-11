'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { readConsent, writeConsent } from '@/lib/consent';

const EVENTO_ABRIR = 'vdn:abrir-cookies';

/** Lo llama el botón "Configurar cookies" del pie para reabrir el panel. */
export function abrirPanelCookies() {
  window.dispatchEvent(new Event(EVENTO_ABRIR));
}

type Vista = 'oculto' | 'aviso' | 'panel';

/**
 * Aviso de cookies (RGPD + LSSI art. 22.2).
 *
 * · Tarjeta compacta abajo, no una franja a todo lo ancho.
 * · "Aceptar" y "Rechazar" tienen el mismo tamaño y el mismo peso visual:
 *   rechazar cuesta exactamente lo mismo que aceptar, un clic.
 * · Publica su alto en --consent-h para que el hero y la barra móvil se aparten
 *   con transform, sin mover la maquetación.
 * · Mientras no haya decisión no se carga nada de terceros: lo garantiza
 *   tracking.ts, que sólo inyecta el píxel con consentimiento.
 */
export function CookieBanner() {
  const [vista, setVista] = useState<Vista>('oculto');
  const [marketing, setMarketing] = useState(false);
  const tarjetaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const guardado = readConsent();
    if (!guardado) {
      const t = setTimeout(() => setVista('aviso'), 250);
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

  /* El alto real del aviso se publica como --consent-h. El layout lo reserva
     antes del primer pintado (ver el script en línea de layout.tsx), así que
     esto sólo lo afina; al decidir vuelve a 0 y todo recupera su sitio. */
  useEffect(() => {
    const raiz = document.documentElement;
    const el = tarjetaRef.current;
    if (vista !== 'aviso' || !el) {
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
        aria-labelledby="cookies-t"
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      >
        <div className="safe-b radius max-h-[86svh] w-full max-w-md overflow-y-auto border border-hair bg-surface p-6">
          <h2 id="cookies-t" className="text-[1.375rem]">
            Cookies
          </h2>
          <p className="mt-3 text-[0.875rem] text-muted">
            Puedes cambiar esto cuando quieras desde el pie de página.
          </p>

          <div className="mt-6 space-y-0">
            <Categoria
              titulo="Técnicas"
              texto="Hacen que la web funcione y guardan tu decisión. No se pueden desactivar."
              activa
              fija
            />
            <Categoria
              titulo="Marketing"
              texto="Meta Pixel. Mide si una visita de un anuncio acaba pidiendo precio."
              activa={marketing}
              onChange={setMarketing}
            />
          </div>

          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => decidir(marketing)}
              className="h-12 rounded-full bg-accent px-5 text-[0.875rem] font-medium text-white"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => decidir(true)}
              className="h-12 rounded-full border border-hair px-5 text-[0.875rem] font-medium text-ink"
            >
              Aceptar todas
            </button>
          </div>

          <p className="mt-5 text-[0.75rem]">
            <Link href="/politica-cookies" className="text-muted underline underline-offset-2 hover:text-ink">
              Política de cookies
            </Link>
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------ Aviso ------------------------------ */
  return (
    <div ref={tarjetaRef} className="safe-b fixed inset-x-0 bottom-0 z-[55] px-3 pb-3">
      <div className="radius mx-auto max-w-2xl border border-hair bg-surface/95 p-4 backdrop-blur-xl sm:flex sm:items-center sm:gap-6 sm:p-5">
        <p className="text-[0.8125rem] leading-snug text-muted sm:flex-1">
          Cookies propias para que la web funcione y, si nos dejas, de Meta para medir anuncios.{' '}
          <Link href="/politica-cookies" className="text-ink underline decoration-white/25 underline-offset-2">
            Ver la política de cookies
          </Link>
          .
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-0 sm:shrink-0">
          <button
            type="button"
            onClick={() => decidir(true)}
            className="h-11 rounded-full bg-accent px-3 text-[0.8125rem] font-medium text-white sm:px-5"
          >
            Aceptar
          </button>
          <button
            type="button"
            onClick={() => decidir(false)}
            className="h-11 rounded-full border border-hair px-3 text-[0.8125rem] font-medium text-ink sm:px-5"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => setVista('panel')}
            className="h-11 rounded-full px-3 text-[0.8125rem] text-muted transition-colors duration-300 hover:text-ink sm:px-4"
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
    <div className="flex items-start justify-between gap-5 border-t border-hair py-4 last:border-b">
      <div className="min-w-0">
        <h3 className="text-[0.9375rem] font-medium">{titulo}</h3>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">{texto}</p>
      </div>

      {fija ? (
        <span className="shrink-0 text-[0.75rem] text-muted">Siempre</span>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={activa}
          aria-label={titulo}
          onClick={() => onChange?.(!activa)}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-300 ${
            activa ? 'border-accent bg-accent' : 'border-hair bg-white/5'
          }`}
        >
          <span
            className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
            style={{ transform: activa ? 'translateX(1.25rem)' : 'translateX(0)' }}
          />
        </button>
      )}
    </div>
  );
}
