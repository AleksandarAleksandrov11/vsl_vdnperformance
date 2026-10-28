'use client';

import { AnimatePresence, LazyMotion, m } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FORM_ID, SITE, waLink } from '@/lib/config';
import { cargarAnimaciones, useReducedMotion } from '@/lib/hooks';
import { enviarLead } from '@/lib/leads';
import { PREFIJOS, PREFIJO_POR_DEFECTO, paisDeNumero } from '@/lib/prefijos';
import {
  datosMedicion,
  nuevoEventId,
  trackContact,
  trackFormError,
  trackFormStart,
  trackFormStep,
  trackLead,
} from '@/lib/tracking';
import { Eyebrow, Flecha, IconoWhatsapp } from '../kit';
import {
  CV_MAX,
  CV_MIN,
  NO_LO_SABE,
  PREFIJO_OTRO,
  prefijoEfectivo,
  separarPrefijo,
  telefonoParaHoja,
  validaAnio,
  validaModelo,
  validaMotor,
  validaNombre,
  validaPotencia,
  validaTelefonoCon,
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

/** Campo que se valida en cada paso, para el evento FormError. */
const CAMPO_DEL_PASO = ['modelo', 'anio', 'motor', 'potencia', 'nombre'] as const;

/* ------------------------------------------------------------------ *
 * Progreso guardado
 * Si la persona abre una legal, recarga o el navegador de Instagram
 * restaura la página, el formulario vuelve donde estaba.
 * ------------------------------------------------------------------ */

const PROGRESO_KEY = 'vdn.form.v1';

type Progreso = { paso: number; datos: Datos; prefijo: string; prefijoOtro: string; eventId: string | null };

function leerProgreso(): Progreso | null {
  try {
    const p = JSON.parse(window.sessionStorage.getItem(PROGRESO_KEY) ?? 'null') as Progreso | null;
    if (!p || typeof p.paso !== 'number' || typeof p.datos !== 'object') return null;
    return { ...p, paso: Math.min(Math.max(0, p.paso), TOTAL - 1), datos: { ...VACIO, ...p.datos } };
  } catch {
    return null;
  }
}

function guardarProgreso(p: Progreso | null): void {
  try {
    if (p) window.sessionStorage.setItem(PROGRESO_KEY, JSON.stringify(p));
    else window.sessionStorage.removeItem(PROGRESO_KEY);
  } catch {
    /* sin sessionStorage: el progreso vive sólo en esta página */
  }
}

/** Lo contestado, sin lo que la persona no sabía ("No lo sé"). */
const dato = (v: string) => (v && v !== NO_LO_SABE ? v.trim() : '');

/**
 * Mensaje de WhatsApp de la pantalla de gracias: resume sólo lo que pregunta
 * el formulario, en una línea y sin emojis. Lo que la persona no sabía no sale.
 */
function mensajeWhatsapp(d: Datos): string {
  const potencia = dato(d.potencia);
  const coche = [dato(d.modelo), dato(d.anio), dato(d.motor), potencia && `${potencia} CV`].filter(Boolean);
  return `Hola, soy ${d.nombre.trim()}. Mi coche: ${coche.join(', ')}.`;
}

/**
 * Mensaje de la pantalla de error de envío: todos los datos del formulario,
 * para que el presupuesto llegue aunque la web no haya podido guardarlo.
 */
function mensajeError(d: Datos, telefono: string): string {
  return [mensajeWhatsapp(d), `Mi teléfono: ${telefono}.`].join('\n');
}

/** Móvil o tableta táctil: allí WhatsApp se abre solo al enviar. */
const esTactil = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export function Formulario() {
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [prefijo, setPrefijo] = useState(PREFIJO_POR_DEFECTO);
  const [prefijoOtro, setPrefijoOtro] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [direccion, setDireccion] = useState<1 | -1>(1);
  const [interactuado, setInteractuado] = useState(false);

  const honeypot = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /** Candado del envío: un doble Enter o doble toque no manda dos POST. */
  const enviandoRef = useRef(false);
  /** event_id del presupuesto: nace al empezar y se reutiliza en un reintento. */
  const eventIdRef = useRef<string | null>(null);
  const restaurado = useRef(false);
  const reduced = useReducedMotion();

  /* Recupera el progreso guardado al volver a la página. Va en un rAF (fuera
     del cuerpo del efecto) para no encadenar renders durante la hidratación. */
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      restaurado.current = true;
      const p = leerProgreso();
      if (!p) return;
      eventIdRef.current = p.eventId;
      setDatos(p.datos);
      setPaso(p.paso);
      setPrefijo(p.prefijo || PREFIJO_POR_DEFECTO);
      setPrefijoOtro(p.prefijoOtro || '');
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Y lo guarda en cada cambio. Al terminar se borra. */
  useEffect(() => {
    if (!restaurado.current) return;
    if (hecho) guardarProgreso(null);
    else guardarProgreso({ paso, datos, prefijo, prefijoOtro, eventId: eventIdRef.current });
  }, [paso, datos, prefijo, prefijoOtro, hecho]);

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
        const activo = document.activeElement;
        if (activo instanceof HTMLElement && panelRef.current?.contains(activo) && activo.matches('input, select')) {
          activo.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 120);
    };
    vv.addEventListener('resize', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      clearTimeout(t);
    };
  }, [interactuado, hecho]);

  /** Vuelve a dejar el formulario en blanco para pedir otro presupuesto. */
  const otroPresupuesto = useCallback(() => {
    setDatos(VACIO);
    setPaso(0);
    setDireccion(1);
    setError(null);
    setErrorEnvio(false);
    setHecho(false);
    setPrefijo(PREFIJO_POR_DEFECTO);
    setPrefijoOtro('');
    honeypot.current = '';
    eventIdRef.current = null;
    // FormStart marca el arranque del formulario en la sesión, no de cada
    // envío: no se reinicia, o se contaría dos veces la misma visita.
  }, []);

  const set = useCallback((k: keyof Datos, v: string) => {
    setDatos((d) => ({ ...d, [k]: v }));
    setError(null);
    setErrorEnvio(false);
  }, []);

  /** Teléfono: si se pega con "+" o "00", el prefijo va al selector y no se duplica. */
  const setTelefono = useCallback(
    (v: string) => {
      const separado = separarPrefijo(
        v,
        PREFIJOS.map((p) => p.codigo),
      );
      if (separado) {
        setPrefijo(separado.prefijo);
        set('telefono', separado.resto);
      } else set('telefono', v);
    },
    [set],
  );

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
    setErrorEnvio(false);
    setPaso((p) => {
      const destino = Math.max(p - 1, 0);
      // Si esa pregunta se saltó con "No lo sé", se deja en blanco: el campo
      // vacío y el valor guardado tienen que contar lo mismo.
      const campo = destino === 2 ? 'motor' : destino === 3 ? 'potencia' : null;
      if (campo) setDatos((d) => (d[campo] === NO_LO_SABE ? { ...d, [campo]: '' } : d));
      return destino;
    });
  }, []);

  const enviar = useCallback(async () => {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setErrorEnvio(false);

    const telefono = telefonoParaHoja(prefijo, prefijoOtro, datos.telefono);
    const eventId = (eventIdRef.current ??= nuevoEventId());

    // Honeypot relleno: es un bot. Se le enseña la pantalla final y no se manda
    // nada ni se mide ninguna conversión.
    if (honeypot.current.trim()) {
      setHecho(true);
      setEnviando(false);
      enviandoRef.current = false;
      return;
    }

    const resultado = await enviarLead(
      {
        nombre: datos.nombre.trim(),
        telefono,
        modelo: datos.modelo.trim(),
        anio: datos.anio,
        motor: datos.motor.trim() || NO_LO_SABE,
        potencia: datos.potencia.trim() || NO_LO_SABE,
        event_id: eventId,
        website: '',
      },
      datosMedicion(),
    );

    enviandoRef.current = false;
    setEnviando(false);

    /* Sin red, cortado o la hoja falló: se avisa, todo lo contestado sigue en
       su sitio y se ofrece mandarlo por WhatsApp. No se mide Lead. */
    if (resultado === 'error') {
      setError('No se ha podido enviar. Revisa la conexión y vuelve a pulsar «Enviar».');
      setErrorEnvio(true);
      return;
    }

    // El Lead sólo se mide cuando la hoja confirma que lo guardó.
    if (resultado === 'ok') {
      const ph = telefono.replace(/\D/g, '');
      const internacional = ph.length === 9 ? `34${ph}` : ph;
      trackLead(eventId, {
        ph: internacional,
        fn: datos.nombre.trim().split(/\s+/)[0]?.toLowerCase(),
        country: paisDeNumero(internacional) ?? 'es',
      });
    }
    setHecho(true);
  }, [datos, prefijo, prefijoOtro]);

  /** Valida la pantalla actual y, si está bien, pasa a la siguiente. */
  const siguiente = useCallback(() => {
    const fallo = [
      () => validaModelo(datos.modelo),
      () => validaAnio(datos.anio),
      () => validaMotor(datos.motor),
      () => validaPotencia(datos.potencia),
      () => validaNombre(datos.nombre) ?? validaTelefonoCon(prefijo, prefijoOtro, datos.telefono),
    ][paso]();

    if (fallo) {
      setError(fallo);
      const campo = paso === 4 && !validaNombre(datos.nombre) ? 'telefono' : CAMPO_DEL_PASO[paso];
      trackFormError(paso + 1, campo);
      return;
    }

    // El primer dato contestado marca el arranque real del formulario.
    if (paso === 0) {
      eventIdRef.current ??= nuevoEventId();
      trackFormStart();
    }
    trackFormStep(paso + 1);

    if (paso === TOTAL - 1) void enviar();
    else avanzar();
  }, [datos, paso, prefijo, prefijoOtro, avanzar, enviar]);

  /** Salta la pregunta guardando "No lo sabe" (pasos 3 y 4). */
  const noLoSe = useCallback(
    (campo: 'motor' | 'potencia') => {
      setDatos((d) => ({ ...d, [campo]: NO_LO_SABE }));
      setError(null);
      trackFormStep(campo === 'motor' ? 3 : 4);
      avanzar();
    },
    [avanzar],
  );

  const variantes = {
    entra: (dir: number) => ({ opacity: 0, x: reduced ? 0 : dir * 40 }),
    centro: { opacity: 1, x: 0 },
    sale: (dir: number) => ({ opacity: 0, x: reduced ? 0 : dir * -40 }),
  };

  return (
    <section
      id={FORM_ID}
      aria-labelledby="form-t"
      className="tex-glow relative isolate flex min-h-[100svh] scroll-mt-0 flex-col bg-void"
    >
      <LazyMotion features={cargarAnimaciones} strict>
        <div className="shell relative z-10 flex flex-1 flex-col justify-center py-20 lg:py-24">
          <div ref={panelRef} className="mx-auto w-full max-w-[40rem]">
            <AnimatePresence mode="wait" initial={false}>
              {hecho ? (
                <m.div
                  key="final"
                  initial={{ opacity: 0, y: reduced ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <PantallaFinal datos={datos} onOtro={otroPresupuesto} />
                </m.div>
              ) : (
                <m.div key="preguntas" initial={false} exit={{ opacity: 0 }}>
                  {/* El encabezado se queda durante todo el recorrido: es lo que
                      recuerda para qué se están contestando las preguntas. Al
                      avanzar sólo encoge, no desaparece, y encoge con transform
                      para que no empuje nada de lo que hay debajo. */}
                  <div className={paso === 0 ? 'mb-12' : 'mb-8'}>
                    <Eyebrow>Presupuesto gratis</Eyebrow>
                    <h2
                      id="form-t"
                      className={`mt-4 origin-left transition-[font-size] duration-500 ease-brand ${
                        paso === 0
                          ? 'text-[clamp(2.5rem,8.5vw,4.5rem)]'
                          : 'text-[clamp(1.5rem,5vw,2.25rem)]'
                      }`}
                    >
                      ¿Cuánto gana tu coche?
                    </h2>
                  </div>

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
                              autoCapitalize="words"
                              corrector={false}
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
                              autoCapitalize="characters"
                              corrector={false}
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
                                autoComplete="name"
                                autoCapitalize="words"
                              />
                              <CampoTelefono
                                prefijo={prefijo}
                                prefijoOtro={prefijoOtro}
                                onPrefijo={(v) => {
                                  setPrefijo(v);
                                  setError(null);
                                }}
                                onPrefijoOtro={(v) => {
                                  setPrefijoOtro(v.replace(/\D/g, '').slice(0, 4));
                                  setError(null);
                                }}
                                value={datos.telefono}
                                onChange={setTelefono}
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

                    {/* Si el envío falla, el presupuesto no se pierde: se puede
                        reintentar o mandarlo por WhatsApp con todos los datos. */}
                    {errorEnvio && (
                      <a
                        href={waLink(mensajeError(datos, telefonoParaHoja(prefijo, prefijoOtro, datos.telefono)))}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackContact('error-envio')}
                        className="mt-2 mb-2 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-hair px-7 text-[0.9375rem] font-medium text-ink transition-colors duration-300 hover:border-white/30 sm:w-auto"
                      >
                        <IconoWhatsapp className="h-4 w-4" />
                        Enviar por WhatsApp
                      </a>
                    )}

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
                          /* En móvil WhatsApp se abre solo al enviar; en escritorio no. */
                          <>
                            <span className="pointer-coarse:hidden">Enviar</span>
                            <span className="hidden pointer-coarse:inline">Enviar y abrir WhatsApp</span>
                          </>
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
                        <a
                          href="/politica-privacidad/"
                          target="_blank"
                          rel="noopener"
                          className="underline decoration-white/20 underline-offset-2 hover:text-muted"
                        >
                          política de privacidad
                        </a>{' '}
                        y que {SITE.name} te contacte sobre tu solicitud.
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
  /** 'words' para nombres y modelos: el teclado pone la mayúscula solo. */
  autoCapitalize?: 'off' | 'words' | 'characters';
  /** false en modelo y motor: el corrector cambia "TDI" o "GTI" por palabras. */
  corrector?: boolean;
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
  autoCapitalize,
  corrector = true,
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
        autoCapitalize={autoCapitalize}
        autoCorrect={corrector ? undefined : 'off'}
        spellCheck={corrector ? undefined : false}
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

function PantallaFinal({ datos, onOtro }: { datos: Datos; onOtro: () => void }) {
  const nombre = datos.nombre.trim().split(' ')[0] || datos.nombre.trim();
  const enlace = waLink(mensajeWhatsapp(datos));

  /* En móvil, WhatsApp se abre solo a los 1,5 s: la persona escribe en
     caliente. Con location.href y no window.open, que tras un await se bloquea
     en iOS y en el navegador de Instagram. El Lead ya salió antes de mostrar
     esta pantalla, así que entre los dos hay más de 800 ms. En escritorio no se
     redirige: sólo queda el botón. */
  useEffect(() => {
    if (!esTactil()) return;
    /* El Contact sale 300 ms antes de navegar: si saliera a la vez, la
       navegación cortaría la petición del píxel. */
    const aviso = setTimeout(() => trackContact('gracias-auto'), 1200);
    const t = setTimeout(() => {
      window.location.href = enlace;
    }, 1500);
    return () => {
      clearTimeout(aviso);
      clearTimeout(t);
    };
  }, [enlace]);

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
        <span className="hidden pointer-coarse:inline">Te abrimos WhatsApp para que nos escribas ya.</span>
        <span className="pointer-coarse:hidden">Te escribimos por WhatsApp en menos de 24 h.</span>
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackContact('gracias-boton')}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-hair px-7 text-[0.9375rem] font-medium text-ink transition-colors duration-300 hover:border-white/30 sm:w-auto"
        >
          <IconoWhatsapp className="h-4 w-4" />
          Abrir WhatsApp
        </a>

        {/* Mucha gente tiene dos coches. Si no hay forma de volver a empezar,
            toca recargar la página a mano. */}
        <button
          type="button"
          onClick={onOtro}
          className="inline-flex h-14 items-center justify-center px-2 text-[0.9375rem] text-muted underline decoration-white/20 underline-offset-[6px] transition-colors duration-300 hover:text-ink"
        >
          Pedir otro presupuesto
        </button>
      </div>
    </div>
  );
}

/* ========================================================================== */

/**
 * Teléfono con selector de prefijo delante. El selector es el nativo del
 * sistema (en el móvil abre la rueda o la lista de siempre), invisible encima
 * de un texto corto con el prefijo, para que ocupe poco.
 */
function CampoTelefono({
  prefijo,
  prefijoOtro,
  onPrefijo,
  onPrefijoOtro,
  value,
  onChange,
}: {
  prefijo: string;
  prefijoOtro: string;
  onPrefijo: (v: string) => void;
  onPrefijoOtro: (v: string) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  const esOtro = prefijo === PREFIJO_OTRO;
  const linea = 'border-b border-hair pb-4 text-[1.375rem] text-ink sm:text-[1.625rem]';
  return (
    <div className="flex items-end gap-3">
      <div className={`relative shrink-0 ${linea} flex items-center gap-1.5`}>
        <span aria-hidden>{esOtro ? 'Otro' : `+${prefijo}`}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className="h-4 w-4 text-muted">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <select
          id="f-prefijo"
          aria-label="Prefijo del teléfono"
          value={prefijo}
          onChange={(e) => onPrefijo(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {PREFIJOS.map((p) => (
            <option key={p.codigo} value={p.codigo}>
              {p.pais} +{p.codigo}
            </option>
          ))}
          <option value={PREFIJO_OTRO}>Otro prefijo</option>
        </select>
      </div>

      {esOtro && (
        <div className={`flex shrink-0 items-center ${linea}`}>
          <span aria-hidden className="text-muted">
            +
          </span>
          <label htmlFor="f-prefijo-otro" className="sr-only">
            Prefijo de tu país
          </label>
          <input
            id="f-prefijo-otro"
            value={prefijoOtro}
            onChange={(e) => onPrefijoOtro(e.target.value)}
            inputMode="numeric"
            maxLength={4}
            autoComplete="tel-country-code"
            placeholder="351"
            className="w-[3.2em] bg-transparent text-ink outline-none placeholder:text-muted-dark"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <Campo
          id="f-telefono"
          label={`Tu teléfono, sin el prefijo +${prefijoEfectivo(prefijo, prefijoOtro) || ''}`}
          value={value}
          onChange={onChange}
          placeholder="Teléfono"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          enterHint="send"
        />
      </div>
    </div>
  );
}
