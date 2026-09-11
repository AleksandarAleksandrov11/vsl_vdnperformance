/**
 * Entrada de la página: un coupé pasa a fondo de izquierda a derecha y detrás
 * de él se descubre la portada.
 *
 * Decisiones que importan:
 * · Es HTML estático y CSS puro, sin una línea de JavaScript. Se pinta con el
 *   primer fotograma, así que no retrasa nada ni espera a la hidratación.
 * · El panel negro es un div con color de fondo, y el coche es un SVG en línea.
 *   Ninguno de los dos entra en la carrera por el LCP, de modo que el titular
 *   de detrás sigue marcando la métrica como si la animación no existiera.
 * · Sólo se mueven `transform`, `opacity` y `clip-path`: todo lo resuelve el
 *   compositor y no hay un solo reflow.
 * · Se enseña una vez por sesión (lo decide el script en línea del layout) y
 *   con `prefers-reduced-motion` no se enseña nunca.
 */
export function Intro() {
  return (
    <div className="intro" aria-hidden="true">
      {/* El negro que se retira hacia la derecha, detrás del coche. */}
      <div className="intro-panel" />
      <div className="intro-filo" />

      <div className="intro-pista">
        {/* Estelas de velocidad. Cada una con su alto, su largo y su retardo:
            si salen todas a la vez parecen una persiana, no velocidad. */}
        <span className="intro-raya" style={{ '--y': '30%', '--w': '46%', '--d': '0ms' } as React.CSSProperties} />
        <span className="intro-raya" style={{ '--y': '42%', '--w': '62%', '--d': '60ms' } as React.CSSProperties} />
        <span className="intro-raya" style={{ '--y': '54%', '--w': '38%', '--d': '20ms' } as React.CSSProperties} />
        <span className="intro-raya" style={{ '--y': '63%', '--w': '70%', '--d': '95ms' } as React.CSSProperties} />
        <span className="intro-raya" style={{ '--y': '72%', '--w': '30%', '--d': '45ms' } as React.CSSProperties} />

        <div className="intro-coche">
          <Coupe />
        </div>
      </div>
    </div>
  );
}

/**
 * BMW E46 coupé de perfil, morro a la derecha. Silueta mínima.
 *
 * A este tamaño y en menos de un segundo sólo se lee el contorno, así que el
 * dibujo se queda en lo que de verdad identifica al coche: las proporciones
 * (voladizos cortos, capó largo, invernadero alto), el quiebre Hofmeister del
 * cristal trasero y dos ruedas. Nada de tiradores, retrovisores ni pliegues:
 * a 70 px de alto no se ven y sólo ensucian.
 */
function Coupe() {
  return (
    <svg viewBox="0 0 1180 360" className="h-auto w-full" focusable="false">
      <defs>
        <linearGradient id="vdn-luz" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4b7dff" stopOpacity=".35" />
          <stop offset=".55" stopColor="#eaf1ff" />
          <stop offset="1" stopColor="#4b7dff" stopOpacity=".35" />
        </linearGradient>
        <radialGradient id="vdn-halo" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#1f5cff" stopOpacity=".3" />
          <stop offset="1" stopColor="#1f5cff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo: sobre negro puro, una silueta oscura se funde con el fondo. */}
      <ellipse cx="600" cy="250" rx="520" ry="120" fill="url(#vdn-halo)" />

      <path
        fill="#171b24"
        d="M 1046 296 C 1058 276, 1058 238, 1046 208 C 1038 190, 1026 180, 1010 176 C 918 168, 812 160, 700 154 C 664 132, 622 94, 578 62 C 552 54, 506 52, 470 54 C 452 55, 436 58, 422 62 C 396 98, 348 142, 312 152 C 268 156, 226 160, 192 166 C 168 174, 154 188, 150 210 C 146 236, 150 274, 160 296 L 262 288 A 74 74 0 0 1 404 288 C 412 296, 416 300, 424 300 L 800 300 C 808 300, 812 296, 820 288 A 74 74 0 0 1 962 288 C 994 296, 1020 298, 1046 296 Z"
      />

      {/* Los dos cristales. El trasero lleva abajo el quiebre Hofmeister. */}
      <g fill="#2b3446">
        <path d="M 694 148 C 664 130, 626 96, 584 66 L 512 62 L 506 144 Z" />
        <path d="M 492 62 L 444 60 C 424 80, 406 106, 398 124 L 424 147 L 498 145 Z" />
      </g>

      <g>
        <circle cx="333" cy="266" r="64" fill="#0d0f14" />
        <circle cx="333" cy="266" r="26" fill="none" stroke="#1f5cff" strokeWidth="7" opacity=".9" />
        <circle cx="891" cy="266" r="64" fill="#0d0f14" />
        <circle cx="891" cy="266" r="26" fill="none" stroke="#1f5cff" strokeWidth="7" opacity=".9" />
      </g>

      {/* Luz de canto por el filo superior: es lo que dibuja la silueta. */}
      <path
        fill="none"
        stroke="url(#vdn-luz)"
        strokeWidth="7"
        strokeLinecap="round"
        d="M 152 202 C 156 186, 170 174, 192 166 C 226 160, 268 156, 312 152 C 348 142, 396 98, 422 62 C 436 58, 452 55, 470 54 C 506 52, 552 54, 578 62 C 622 94, 664 132, 700 154 C 812 160, 918 168, 1010 176"
      />
    </svg>
  );
}
