'use client';

import { useInViewOnce } from '@/lib/hooks';
import { Contador, CtaFormulario, Eyebrow, H2, Reveal, Section } from './ui';

/* ==========================================================================
   Datos del gráfico
   Números de ejemplo de un 2.0 TDI en Stage 1. Están calculados aquí, en
   tiempo de compilación, así que el navegador no hace ni una cuenta.
   ========================================================================== */

const RPM_MIN = 1000;
const RPM_MAX = 5200;
const CV_MAX = 215;

const W = 460;
const H = 270;
const PAD = { top: 14, right: 12, bottom: 26, left: 34 };

const SERIE = { cv: 150, nm: 320 };
const REPRO = { cv: 196, nm: 412 };

/** Curva de potencia con forma realista: sube, hace pico y cae al final. */
function curvaCv(pico: number, rpmPico: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let rpm = RPM_MIN; rpm <= RPM_MAX; rpm += 150) {
    const t = (rpm - RPM_MIN) / (rpmPico - RPM_MIN);
    const cv =
      rpm <= rpmPico
        ? pico * (1 - Math.pow(1 - Math.min(t, 1), 2.15))
        : pico * (1 - 0.115 * Math.pow((rpm - rpmPico) / (RPM_MAX - rpmPico), 1.55));
    pts.push([rpm, Math.max(0, cv)]);
  }
  return pts;
}

const x = (rpm: number) =>
  PAD.left + ((rpm - RPM_MIN) / (RPM_MAX - RPM_MIN)) * (W - PAD.left - PAD.right);
const y = (cv: number) => H - PAD.bottom - (cv / CV_MAX) * (H - PAD.top - PAD.bottom);

