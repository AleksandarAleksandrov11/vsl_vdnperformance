'use client';

import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FORM_ID, waLink } from '@/lib/config';
import { useReducedMotion } from '@/lib/hooks';
import { capturarUtm, enviarLead } from '@/lib/leads';
import { nuevoEventId, trackContact, trackFormStart, trackLead } from '@/lib/tracking';
import { Eyebrow, Flecha, IconoWhatsapp } from '../kit';
import {
  CV_MAX,
  CV_MIN,
  NO_LO_SABE,
  normalizaTelefono,
  validaAnio,
  validaModelo,
  validaMotor,
  validaNombre,
  validaPotencia,
  validaTelefono,
} from './validacion';

const TOTAL = 5;

type Datos = {
  modelo: string;
  anio: string;
  motor: string;
  potencia: string;
  nombre: string;
  telefono: string;
};

const VACIO: Datos = { modelo: '', anio: '', motor: '', potencia: '', nombre: '', telefono: '' };

/** Mensaje de WhatsApp de la pantalla final, con lo que la persona haya contado. */
function mensajeWhatsapp(d: Datos): string {
  let texto = `Hola, soy ${d.nombre.trim()}. Acabo de pedir precio en la web para mi ${d.modelo.trim()} de ${d.anio}`;
  if (d.motor !== NO_LO_SABE) texto += `, motor ${d.motor.trim()}`;
  if (d.potencia !== NO_LO_SABE) texto += `, ${d.potencia} CV de serie`;
  return `${texto}.`;
}

