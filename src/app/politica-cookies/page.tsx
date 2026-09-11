import type { Metadata } from 'next';
import { SITE } from '@/lib/config';
import { Apartado, PaginaLegal } from '@/components/PaginaLegal';
import { BotonConfigurarCookies } from '@/components/BotonConfigurarCookies';

export const metadata: Metadata = {
  title: 'Política de cookies · VDN Performance',
  description: 'Qué cookies usa vsl.vdnperformance.es y cómo aceptarlas, rechazarlas o cambiarlas.',
  robots: { index: false, follow: false },
};

/*
 * TODO (legal): texto de partida redactado con los datos que facilitó el
 * titular. Si algún día se añade otra herramienta de terceros (Google
 * Analytics, TikTok Pixel, un chat...), hay que añadirla a la tabla.
 */
export default function PoliticaCookies() {
  return (
    <PaginaLegal titulo="Política de cookies">
      <Apartado titulo="1. Qué son las cookies">
        <p>
          Una cookie es un pequeño archivo que una web guarda en tu navegador cuando la visitas.
          Sirve para recordar información entre páginas o entre visitas. Junto a las cookies se
          usan otras tecnologías parecidas, como el almacenamiento local del navegador
          (localStorage), que funcionan de forma similar y están sujetas a las mismas reglas.
        </p>
        <p>
          Esta web usa el almacenamiento local para recordar tu decisión sobre las cookies y los
          datos de la campaña por la que llegaste.
        </p>
      </Apartado>

      <Apartado titulo="2. Cookies que usamos">
        <p>
          <strong>Cookies técnicas o necesarias.</strong> Son imprescindibles para que la web
          funcione y no requieren tu consentimiento (art. 22.2 LSSI-CE).
        </p>
        <Tabla
          filas={[
            ['vdn.consent.v1', 'Propia (localStorage)', 'Guarda tu decisión sobre las cookies para no volver a preguntarte.', 'Hasta que la borres o cambies tu decisión'],
            ['vdn.utm.v1', 'Propia (sessionStorage)', 'Recuerda de qué anuncio vienes mientras dura la visita, para poder atender mejor tu solicitud.', 'Se borra al cerrar la pestaña'],
          ]}
        />

        <p className="mt-6">
          <strong>Cookies de terceros: marketing.</strong> Vienen desactivadas y sólo se instalan
          si las aceptas. Si no las aceptas, el píxel de Meta no se carga en ningún momento.
        </p>
        <Tabla
          filas={[
            ['_fbp', 'Meta Platforms Ireland Ltd.', 'Identifica el navegador para medir si una visita procedente de un anuncio de Instagram o Facebook acaba pidiendo presupuesto.', 'Hasta 90 días'],
            ['_fbc', 'Meta Platforms Ireland Ltd.', 'Guarda el identificador del clic en el anuncio para atribuir la conversión a la campaña correcta.', 'Hasta 90 días'],
          ]}
        />
        <p>
          Los datos recogidos por el píxel de Meta se tratan conforme a la{' '}
          <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">
            política de privacidad de Meta
          </a>
          .
        </p>
      </Apartado>

      <Apartado titulo="3. Para qué las usamos">
        <ul>
          <li>
            <strong>Que la web funcione</strong> y recuerde lo que has decidido sobre las cookies.
          </li>
          <li>
            <strong>Saber si nuestros anuncios funcionan:</strong> cuántas de las personas que
            llegan desde Instagram o Facebook acaban pidiendo un presupuesto. No usamos cookies
            para perfilar tus intereses ni para seguirte por otras webs con fines comerciales
            distintos.
          </li>
        </ul>
      </Apartado>

      <Apartado titulo="4. Cómo aceptarlas, rechazarlas o cambiar de opinión">
        <p>
          La primera vez que entras aparece un aviso abajo con tres opciones: <strong>Aceptar</strong>,{' '}
          <strong>Rechazar</strong> y <strong>Configurar</strong>. Aceptar y rechazar cuestan
          exactamente lo mismo: un clic. Mientras no elijas, no se carga ninguna cookie de
          terceros.
        </p>
        <p>
          Puedes cambiar tu decisión cuando quieras desde el botón «Configurar cookies» del pie de
          página, o desde aquí mismo:
        </p>
        <BotonConfigurarCookies />
        <p>
          También puedes borrar o bloquear las cookies desde tu navegador. Ten en cuenta que es una
          configuración general y puede afectar a otras webs:
        </p>
        <ul>
          <li>
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
              Google Chrome
            </a>
          </li>
          <li>
            <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
              Safari
            </a>
          </li>
          <li>
            <a href="https://support.mozilla.org/es/kb/Borrar%20cookies" target="_blank" rel="noopener noreferrer">
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a href="https://support.microsoft.com/es-es/microsoft-edge" target="_blank" rel="noopener noreferrer">
              Microsoft Edge
            </a>
          </li>
        </ul>
      </Apartado>

      <Apartado titulo="5. Más información">
        <p>
          Para saber cómo tratamos tus datos personales, consulta la{' '}
          <a href="/politica-privacidad">Política de privacidad</a>. Si tienes cualquier duda,
          escríbenos a <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
        <p>
          Esta política puede actualizarse si cambian las herramientas que usamos. La versión
          vigente es siempre la publicada en esta página.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}

function Tabla({ filas }: { filas: [string, string, string, string][] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <thead>
          <tr>
            {['Nombre', 'Titular', 'Para qué sirve', 'Duración'].map((h) => (
              <th
                key={h}
                scope="col"
                className="border-b border-hair pb-3 text-[0.75rem] font-medium tracking-[0.1em] text-muted uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f[0]}>
              {f.map((celda, i) => (
                <td
                  key={celda}
                  className={`border-b border-hair py-4 pr-4 align-top text-[0.8125rem] ${
                    i === 0 ? 'font-mono text-ink' : 'text-muted'
                  }`}
                >
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
