'use client';

/**
 * Barra de progreso con forma de cuentarrevoluciones.
 *
 * Es un arco con cinco marcas, una por pregunta, que se va llenando de azul.
 * El relleno se hace con stroke-dashoffset porque hay que recorrer una curva:
 * es lo único de toda la landing que no se anima con transform, y se permite
 * porque son cinco transiciones sueltas de un solo trazo, no una animación
 * continua. La aguja sí se mueve con `transform: rotate`.
 */

const W = 300;
const H = 74;
const CX = W / 2;
const CY = 64;
const R = 52;

/** Punto del arco para t de 0 (izquierda) a 1 (derecha). */
function punto(t: number, radio = R) {
  const ang = Math.PI * (1 - t);
  return [CX + Math.cos(ang) * radio, CY - Math.sin(ang) * radio] as const;
}

const [X0, Y0] = punto(0);
const [X1, Y1] = punto(1);
const ARCO = `M ${X0.toFixed(1)} ${Y0.toFixed(1)} A ${R} ${R} 0 0 1 ${X1.toFixed(1)} ${Y1.toFixed(1)}`;
const LARGO = Math.PI * R;

export function Progreso({ paso, total }: { paso: number; total: number }) {
  // paso es 0-indexado: en la primera pregunta el arco ya no está del todo vacío.
  const p = Math.min(1, paso / total);

  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[38px] w-[148px] shrink-0 sm:h-[56px] sm:w-[220px]"
        aria-hidden
      >
        <defs>
          <linearGradient id="rev-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0047CC" />
            <stop offset="100%" stopColor="#5AA0FF" />
          </linearGradient>
        </defs>

        {/* Marcas: una por pregunta */}
        {Array.from({ length: total + 1 }, (_, i) => {
          const t = i / total;
          const [ax, ay] = punto(t, R - 9);
          const [bx, by] = punto(t, R + 1);
          const pasada = t <= p + 0.001;
          return (
            <line
              key={i}
              x1={ax}
              y1={ay}
              x2={bx}
              y2={by}
              stroke={pasada ? '#5AA0FF' : '#31323b'}
              strokeWidth={i === total ? 2.8 : 2}
              strokeLinecap="round"
              style={{ transition: 'stroke 420ms ease' }}
            />
          );
        })}

        <path d={ARCO} fill="none" stroke="#23242c" strokeWidth="5" strokeLinecap="round" />
        <path
          d={ARCO}
          fill="none"
          stroke="url(#rev-fill)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={LARGO}
          strokeDashoffset={LARGO * (1 - p)}
          style={{ transition: 'stroke-dashoffset 620ms cubic-bezier(0.22,1,0.28,1)' }}
        />

        {/* Aguja */}
        <g
          style={{
            transform: `rotate(${-90 + p * 180}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: 'transform 620ms cubic-bezier(0.22,1,0.28,1)',
          }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - R + 12}
            stroke="#5AA0FF"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </g>
        <circle cx={CX} cy={CY} r="5" fill="#0A0A0C" stroke="#3a3c45" strokeWidth="1.5" />
      </svg>

      <p className="font-display num text-[0.8125rem] font-semibold tracking-[0.1em] whitespace-nowrap text-smoke uppercase sm:text-sm sm:tracking-[0.14em]">
        <span className="text-blue-300">{Math.min(paso + 1, total)}</span> de {total}
      </p>
    </div>
  );
}