/** Catmull-Rom a Bézier: curva suave que pasa justo por cada punto. */
function suavizar(pts: [number, number][]): string {
  const p = pts.map(([rpm, cv]) => [x(rpm), y(cv)] as [number, number]);
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const ptsSerie = curvaCv(SERIE.cv, 4050);
const ptsRepro = curvaCv(REPRO.cv, 3850);
const dSerie = suavizar(ptsSerie);
const dRepro = suavizar(ptsRepro);

/**
 * Zona pintada entre las dos curvas: es la ganancia, de un vistazo.
 * Se recorre la curva reprogramada de ida, se baja en vertical hasta la de
 * serie y se vuelve por ella. El `slice` quita el "moveto" del camino de
 * vuelta para poder encadenarlo al de ida sin levantar el lápiz.
 */
const serieAlReves = suavizar([...ptsSerie].reverse());
const finSerie = ptsSerie[ptsSerie.length - 1][1];
const dGanancia = [
  dRepro,
  `L ${x(RPM_MAX).toFixed(1)} ${y(finSerie).toFixed(1)}`,
  serieAlReves.slice(serieAlReves.indexOf(' C') + 1),
  'Z',
].join(' ');

const REJILLA_CV = [50, 100, 150, 200];
const REJILLA_RPM = [2000, 3000, 4000, 5000];
/* El último valor se queda sin etiqueta: comparte sitio con el rótulo "rpm"
   del extremo derecho y en escritorio se montaban uno encima del otro. */
const RPM_ETIQUETADOS = [2000, 3000, 4000];

/* ========================================================================== */

export function CurvaPotencia() {
  const [ref, visible] = useInViewOnce<HTMLDivElement>({ threshold: 0.3 });

  /* El dibujado es una máscara que se estira de izquierda a derecha con
     `transform: scaleX`. Se prefiere a animar stroke-dashoffset porque un
     transform lo resuelve el compositor y además revela de golpe las curvas,
     la zona de ganancia y los puntos de pico. */
  const revelar = {
    transform: visible ? 'scaleX(1)' : 'scaleX(0)',
    transformOrigin: 'left center',
    transition: 'transform 1700ms cubic-bezier(0.22, 1, 0.28, 1)',
  } as const;

  return (
    <Section alt labelledBy="curva-t">
      <div className="shell gutter">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* --- Texto --- */}
          <Reveal className="order-2 lg:order-1">
            <Eyebrow>Lo que se nota al volante</Eyebrow>
            <H2 id="curva-t">
              Más par desde abajo.
              <br />
              Más respuesta al pisar.
            </H2>
            <p className="mt-4 text-[1.0625rem] text-mist sm:text-lg">
              Menos esfuerzo del motor para el mismo trabajo. El coche va más suelto en ciudad, y
              en carretera adelantas sin tener que reducir dos marchas.
            </p>

            {/* --- Cifras --- */}
            <dl className="mt-7 grid grid-cols-2 gap-3 sm:max-w-md sm:gap-4">
              {[
                { t: 'Potencia', de: SERIE.cv, a: REPRO.cv, u: 'CV' },
                { t: 'Par motor', de: SERIE.nm, a: REPRO.nm, u: 'Nm' },
              ].map((c) => (
                <div key={c.t} className="rounded-xl border border-[#25262e] bg-[#16161c] p-3.5 sm:p-4">
                  <dt className="font-display text-[0.6875rem] font-semibold tracking-[0.18em] text-smoke uppercase">
                    {c.t}
                  </dt>
                  <dd className="mt-1.5">
                    <span className="font-display num text-[1.75rem] leading-none font-bold text-chalk sm:text-[2.125rem]">
                      <Contador to={c.a} />
                    </span>
                    <span className="ml-1 text-sm text-smoke">{c.u}</span>
                    <span className="mt-1 block text-[0.8125rem] text-blue-300">
                      de serie {c.de} · +{c.a - c.de} {c.u}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>

            <CtaFormulario className="mt-7 w-full sm:w-auto">
              Descubre cuánto gana el tuyo
            </CtaFormulario>
          </Reveal>

          {/* --- Gráfico --- */}
          <div ref={ref} className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-2xl border border-[#25262e] bg-[#0d0d11] p-3 sm:p-5">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 h-48 w-2/3 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl"
              />

              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <p className="font-display text-[0.6875rem] font-semibold tracking-[0.2em] text-smoke uppercase">
                  Potencia · CV
                </p>
                <ul className="flex items-center gap-3 text-[0.6875rem] text-smoke sm:text-xs">
                  <li className="flex items-center gap-1.5">
                    <span aria-hidden className="h-0.5 w-4 rounded bg-[#5a5d68]" /> Serie
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span aria-hidden className="h-0.5 w-4 rounded bg-blue-400" /> Reprogramado
                  </li>
                </ul>
              </div>

              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="h-auto w-full"
                role="img"
                aria-label={`Gráfico de potencia: de serie ${SERIE.cv} CV, reprogramado ${REPRO.cv} CV. Ejemplo ilustrativo de un Stage 1.`}
              >
                <defs>
                  <linearGradient id="curva-azul" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0047CC" />
                    <stop offset="55%" stopColor="#2E7BFF" />
                    <stop offset="100%" stopColor="#5AA0FF" />
                  </linearGradient>
                  <linearGradient id="curva-relleno" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E7BFF" stopOpacity="0.34" />
                    <stop offset="100%" stopColor="#2E7BFF" stopOpacity="0.02" />
                  </linearGradient>
                  <clipPath id="curva-reveal">
                    <rect x="0" y="0" width={W} height={H} style={revelar} />
                  </clipPath>
                </defs>

                {/* Rejilla */}
                <g stroke="#23242c" strokeWidth="1">
                  {REJILLA_CV.map((cv) => (
                    <line key={cv} x1={PAD.left} x2={W - PAD.right} y1={y(cv)} y2={y(cv)} />
                  ))}
                  {REJILLA_RPM.map((rpm) => (
                    <line key={rpm} y1={PAD.top} y2={H - PAD.bottom} x1={x(rpm)} x2={x(rpm)} />
                  ))}
                </g>

                {/* Ejes */}
                <g fill="#83868f" fontSize="10" fontFamily="var(--font-sans)">
                  {REJILLA_CV.map((cv) => (
                    <text key={cv} x={PAD.left - 7} y={y(cv) + 3.5} textAnchor="end">
                      {cv}
                    </text>
                  ))}
                  {RPM_ETIQUETADOS.map((rpm) => (
                    <text key={rpm} x={x(rpm)} y={H - 9} textAnchor="middle">
                      {rpm / 1000}k
                    </text>
                  ))}
                  <text x={W - PAD.right} y={H - 9} textAnchor="end" fill="#72757f">
                    rpm
                  </text>
                </g>

                {/* Curvas, reveladas por la máscara */}
                <g clipPath="url(#curva-reveal)">
                  <path d={dGanancia} fill="url(#curva-relleno)" />
                  <path
                    d={dSerie}
                    fill="none"
                    stroke="#5a5d68"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeDasharray="5 5"
                  />
                  <path
                    d={dRepro}
                    fill="none"
                    stroke="url(#curva-azul)"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                {/* Puntos de pico: aparecen cuando la máscara ya ha pasado por ellos */}
                <g
                  style={{
                    opacity: visible ? 1 : 0,
                    transition: 'opacity 500ms ease 1250ms',
                  }}
                >
                  <circle cx={x(3850)} cy={y(REPRO.cv)} r="4.5" fill="#2E7BFF" />
                  <circle cx={x(3850)} cy={y(REPRO.cv)} r="9" fill="#2E7BFF" opacity="0.22" />
                  <circle cx={x(4050)} cy={y(SERIE.cv)} r="3.5" fill="#5a5d68" />
                </g>
              </svg>

              <p className="mt-2 px-1 text-[0.6875rem] leading-snug text-[#83868f] sm:text-xs">
                Ejemplo ilustrativo de un Stage 1. Cada motor es distinto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
