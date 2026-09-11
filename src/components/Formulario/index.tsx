'use client';

import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FORM_ID, SITE, waLink } from '@/lib/config';
import { useReducedMotion } from '@/lib/hooks';
import { capturarUtm, enviarLead } from '@/lib/leads';
import { nuevoEventId, trackContact, trackFormStart, trackLead } from '@/lib/tracking';
import { ArrowRight, Check, Eyebrow, WhatsappIcon } from '../ui';
import { Progreso } from './Progreso';
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

/** Mensaje de WhatsApp de la pantalla final, con lo que el usuario haya contado. */
function mensajeWhatsapp(d: Datos): string {
  const partes = [`Hola, soy ${d.nombre.trim()}.`, `Acabo de pedir presupuesto en la web para mi ${d.modelo.trim()} de ${d.anio}`];
  let texto = partes.join(' ');
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
  const tarjetaRef = useRef<HTMLDivElement>(null);
  const formStartEnviado = useRef(false);
  const reduced = useReducedMotion();

  /* Los UTM se guardan al entrar: si el usuario se va a leer la política de
     privacidad y vuelve, el origen del anuncio sigue ahí. */
  useEffect(() => {
    capturarUtm();
  }, []);

  /**
   * Foco en el campo de cada pantalla, pero sólo después de que la persona haya
   * empezado. Si se enfocara al cargar, el móvil abriría el teclado y saltaría
   * al formulario sin que nadie lo haya pedido.
   *
   * Tras enfocar se lleva la tarjeta al centro: cuando sube el teclado, el
   * campo activo queda a la vista y no debajo de él.
   */
  useEffect(() => {
    if (!interactuado || hecho) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    const t = setTimeout(() => {
      tarjetaRef.current?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    }, 60);
    return () => clearTimeout(t);
  }, [paso, interactuado, hecho, reduced]);

  /* Si el teclado del móvil cambia el alto visible, se vuelve a centrar la
     tarjeta. Es lo que evita que el campo activo acabe tapado en iOS. */
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
      if (campo) {
        setDatos((d) => (d[campo] === NO_LO_SABE ? { ...d, [campo]: '' } : d));
      }
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

    // Honeypot relleno: es un bot. Se le enseña la pantalla final y no se
    // manda nada ni se mide ninguna conversión.
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
       respuesta es opaca y no hay forma de saber si la hoja lo guardó, así que
       dejar al usuario colgado sería peor: si algo ha fallado, el botón de
       WhatsApp que ve a continuación recupera el contacto. */
    setHecho(true);
    setEnviando(false);
  }

  const variantes = {
    entra: (dir: number) => ({ opacity: 0, x: reduced ? 0 : dir * 48 }),
    centro: { opacity: 1, x: 0 },
    sale: (dir: number) => ({ opacity: 0, x: reduced ? 0 : dir * -48 }),
  };

  return (
    <section
      id={FORM_ID}
      aria-labelledby="form-t"
      className="relative isolate scroll-mt-20 overflow-hidden bg-ink-2 py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(75% 52% at 50% 0%, rgba(20,74,190,0.26), transparent 66%)' }}
      />
      <div aria-hidden className="rule-blue absolute inset-x-0 top-0 h-px opacity-60" />

      <div className="shell gutter">
        <div className="mx-auto max-w-[40rem] text-center">
          <Eyebrow>Presupuesto gratis</Eyebrow>
          <h2 id="form-t" className="text-metal mt-3 text-[clamp(1.75rem,7.4vw,3rem)] leading-[1.03]">
            ¿Cuánto gana tu coche?
          </h2>
          <p className="mt-3 text-[1.0625rem] text-mist">
            Cuatro preguntas sobre el coche y cómo localizarte. Treinta segundos.
          </p>
        </div>

        <LazyMotion features={domAnimation} strict>
          <div
            ref={tarjetaRef}
            className="relative mx-auto mt-8 max-w-[40rem] overflow-hidden rounded-3xl border border-[#26272f] bg-[#111117] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
          >
            <AnimatePresence mode="wait" custom={direccion} initial={false}>
              {hecho ? (
                <m.div
                  key="final"
                  initial={{ opacity: 0, y: reduced ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  className="p-6 sm:p-9"
                >
                  <PantallaFinal datos={datos} />
                </m.div>
              ) : (
                <m.div
                  key="preguntas"
                  initial={false}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0.001 : 0.2 }}
                >
                  {/* --- Cuentarrevoluciones --- */}
                  <div className="flex items-center justify-between gap-3 border-b border-[#22232b] px-4 py-3 sm:px-6">
                    <Progreso paso={paso} total={TOTAL} />
                    <button
                      type="button"
                      onClick={atras}
                      disabled={paso === 0}
                      className="tap -mr-2 inline-flex items-center gap-1.5 rounded-lg px-3 text-[0.875rem] text-smoke transition-colors enabled:hover:text-chalk disabled:opacity-35"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden className="h-4 w-4">
                        <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Atrás
                    </button>
                  </div>

                  {/* --- Pantallas --- */}
                  <form
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      siguiente();
                    }}
                    className="min-h-[19rem] p-5 sm:min-h-[20rem] sm:p-8"
                  >
                    <AnimatePresence mode="wait" custom={direccion} initial={false}>
                      <m.div
                        key={paso}
                        custom={direccion}
                        variants={variantes}
                        initial="entra"
                        animate="centro"
                        exit="sale"
                        transition={{ duration: reduced ? 0.001 : 0.28, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {paso === 0 && (
                          <Pregunta titulo="¿Qué coche tienes?" ayuda="Marca y modelo. Con eso nos vale.">
                            <Campo
                              ref={inputRef}
                              id="f-modelo"
                              label="Marca y modelo del coche"
                              value={datos.modelo}
                              onChange={(v) => set('modelo', v)}
                              placeholder="Ej: Audi A3, BMW Serie 3, Golf GTI…"
                              autoComplete="off"
                              onFocus={() => setInteractuado(true)}
                            />
                          </Pregunta>
                        )}

                        {paso === 1 && (
                          <Pregunta titulo="¿De qué año es?" ayuda="El año de matriculación.">
                            <Campo
                              ref={inputRef}
                              id="f-anio"
                              label="Año del coche"
                              value={datos.anio}
                              onChange={(v) => set('anio', v.replace(/\D/g, '').slice(0, 4))}
                              placeholder="Ej: 2016"
                              inputMode="numeric"
                              maxLength={4}
                              autoComplete="off"
                            />
                          </Pregunta>
                        )}

                        {paso === 2 && (
                          <Pregunta titulo="¿Qué motor lleva?" ayuda="Lo pone en la ficha técnica, y casi siempre en el portón.">
                            <Campo
                              ref={inputRef}
                              id="f-motor"
                              label="Motor del coche"
                              value={datos.motor === NO_LO_SABE ? '' : datos.motor}
                              onChange={(v) => set('motor', v)}
                              placeholder="Ej: 2.0 TDI, 1.6 HDI, 1.5 TSI…"
                              autoComplete="off"
                            />
                            <NoLoSe onClick={() => noLoSe('motor')} />
                          </Pregunta>
                        )}

                        {paso === 3 && (
                          <Pregunta titulo="¿Cuántos caballos tiene de serie?" ayuda="Los de fábrica, sin contar nada que se le haya hecho.">
                            <Campo
                              ref={inputRef}
                              id="f-potencia"
                              label="Caballos de serie"
                              value={datos.potencia === NO_LO_SABE ? '' : datos.potencia}
                              onChange={(v) => set('potencia', v.replace(/\D/g, '').slice(0, 3))}
                              placeholder="Ej: 150"
                              inputMode="numeric"
                              maxLength={3}
                              sufijo="CV"
                              autoComplete="off"
                              min={CV_MIN}
                              max={CV_MAX}
                            />
                            <NoLoSe onClick={() => noLoSe('potencia')} />
                          </Pregunta>
                        )}

                        {paso === 4 && (
                          <Pregunta titulo="¿A quién le enviamos el presupuesto?" ayuda="Te escribimos por WhatsApp en menos de 24 horas.">
                            <div className="space-y-3">
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

                    {/* --- Error --- */}
                    <p
                      role="alert"
                      aria-live="polite"
                      className={`mt-3 text-[0.875rem] text-[#ff8d8d] transition-opacity duration-200 ${
                        error ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {error ?? ' '}
                    </p>

                    {/* --- Acción --- */}
                    <button
                      type="submit"
                      disabled={enviando}
                      className="bg-blue-grad glow-blue tap mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-5 text-[1.0625rem] font-semibold text-white transition-transform duration-200 active:scale-[0.985] disabled:opacity-60"
                    >
                      {paso === TOTAL - 1 ? (
                        enviando ? (
                          <>
                            <Spinner /> Enviando…
                          </>
                        ) : (
                          'Quiero mi presupuesto gratis'
                        )
                      ) : (
                        <>
                          Siguiente <ArrowRight />
                        </>
                      )}
                    </button>

                    {paso === TOTAL - 1 && (
                      <p className="mt-3 text-center text-[0.75rem] leading-relaxed text-[#83868f]">
                        Al enviar, aceptas que VDN Performance use tus datos para enviarte el
                        presupuesto. Más info en la{' '}
                        <Link
                          href="/politica-privacidad"
                          className="text-[#8f939c] underline decoration-[#3a3c45] underline-offset-2 hover:text-blue-300"
                        >
                          Política de privacidad
                        </Link>
                        .
                      </p>
                    )}
                  </form>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </LazyMotion>

        <p className="mx-auto mt-5 max-w-[40rem] text-center text-[0.8125rem] text-smoke">
          Sin compromiso. Si no te encaja, no pasa nada.
        </p>
      </div>
    </section>
  );
}

/* ========================================================================== */

function Pregunta({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  ayuda: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <h3 className="text-[clamp(1.375rem,5.6vw,1.875rem)] leading-tight text-chalk normal-case">
        {titulo}
      </h3>
      <p className="mt-1.5 text-[0.875rem] text-smoke">{ayuda}</p>
      <div className="mt-5">{children}</div>
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
      {/* Todos los campos tienen label de verdad, aunque no se vea: el
          placeholder no es una etiqueta accesible. */}
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
        aria-describedby={min !== undefined ? `${id}-rango` : undefined}
        enterKeyHint={enterHint}
        className="w-full rounded-xl border border-[#2c2d36] bg-[#0c0c10] px-4 py-3.5 text-[1.0625rem] text-chalk transition-colors placeholder:text-[#797c88] focus:border-blue-400 sm:text-lg"
        style={sufijo ? { paddingRight: '3.5rem' } : undefined}
      />
      {sufijo && (
        <span
          aria-hidden
          className="font-display pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-base font-semibold text-smoke"
        >
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
      className="mt-3 text-[0.875rem] text-smoke underline decoration-[#3a3c45] underline-offset-4 transition-colors hover:text-blue-300"
    >
      No lo sé
    </button>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 animate-spin">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ========================================================================== */

function PantallaFinal({ datos }: { datos: Datos }) {
  const nombre = datos.nombre.trim().split(' ')[0] || datos.nombre.trim();

  return (
    <div className="relative text-center">
      {/* Destello de luz detrás del check */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-1/2 h-44 w-56 -translate-x-1/2 rounded-full bg-blue-500/25 blur-3xl"
      />

      <div className="relative mx-auto grid h-20 w-20 place-items-center">
        <m.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-blue-grad glow-blue-strong absolute inset-0 rounded-full"
        />
        <m.span
          initial={{ scale: 0.6, opacity: 0.6 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ delay: 0.18, duration: 0.9, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full border border-blue-300"
        />
        <m.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.26, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative text-white"
        >
          <Check className="h-9 w-9" />
        </m.span>
      </div>

      <h3 className="mt-6 text-[clamp(1.5rem,6.4vw,2.25rem)] text-chalk normal-case">
        ¡Listo, {nombre}! 🔥
      </h3>
      <p className="mx-auto mt-3 max-w-[40ch] text-[1.0625rem] text-mist">
        En menos de 24 horas te escribimos por WhatsApp con lo que puede ganar tu{' '}
        <span className="text-chalk">{datos.modelo.trim()}</span>.
      </p>

      <a
        href={waLink(mensajeWhatsapp(datos))}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackContact('whatsapp')}
        className="tap mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1FAD55] px-5 font-semibold text-white shadow-[0_10px_34px_-14px_rgba(31,173,85,0.9)] transition-transform duration-200 active:scale-[0.985] sm:w-auto sm:px-7"
      >
        <WhatsappIcon /> ¿Tienes prisa? Escríbenos ahora
      </a>

      <p className="mt-5 text-[0.8125rem] text-smoke">
        Abrimos todos los días de 8:00 a 23:00 · {SITE.taller.ciudad}
      </p>
    </div>
  );
}
