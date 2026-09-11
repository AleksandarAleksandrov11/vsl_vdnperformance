'use client';

import { useCallback, useRef, useState } from 'react';
import { useInViewOnce } from '@/lib/hooks';
import { Contador, Eyebrow, H2_CLASS, Reveal, Section, Titular } from './kit';

/* ==========================================================================
   Resultado — tres motores de ejemplo, con su curva y su tabla.

   Las cifras son ejemplos reales de motores habituales, no una promesa: cada
   coche se mide en el taller. Eso queda escrito debajo de la tabla.
   ========================================================================== */

type Cifras = { cv: number; nm: number; consumo: number };

type Motor = {
  id: string;
  pestana: string;
  nombre: string;
  serie: Cifras;
  vdn: Cifras;
  rpm: [number, number];
  /** Régimen donde cada curva hace pico. */
  pico: [serie: number, vdn: number];
  techo: number;
};

const MOTORES: Motor[] = [
  {
    id: 'tdi-20',
    pestana: '2.0 TDI',
    nombre: '2.0 TDI 140 CV',
    serie: { cv: 140, nm: 320, consumo: 5.4 },
    vdn: { cv: 180, nm: 400, consumo: 4.9 },
    rpm: [1000, 4800],
    pico: [4000, 3800],
    techo: 210,
  },
  {
    id: 'tsi-15',
    pestana: '1.5 TSI',
    nombre: '1.5 TSI 150 CV',
    serie: { cv: 150, nm: 250, consumo: 6.2 },
    vdn: { cv: 185, nm: 300, consumo: 5.8 },
    rpm: [1200, 6200],
    pico: [5600, 5300],
    techo: 210,
  },
  {
    id: 'tdi-30',
    pestana: '3.0 TDI',
    nombre: '3.0 TDI 245 CV',
    serie: { cv: 245, nm: 500, consumo: 6.8 },
    vdn: { cv: 300, nm: 620, consumo: 6.3 },
    rpm: [1000, 4800],
    pico: [4100, 3900],
    techo: 330,
  },
];

/* --- Geometría del gráfico ------------------------------------------------ */

const W = 720;
const H = 320;
const PAD = { top: 22, right: 62, bottom: 30, left: 6 };

/** CV en un régimen dado: sube rápido, hace pico y cae un poco arriba. */
function cvEn(rpm: number, pico: number, rpmPico: number, rpmMin: number, rpmMax: number): number {
  if (rpm <= rpmPico) {
    const t = Math.min(1, (rpm - rpmMin) / (rpmPico - rpmMin));
    return pico * (1 - Math.pow(1 - t, 2.15));
  }
  return pico * (1 - 0.12 * Math.pow((rpm - rpmPico) / (rpmMax - rpmPico), 1.55));
}

type Escalas = { x: (rpm: number) => number; y: (cv: number) => number };

function escalas(m: Motor): Escalas {
  const [min, max] = m.rpm;
  return {
    x: (rpm) => PAD.left + ((rpm - min) / (max - min)) * (W - PAD.left - PAD.right),
    y: (cv) => H - PAD.bottom - (cv / m.techo) * (H - PAD.top - PAD.bottom),
  };
}

/** Catmull-Rom a Bézier: curva suave que pasa justo por cada punto. */
function trazo(m: Motor, pico: number, rpmPico: number, e: Escalas): string {
  const [min, max] = m.rpm;
  const paso = (max - min) / 28;
  const p: [number, number][] = [];
  for (let rpm = min; rpm <= max + 1; rpm += paso) {
    const r = Math.min(rpm, max);
    p.push([e.x(r), e.y(cvEn(r, pico, rpmPico, min, max))]);
  }
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    d +=
      ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)},` +
      ` ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)},` +
      ` ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const num = (n: number, dec = 0) =>
  n.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });

/* ========================================================================== */

