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

/** Coupé de perfil, morro a la derecha. Silueta, no ilustración: en 0,8 s a
    toda velocidad lo que se lee es el contorno, las llantas y la luz de canto. */
function Coupe() {
  return (
    <svg viewBox="0 0 1240 420" className="h-auto w-full" focusable="false">
      <defs>
        <linearGradient id="vdn-luz" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1f5cff" stopOpacity=".1" />
          <stop offset=".26" stopColor="#4b7dff" stopOpacity=".8" />
          <stop offset=".6" stopColor="#eaf1ff" />
          <stop offset=".88" stopColor="#4b7dff" stopOpacity=".7" />
          <stop offset="1" stopColor="#1f5cff" stopOpacity=".1" />
        </linearGradient>
        <linearGradient id="vdn-chapa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#343b4c" />
          <stop offset=".45" stopColor="#171a22" />
          <stop offset="1" stopColor="#0a0b0f" />
        </linearGradient>
        <radialGradient id="vdn-halo" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#1f5cff" stopOpacity=".28" />
          <stop offset=".6" stopColor="#1f5cff" stopOpacity=".08" />
          <stop offset="1" stopColor="#1f5cff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vdn-haz" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#dceaff" stopOpacity=".55" />
          <stop offset="1" stopColor="#dceaff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="vdn-brillo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8da4d6" stopOpacity="0" />
          <stop offset=".5" stopColor="#a9bce6" stopOpacity=".45" />
          <stop offset="1" stopColor="#8da4d6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Halo bajo el coche: sin él la silueta se funde con el negro del panel. */}
      <ellipse cx="640" cy="300" rx="560" ry="120" fill="url(#vdn-halo)" />

      {/* Haz del faro, hacia delante. */}
      <path fill="url(#vdn-haz)" d="M 1150 214 L 1240 176 L 1240 268 L 1150 240 Z" />

      {/* Carrocería: capó largo, habitáculo atrasado, techo bajo y colín corto. */}
      <path
        fill="url(#vdn-chapa)"
        d="M 1212 292 C 1224 270, 1214 244, 1190 230 C 1160 214, 1108 204, 1046 198 L 892 186 C 862 150, 826 122, 780 106 C 712 84, 620 88, 552 110 C 500 126, 452 152, 414 176 L 226 168 C 198 167, 180 176, 172 194 C 164 212, 164 244, 170 264 L 168 292 L 214 288 A 108 108 0 0 1 398 288 C 408 302, 422 308, 446 308 L 814 308 C 840 308, 854 302, 864 288 A 108 108 0 0 1 1050 288 C 1070 300, 1110 302, 1150 300 Z"
      />

      <path
        fill="url(#vdn-brillo)"
        opacity=".5"
        d="M 300 230 C 520 252, 800 252, 1020 230 L 1020 246 C 800 268, 520 268, 300 246 Z"
      />

      {/* Cristales. El trasero sube hacia delante: es el quiebre Hofmeister. */}
      <g fill="#232936">
        <path d="M 876 186 C 850 154, 820 130, 782 116 L 742 106 L 742 182 Z" />
        <path d="M 718 106 L 718 182 L 520 182 C 548 156, 588 132, 634 118 C 660 110, 690 106, 718 106 Z" />
        <path d="M 498 182 C 524 156, 556 134, 588 118 L 552 126 C 506 146, 466 166, 440 180 L 452 182 Z" />
      </g>

      <path fill="#111319" d="M 880 188 L 934 196 C 943 197, 942 209, 932 209 L 880 204 Z" />

      <path fill="#e8f0ff" d="M 1142 206 C 1168 212, 1190 222, 1202 232 L 1176 242 C 1162 230, 1142 220, 1122 214 Z" />
      <path fill="#ff4040" d="M 172 196 C 184 182, 204 174, 232 170 L 236 190 C 212 193, 192 199, 180 208 Z" />

      <g fill="#08080b">
        <rect x="186" y="280" width="24" height="13" rx="6.5" />
        <rect x="216" y="280" width="24" height="13" rx="6.5" />
        <path d="M 1136 280 C 1170 278, 1196 271, 1212 262 L 1214 282 C 1194 292, 1168 296, 1138 296 Z" />
      </g>

      {/* Ruedas. La pinza azul es lo único de color que se ve en movimiento. */}
      <g>
        <circle cx="306" cy="264" r="92" fill="#121419" stroke="#262a33" strokeWidth="4" />
        <circle cx="306" cy="264" r="62" fill="#0b0c10" />
        <g stroke="#474d5c" strokeWidth="8" strokeLinecap="round">
          <path d="M306 226 L306 202 M333 237 L350 220 M344 264 L368 264 M333 291 L350 308 M306 302 L306 326 M279 291 L262 308 M268 264 L244 264 M279 237 L262 220" />
        </g>
        <circle cx="306" cy="264" r="26" fill="none" stroke="#1f5cff" strokeWidth="6" opacity=".85" />

        <circle cx="958" cy="264" r="92" fill="#121419" stroke="#262a33" strokeWidth="4" />
        <circle cx="958" cy="264" r="62" fill="#0b0c10" />
        <g stroke="#474d5c" strokeWidth="8" strokeLinecap="round">
          <path d="M958 226 L958 202 M985 237 L1002 220 M996 264 L1020 264 M985 291 L1002 308 M958 302 L958 326 M931 291 L914 308 M920 264 L896 264 M931 237 L914 220" />
        </g>
        <circle cx="958" cy="264" r="26" fill="none" stroke="#1f5cff" strokeWidth="6" opacity=".85" />
      </g>

      <path
        fill="none"
        stroke="url(#vdn-luz)"
        strokeWidth="7"
        strokeLinecap="round"
        d="M 174 192 C 180 176, 198 167, 226 168 L 414 176 C 452 152, 500 126, 552 110 C 620 88, 712 84, 780 106 C 826 122, 862 150, 892 186 L 1046 198 C 1108 204, 1160 214, 1190 230"
      />
    </svg>
  );
}