export function Formulario() {
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [direccion, setDireccion] = useState<1 | -1>(1);
  const [interactuado, setInteractuado] = useState(false);

  const honeypot = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const formStartEnviado = useRef(false);
  const reduced = useReducedMotion();

  /* Los UTM se guardan al entrar: si la persona se va a leer la política de
     privacidad y vuelve, el origen del anuncio sigue ahí. */
  useEffect(() => {
    capturarUtm();
  }, []);

  /**
   * Foco en el campo de cada pantalla, pero sólo después de que la persona haya
   * empezado. Si se enfocara al cargar, el móvil abriría el teclado y saltaría
   * al formulario sin que nadie lo pidiera.
   */
  useEffect(() => {
    if (!interactuado || hecho) return;
    inputRef.current?.focus({ preventScroll: true });
    const t = setTimeout(() => {
      panelRef.current?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    }, 60);
    return () => clearTimeout(t);
  }, [paso, interactuado, hecho, reduced]);

  /* Si el teclado del móvil cambia el alto visible, se vuelve a centrar el
     campo activo. Es lo que evita que acabe tapado por el teclado en iOS. */
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : undefined;
    if (!vv || !interactuado || hecho) return;
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (document.activeElement === inputRef.current) {
          inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 120);
    };
    vv.addEventListener('resize', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      clearTimeout(t);
    };
  }, [interactuado, hecho]);

  const set = useCallback((k: keyof Datos, v: string) => {
    setDatos((d) => ({ ...d, [k]: v }));
    setError(null);
  }, []);

  const avanzar = useCallback(() => {
    setDireccion(1);
    setInteractuado(true);
    setError(null);
    setPaso((p) => Math.min(p + 1, TOTAL - 1));
  }, []);

  const atras = useCallback(() => {
    setDireccion(-1);
    setInteractuado(true);
    setError(null);
    setPaso((p) => {
      const destino = Math.max(p - 1, 0);
      // Si esa pregunta se saltó con "No lo sé", se deja en blanco: el campo
      // vacío y el valor guardado tienen que contar lo mismo.
      const campo = destino === 2 ? 'motor' : destino === 3 ? 'potencia' : null;
      if (campo) setDatos((d) => (d[campo] === NO_LO_SABE ? { ...d, [campo]: '' } : d));
      return destino;
    });
  }, []);

  /** Valida la pantalla actual y, si está bien, pasa a la siguiente. */
  const siguiente = useCallback(() => {
    const fallo = [
      () => validaModelo(datos.modelo),
      () => validaAnio(datos.anio),
      () => validaMotor(datos.motor),
      () => validaPotencia(datos.potencia),
      () => validaNombre(datos.nombre) ?? validaTelefono(datos.telefono),
    ][paso]();

    if (fallo) {
      setError(fallo);
      return;
    }

    // El primer dato contestado marca el arranque real del formulario.
    if (paso === 0 && !formStartEnviado.current) {
      formStartEnviado.current = true;
      trackFormStart();
    }

    if (paso === TOTAL - 1) void enviar();
    else avanzar();
  }, [datos, paso, avanzar]);

  /** Salta la pregunta guardando "No lo sabe" (pasos 3 y 4). */
  const noLoSe = useCallback(
    (campo: 'motor' | 'potencia') => {
      setDatos((d) => ({ ...d, [campo]: NO_LO_SABE }));
      setError(null);
      avanzar();
    },
    [avanzar],
  );

  async function enviar() {
    if (enviando) return;
    setEnviando(true);

    const telefono = normalizaTelefono(datos.telefono) ?? datos.telefono;
    const eventId = nuevoEventId();

    // Honeypot relleno: es un bot. Se le enseña la pantalla final y no se manda
    // nada ni se mide ninguna conversión.
    if (honeypot.current.trim()) {
      setHecho(true);
      setEnviando(false);
      return;
    }

    await enviarLead({
      nombre: datos.nombre.trim(),
      telefono,
      modelo: datos.modelo.trim(),
      anio: datos.anio,
      motor: datos.motor.trim() || NO_LO_SABE,
      potencia: datos.potencia.trim() || NO_LO_SABE,
      event_id: eventId,
      website: '',
    });

    trackLead(eventId);

    /* La pantalla final se enseña pase lo que pase. Con `mode: 'no-cors'` la
       respuesta es opaca y no hay forma de saber si la hoja lo guardó; dejar a
       la persona colgada sería peor. Si algo falla, el botón de WhatsApp que ve
       a continuación recupera el contacto. */
    setHecho(true);
    setEnviando(false);
  }

  const variantes = {
    entra: (dir: number) => ({ opacity: 0, x: reduced ? 0 : dir * 40 }),
    centro: { opacity: 1, x: 0 },
    sale: (dir: number) => ({ opacity: 0, x: reduced ? 0 : dir * -40 }),
  };

  return (
    <section
      id={FORM_ID}
      aria-labelledby="form-t"
      className="relative flex min-h-[100svh] scroll-mt-0 flex-col bg-void"
    >
      <LazyMotion features={domAnimation} strict>
        <div className="shell flex flex-1 flex-col justify-center py-20 lg:py-28">
          <div ref={panelRef} className="mx-auto w-full max-w-[40rem]">
            <AnimatePresence mode="wait" initial={false}>
              {hecho ? (
                <m.div
                  key="final"
                  initial={{ opacity: 0, y: reduced ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <PantallaFinal datos={datos} />
                </m.div>
              ) : (
                <m.div key="preguntas" initial={false} exit={{ opacity: 0 }}>
                  {/* Encabezado: sólo antes de empezar, para no repetirlo en
                      cada pregunta y dejar la pantalla con una sola idea. */}
                  {paso === 0 && (
                    <div className="mb-12">
                      <Eyebrow>Presupuesto gratis</Eyebrow>
                      <h2 id="form-t" className="mt-4 text-[clamp(2.5rem,8.5vw,4.5rem)]">
                        ¿Cuánto gana tu coche?
                      </h2>
                    </div>
                  )}
                  {paso > 0 && (
                    <h2 id="form-t" className="sr-only">
                      ¿Cuánto gana tu coche?
                    </h2>
                  )}

                  {/* Progreso y navegación, juntos y siempre encima de la
                      pregunta: la barra tiene que verse cuando se contesta. */}
                  <div className="mb-9">
                    <div aria-hidden className="h-px w-full bg-hair">
                      <div
                        className="h-px bg-accent"
                        style={{
                          width: `${paso * (100 / TOTAL)}%`,
                          transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
                        }}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="num text-[0.8125rem] text-muted">
                        {paso + 1} / {TOTAL}
                      </span>
                      <button
                        type="button"
                        onClick={atras}
                        disabled={paso === 0}
                        className="inline-flex h-9 items-center gap-2 text-[0.8125rem] text-muted transition-colors duration-300 enabled:hover:text-ink disabled:pointer-events-none disabled:opacity-0"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden
                          className="h-4 w-4"
                        >
                          <path d="M19 12H5M12 5.5 5.5 12 12 18.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Atrás
                      </button>
                    </div>
                  </div>

                  <form
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      siguiente();
                    }}
                  >
                    <AnimatePresence mode="wait" custom={direccion} initial={false}>
                      <m.div
                        key={paso}
                        custom={direccion}
                        variants={variantes}
                        initial="entra"
                        animate="centro"
                        exit="sale"
                        transition={{ duration: reduced ? 0.001 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {paso === 0 && (
                          <Pregunta titulo="¿Qué coche tienes?">
                            <Campo
                              ref={inputRef}
                              id="f-modelo"
                              label="Marca y modelo del coche"
                              value={datos.modelo}
                              onChange={(v) => set('modelo', v)}
                              placeholder="Audi A3, Golf GTI…"
                              autoComplete="off"
                              onFocus={() => setInteractuado(true)}
                            />
                          </Pregunta>
                        )}

                        {paso === 1 && (
                          <Pregunta titulo="¿De qué año es?">
                            <Campo
                              ref={inputRef}
                              id="f-anio"
                              label="Año del coche"
                              value={datos.anio}
                              onChange={(v) => set('anio', v.replace(/\D/g, '').slice(0, 4))}
                              placeholder="2016"
                              inputMode="numeric"
                              maxLength={4}
                              autoComplete="off"
                            />
                          </Pregunta>
                        )}

                        {paso === 2 && (
                          <Pregunta titulo="¿Qué motor lleva?">
                            <Campo
                              ref={inputRef}
                              id="f-motor"
                              label="Motor del coche"
                              value={datos.motor === NO_LO_SABE ? '' : datos.motor}
                              onChange={(v) => set('motor', v)}
                              placeholder="2.0 TDI, 1.5 TSI…"
                              autoComplete="off"
                            />
                            <NoLoSe onClick={() => noLoSe('motor')} />
                          </Pregunta>
                        )}

                        {paso === 3 && (
                          <Pregunta titulo="¿Cuántos CV tiene de serie?">
                            <Campo
                              ref={inputRef}
                              id="f-potencia"
                              label="Caballos de serie"
                              value={datos.potencia === NO_LO_SABE ? '' : datos.potencia}
                              onChange={(v) => set('potencia', v.replace(/\D/g, '').slice(0, 3))}
                              placeholder="150"
                              inputMode="numeric"
                              maxLength={3}
                              sufijo="CV"
                              min={CV_MIN}
                              max={CV_MAX}
                              autoComplete="off"
                            />
                            <NoLoSe onClick={() => noLoSe('potencia')} />
                          </Pregunta>
                        )}

                        {paso === 4 && (
                          <Pregunta titulo="¿A quién se lo enviamos?">
                            <div className="space-y-4">
                              <Campo
                                ref={inputRef}
                                id="f-nombre"
                                label="Tu nombre"
                                value={datos.nombre}
                                onChange={(v) => set('nombre', v)}
                                placeholder="Nombre"
                                autoComplete="given-name"
                              />
                              <Campo
                                id="f-telefono"
                                label="Tu teléfono"
                                value={datos.telefono}
                                onChange={(v) => set('telefono', v)}
                                placeholder="Teléfono"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                enterHint="send"
                              />
                            </div>

                            {/* Honeypot: invisible para una persona, irresistible
                                para un bot que rellena todo lo que encuentra. */}
                            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                              <label htmlFor="website">No rellenes este campo</label>
                              <input
                                id="website"
                                name="website"
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                                onChange={(e) => {
                                  honeypot.current = e.target.value;
                                }}
                              />
                            </div>
                          </Pregunta>
                        )}
                      </m.div>
                    </AnimatePresence>

                    <p
                      role="alert"
                      aria-live="polite"
                      className={`mt-4 text-[0.875rem] text-[#ff8f8f] transition-opacity duration-300 ${
                        error ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {error ?? ' '}
                    </p>

                    <button
                      type="submit"
                      disabled={enviando}
                      className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-7 text-[0.9375rem] font-medium text-white transition-[transform,background-color] duration-300 hover:bg-accent-hi active:scale-[0.98] disabled:opacity-50 sm:w-auto sm:min-w-[16rem]"
                    >
                      {paso === TOTAL - 1 ? (
                        enviando ? (
                          <>
                            <Spinner /> Enviando…
                          </>
                        ) : (
                          'Recibir mi precio'
                        )
                      ) : (
                        <>
                          Continuar <Flecha />
                        </>
                      )}
                    </button>

                    {paso === TOTAL - 1 && (
                      <p className="mt-5 text-[0.75rem] text-muted">
                        Al enviar aceptas la{' '}
                        <Link
                          href="/politica-privacidad"
                          className="underline decoration-white/20 underline-offset-2 hover:text-muted"
                        >
                          política de privacidad
                        </Link>
                        .
                      </p>
                    )}
                  </form>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </LazyMotion>
    </section>
  );
}

/* ========================================================================== */

function Pregunta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <h3 className="text-[clamp(1.625rem,5.8vw,2.5rem)]">{titulo}</h3>
      <div className="mt-8">{children}</div>
    </div>
  );
}

type CampoProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  inputMode?: 'numeric' | 'tel' | 'text';
  maxLength?: number;
  autoComplete?: string;
  sufijo?: string;
  min?: number;
  max?: number;
  onFocus?: () => void;
  enterHint?: 'next' | 'send';
  ref?: React.Ref<HTMLInputElement>;
};

/** Campo sin caja: una línea fina debajo que se enciende al enfocar. */
function Campo({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  maxLength,
  autoComplete,
  sufijo,
  min,
  max,
  onFocus,
  enterHint = 'next',
  ref,
}: CampoProps) {
  return (
    <div className="relative">
      {/* Label real aunque no se vea: un placeholder no es una etiqueta. */}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        enterKeyHint={enterHint}
        aria-describedby={min !== undefined ? `${id}-rango` : undefined}
        className="peer w-full border-b border-hair bg-transparent pb-4 text-[1.375rem] text-ink transition-colors duration-300 outline-none placeholder:text-muted-dark focus:border-accent sm:text-[1.625rem]"
        style={sufijo ? { paddingRight: '3rem' } : undefined}
      />
      {sufijo && (
        <span aria-hidden className="absolute right-0 bottom-4 text-[1.125rem] text-muted">
          {sufijo}
        </span>
      )}
      {min !== undefined && max !== undefined && (
        <span id={`${id}-rango`} className="sr-only">
          Entre {min} y {max}
        </span>
      )}
    </div>
  );
}

function NoLoSe({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-5 text-[0.875rem] text-muted underline decoration-white/20 underline-offset-[6px] transition-colors duration-300 hover:text-ink"
    >
      No lo sé
    </button>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 animate-spin">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ========================================================================== */

function PantallaFinal({ datos }: { datos: Datos }) {
  const nombre = datos.nombre.trim().split(' ')[0] || datos.nombre.trim();

  return (
    <div>
      <m.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="grid h-14 w-14 place-items-center rounded-full bg-accent"
      >
        <m.svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="h-6 w-6"
        >
          {/* El check se dibuja solo: es la única animación de trazo de la
              página y dura menos de medio segundo. */}
          <m.path
            d="M5 12.5 10 17.5 19 7.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
        </m.svg>
      </m.div>

      <h3 className="mt-8 text-[clamp(2.25rem,7.5vw,3.5rem)]">Listo, {nombre}.</h3>
      <p className="mt-5 max-w-[32ch] text-[1.0625rem] text-muted">
        Te escribimos por WhatsApp en menos de 24 h.
      </p>

      <a
        href={waLink(mensajeWhatsapp(datos))}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackContact('whatsapp')}
        className="mt-10 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-hair px-7 text-[0.9375rem] font-medium text-ink transition-colors duration-300 hover:border-white/30 sm:w-auto"
      >
        <IconoWhatsapp className="h-4 w-4" />
        Escribir ahora por WhatsApp
      </a>
    </div>
  );
}