export function Grafico() {
  const [motor, setMotor] = useState(MOTORES[0]);
  const [ref, visible] = useInViewOnce<HTMLDivElement>({ threshold: 0.25 });

  return (
    <Section tone="surface" textura="grid" labelledBy="grafico-t">
      <div className="shell">
        <Reveal>
          <Eyebrow>Resultado</Eyebrow>
        </Reveal>
        <Titular id="grafico-t" lineas={['Serie vs VDN.']} className={`${H2_CLASS} mt-4`} />

        {/* --- Selector de motor --- */}
        <Reveal delay={80} className="mt-9">
          <div
            role="tablist"
            aria-label="Motor de ejemplo"
            className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0"
          >
            {MOTORES.map((m) => {
              const activo = m.id === motor.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  id={`motor-${m.id}`}
                  aria-selected={activo}
                  aria-controls="motor-panel"
                  onClick={() => setMotor(m)}
                  className={`h-11 shrink-0 rounded-full border px-5 text-[0.875rem] transition-colors duration-300 ${
                    activo
                      ? 'border-transparent bg-ink text-ink-dark'
                      : 'border-hair text-muted hover:text-ink'
                  }`}
                >
                  {m.pestana}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* En escritorio la curva y la tabla van una al lado de la otra: si no,
            el gráfico se estira a todo el ancho y la sección se hace eterna. */}
        <div
          id="motor-panel"
          role="tabpanel"
          aria-labelledby={`motor-${motor.id}`}
          ref={ref}
          className="lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-14"
        >
          <Curva motor={motor} visible={visible} />
          <Tabla motor={motor} />
        </div>

        <Reveal delay={120} className="mt-8 flex flex-col gap-3">
          <p className="max-w-[24ch] text-[clamp(1.25rem,4.5vw,1.75rem)] leading-[1.2] tracking-[-0.02em] text-ink">
            Más par. Más respuesta. Cada vez que pisas.
          </p>
          <p className="text-[0.75rem] text-muted">
            Cifras de ejemplo de motores habituales. Cada coche se mide en el taller.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Curva de potencia con lectura al pasar el dedo o el ratón.
 *
 * El trazado se revela con una máscara que se abre de izquierda a derecha: es
 * clip-path, no stroke-dashoffset, así se mueve solo en el compositor.
 */
function Curva({ motor, visible }: { motor: Motor; visible: boolean }) {
  const [rpm, setRpm] = useState<number | null>(null);
  const caja = useRef<SVGSVGElement>(null);
  const e = escalas(motor);
  const [min, max] = motor.rpm;

  const leer = useCallback(
    (clientX: number) => {
      const el = caja.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const u = (clientX - r.left) / r.width;
      const util = (W - PAD.left - PAD.right) / W;
      const t = Math.max(0, Math.min(1, (u - PAD.left / W) / util));
      /* Se redondea a 500 rpm: leer "a 2500 rpm" dice algo, leer "a 2450" no.
         El clamp es porque redondear puede pasarse del final de la escala. */
      const paso500 = Math.round((min + t * (max - min)) / 500) * 500;
      setRpm(Math.max(min, Math.min(max, paso500)));
    },
    [min, max],
  );

  const cvSerie = rpm === null ? motor.serie.cv : cvEn(rpm, motor.serie.cv, motor.pico[0], min, max);
  const cvVdn = rpm === null ? motor.vdn.cv : cvEn(rpm, motor.vdn.cv, motor.pico[1], min, max);

  const revelado = {
    clipPath: visible ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
    transition: 'clip-path 1500ms cubic-bezier(0.16, 1, 0.3, 1)',
  } as const;

  return (
    <div className="mt-10">
      {/* Lectura en vivo. Ocupa sitio siempre, así nada salta al tocar. */}
      <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[0.8125rem]">
        <span className="text-muted">
          {rpm === null ? 'Potencia máxima' : `A ${num(rpm)} rpm`}
        </span>
        <span className="num text-muted">
          Serie <span className="text-ink">{num(cvSerie)}</span> CV
        </span>
        <span className="num text-muted">
          VDN <span className="text-accent-hi">{num(cvVdn)}</span> CV
        </span>
      </p>

      <svg
        ref={caja}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-auto w-full touch-pan-y"
        role="img"
        aria-label={`Curva de potencia de un ${motor.nombre}: de serie ${motor.serie.cv} CV, con VDN ${motor.vdn.cv} CV.`}
        onPointerMove={(ev) => leer(ev.clientX)}
        onPointerLeave={() => setRpm(null)}
      >
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={H - PAD.bottom}
          y2={H - PAD.bottom}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />

        <g style={revelado}>
          <path d={trazo(motor, motor.serie.cv, motor.pico[0], e)} fill="none" stroke="#4a4a4f" strokeWidth="2" strokeLinecap="round" />
          <path d={trazo(motor, motor.vdn.cv, motor.pico[1], e)} fill="none" stroke="#1F5CFF" strokeWidth="2.5" strokeLinecap="round" />
          {/* Etiquetas al final de cada curva, en lugar de una leyenda. */}
          <text x={W - PAD.right + 12} y={e.y(cvEn(max, motor.vdn.cv, motor.pico[1], min, max)) + 4} fill="#F5F5F2" fontSize="14" fontWeight="500">
            VDN
          </text>
          <text x={W - PAD.right + 12} y={e.y(cvEn(max, motor.serie.cv, motor.pico[0], min, max)) + 4} fill="#8C8C91" fontSize="14">
            Serie
          </text>
        </g>

        {/* Cursor: línea vertical y dos puntos, sólo mientras se señala. */}
        {rpm !== null && visible && (
          <g pointerEvents="none">
            <line x1={e.x(rpm)} x2={e.x(rpm)} y1={PAD.top} y2={H - PAD.bottom} stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            <circle cx={e.x(rpm)} cy={e.y(cvSerie)} r="4" fill="#0e0e10" stroke="#8C8C91" strokeWidth="2" />
            <circle cx={e.x(rpm)} cy={e.y(cvVdn)} r="4.5" fill="#0e0e10" stroke="#1F5CFF" strokeWidth="2.5" />
          </g>
        )}
      </svg>

      <p className="mt-2 text-[0.75rem] text-muted">
        Desliza por la curva para ver la potencia en cada régimen.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

type Fila = { concepto: string; unidad: string; serie: string; vdn: number; dec: number; mas: string };

function filas(m: Motor): Fila[] {
  const dif = (a: number, b: number, dec = 0) =>
    `${b > a ? '+' : '−'}${num(Math.abs(b - a), dec)}`;
  return [
    { concepto: 'Potencia', unidad: 'CV', serie: num(m.serie.cv), vdn: m.vdn.cv, dec: 0, mas: dif(m.serie.cv, m.vdn.cv) },
    { concepto: 'Par motor', unidad: 'Nm', serie: num(m.serie.nm), vdn: m.vdn.nm, dec: 0, mas: dif(m.serie.nm, m.vdn.nm) },
    { concepto: 'Consumo medio', unidad: 'l/100 km', serie: num(m.serie.consumo, 1), vdn: m.vdn.consumo, dec: 1, mas: dif(m.serie.consumo, m.vdn.consumo, 1) },
  ];
}

/**
 * La misma información que la curva, pero en números y legible por un lector
 * de pantalla. Cabe entera en 360 px: la unidad va debajo del concepto y el
 * nombre del motor sale del encabezado, que es lo que ensanchaba la primera
 * columna. Las cifras de VDN suben contando al entrar; el `key` por motor hace
 * que vuelvan a contar cada vez que se cambia de pestaña.
 */
function Tabla({ motor }: { motor: Motor }) {
  return (
    /* `relative` no es decorativo: el <span class="sr-only"> que lleva dentro
       cada Contador va en position:absolute, y sin un ancestro posicionado
       aquí su bloque contenedor sería la sección entera, se escaparía del
       recorte y estiraría la página a lo ancho en móvil. */
    <div className="relative mt-10 overflow-x-auto lg:mt-14">
      <table className="w-full min-w-[19rem] border-collapse text-left">
        <caption className="mb-4 text-left text-[0.8125rem] text-muted">
          {motor.nombre}, de serie y reprogramado por VDN.
        </caption>
        <thead>
          <tr className="border-b border-hair text-[0.6875rem] tracking-[0.12em] text-muted uppercase">
            <th scope="col" className="py-3 font-medium">
              <span className="sr-only">Dato</span>
            </th>
            <th scope="col" className="py-3 pl-3 text-right font-medium">
              Serie
            </th>
            <th scope="col" className="py-3 pl-3 text-right font-medium text-accent-hi">
              VDN
            </th>
            <th scope="col" className="py-3 pl-3 text-right font-medium">
              <span aria-hidden>Dif.</span>
              <span className="sr-only">Diferencia</span>
            </th>
          </tr>
        </thead>
        <tbody key={motor.id}>
          {filas(motor).map((f) => (
            <tr key={f.concepto} className="border-b border-hair">
              <th scope="row" className="py-4 pr-2 text-[0.9375rem] leading-tight font-normal text-ink">
                {f.concepto}
                <span className="block text-[0.6875rem] text-muted">{f.unidad}</span>
              </th>
              <td className="num py-4 pl-3 text-right text-[1rem] text-muted tabular-nums">
                {f.serie}
              </td>
              <td className="num py-4 pl-3 text-right text-[clamp(1.375rem,5.5vw,1.75rem)] leading-none font-medium tracking-[-0.02em] text-ink tabular-nums">
                <Contador to={f.vdn} decimales={f.dec} />
              </td>
              <td className="num py-4 pl-3 text-right text-[0.9375rem] text-accent-hi tabular-nums">
                {f.mas}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
