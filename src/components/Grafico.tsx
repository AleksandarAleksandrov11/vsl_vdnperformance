'use client';

import { useInViewOnce } from '@/lib/hooks';
import { Eyebrow, H2_CLASS, Reveal, Section, Titular } from './kit';

/* ==========================================================================
   Curvas de ejemplo de un 2.0 TDI en Stage 1. Se calculan aquí, en tiempo de
   compilación: el navegador no hace una sola cuenta.
   ========================================================================== */

const RPM_MIN = 1000;
const RPM_MAX = 5200;
const CV_MAX = 215;
const W = 720;
const H = 340;
const PAD = { top: 24, right: 66, bottom: 34, left: 4 };

const SERIE_CV = 150;
const VDN_CV = 196;

function curva(pico: number, rpmPico: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let rpm = RPM_MIN; rpm <= RPM_MAX; rpm += 150) {
    const t = (rpm - RPM_MIN) / (rpmPico - RPM_MIN);
    const cv =
      rpm <= rpmPico
        ? pico * (1 - Math.pow(1 - Math.min(t, 1), 2.15))
        : pico * (1 - 0.12 * Math.pow((rpm - rpmPico) / (RPM_MAX - rpmPico), 1.55));
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
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}, ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const ptsSerie = curva(SERIE_CV, 4050);
const ptsVdn = curva(VDN_CV, 3850);
const dSerie = suavizar(ptsSerie);
const dVdn = suavizar(ptsVdn);

/* ========================================================================== */

export function Grafico() {
  const [ref, visible] = useInViewOnce<HTMLDivElement>({ threshold: 0.3 });

  /* El trazado se revela con una máscara que se abre de izquierda a derecha.
     Es clip-path, no stroke-dashoffset: sirve para las dos curvas y las dos
     etiquetas a la vez, y no repinta el trazo en cada fotograma. */
  const revelado = {
    clipPath: visible ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
    transition: 'clip-path 1600ms cubic-bezier(0.16, 1, 0.3, 1)',
  } as const;

  return (
    <Section labelledBy="grafico-t">
      <div className="shell">
        <Reveal>
          <Eyebrow>Resultado</Eyebrow>
        </Reveal>
        <Titular id="grafico-t" lineas={['Serie vs. VDN.']} className={`${H2_CLASS} mt-4`} />

        <div ref={ref} className="mt-12 lg:mt-16">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={`Curva de potencia: de serie ${SERIE_CV} CV, con VDN ${VDN_CV} CV. Ejemplo ilustrativo de un Stage 1.`}
          >
            {/* Eje mínimo: una sola línea de base. */}
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={H - PAD.bottom}
              y2={H - PAD.bottom}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />

            <g style={revelado}>
              <path
                d={dSerie}
                fill="none"
                stroke="#4a4a4f"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d={dVdn}
                fill="none"
                stroke="#1F5CFF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Etiquetas al final de cada curva, en lugar de una leyenda. */}
              <text
                x={W - PAD.right + 12}
                y={y(ptsVdn[ptsVdn.length - 1][1]) + 4}
                fill="#F5F5F2"
                fontSize="14"
                fontWeight="500"
              >
                VDN
              </text>
              <text
                x={W - PAD.right + 12}
                y={y(ptsSerie[ptsSerie.length - 1][1]) + 4}
                fill="#8C8C91"
                fontSize="14"
              >
                Serie
              </text>
            </g>
          </svg>
        </div>

        <Reveal delay={120} className="mt-10 flex flex-col gap-3">
          <p className="max-w-[24ch] text-[clamp(1.25rem,4.5vw,1.75rem)] leading-[1.2] tracking-[-0.02em] text-ink">
            Más par. Más respuesta. Cada vez que pisas.
          </p>
          <p className="text-[0.75rem] text-muted">
            Ejemplo ilustrativo de un Stage 1. Cada motor es distinto.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
