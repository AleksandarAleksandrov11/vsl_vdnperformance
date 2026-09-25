import type { Metadata } from 'next';
import { SITE } from '@/lib/config';
import { Apartado, Ficha, PaginaLegal } from '@/components/PaginaLegal';

export const metadata: Metadata = {
  title: 'Aviso legal · VDN Performance',
  description: 'Información legal del titular de www.vdnperformance.com según la LSSI-CE.',
  robots: { index: false, follow: false },
};

/*
 * TODO (legal): texto de partida redactado con los datos que facilitó el
 * titular. Antes de publicar, conviene que Diego Sánchez Rabasco o su asesoría
 * lo revisen y confirmen que refleja la realidad del negocio.
 */
export default function AvisoLegal() {
  return (
    <PaginaLegal titulo="Aviso legal">
      <Apartado titulo="1. Datos identificativos del titular">
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la
          Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se ponen a disposición
          de los usuarios los datos del titular de este sitio web:
        </p>
        <Ficha
          filas={[
            ['Titular', SITE.legalName],
            ['Nombre comercial', SITE.name],
            ['NIF', SITE.nif],
            [
              'Domicilio fiscal',
              `${SITE.fiscal.calle}, ${SITE.fiscal.cp} ${SITE.fiscal.ciudad} (${SITE.fiscal.provincia})`,
            ],
            [
              'Domicilio del taller',
              `${SITE.taller.calle}, ${SITE.taller.cp} ${SITE.taller.ciudad} (${SITE.taller.provincia})`,
            ],
            ['Correo electrónico', <a key="e" href={`mailto:${SITE.email}`}>{SITE.email}</a>],
            ['Teléfono', <a key="t" href={`tel:+${SITE.phoneRaw}`}>{SITE.phoneDisplay}</a>],
            ['Sitio web', <a key="w" href={SITE.url}>{SITE.url}</a>],
            ['Actividad', 'Reprogramación de centralitas y preparación de vehículos'],
          ]}
        />
      </Apartado>

      <Apartado titulo="2. Objeto y ámbito de aplicación">
        <p>
          Este aviso legal regula el acceso y uso del sitio web{' '}
          <a href={SITE.url}>{SITE.url}</a> (en adelante, «el sitio web»), una página informativa
          y de captación de solicitudes de presupuesto para los servicios del taller.
        </p>
        <p>
          El acceso al sitio web atribuye la condición de usuario e implica la aceptación plena de
          todas las condiciones incluidas en este aviso legal. Si no estás de acuerdo con alguna de
          ellas, te pedimos que no utilices el sitio web.
        </p>
      </Apartado>

      <Apartado titulo="3. Condiciones de uso">
        <p>El usuario se compromete a:</p>
        <ul>
          <li>Utilizar el sitio web de forma lícita y conforme a la buena fe.</li>
          <li>
            Facilitar información veraz en el formulario de solicitud de presupuesto, y no
            suplantar la identidad de otra persona ni usar datos de contacto de terceros sin su
            permiso.
          </li>
          <li>
            No realizar actuaciones que puedan dañar, inutilizar o sobrecargar el sitio web, ni
            impedir su normal uso por otros usuarios.
          </li>
        </ul>
        <p>
          La información sobre ganancias de potencia, plazos y precios que aparece en el sitio web
          es orientativa. El presupuesto en firme se comunica de forma individual para cada
          vehículo, tras conocer sus datos concretos.
        </p>
      </Apartado>

      <Apartado titulo="4. Propiedad intelectual e industrial">
        <p>
          Todos los contenidos del sitio web —textos, fotografías, gráficos, logotipos, iconos,
          diseño y código fuente— son titularidad de {SITE.legalName} o se utilizan con
          autorización de sus legítimos titulares, y están protegidos por la normativa de
          propiedad intelectual e industrial.
        </p>
        <p>
          Queda prohibida su reproducción, distribución, comunicación pública o transformación sin
          autorización expresa y por escrito del titular. Las marcas de fabricantes de vehículos
          que se citan en el sitio web pertenecen a sus respectivos propietarios y se mencionan
          únicamente a título identificativo, para indicar los vehículos sobre los que se presta
          el servicio. Su mención no implica relación, patrocinio ni asociación alguna con ellos.
        </p>
      </Apartado>

      <Apartado titulo="5. Responsabilidad">
        <p>
          El titular procura que la información del sitio web sea correcta y esté actualizada, pero
          no garantiza la ausencia de errores ni que el contenido esté permanentemente al día.
        </p>
        <p>
          El titular no se hace responsable de los daños derivados de un uso indebido del sitio
          web, ni de interrupciones del servicio por causas ajenas a su control, como fallos de la
          red, del proveedor de alojamiento o de fuerza mayor.
        </p>
        <p>
          El sitio web puede contener enlaces a páginas de terceros (Google, WhatsApp, Instagram,
          TikTok). El titular no controla esos sitios ni responde de sus contenidos ni de sus
          políticas de privacidad.
        </p>
      </Apartado>

      <Apartado titulo="6. Protección de datos y cookies">
        <p>
          El tratamiento de los datos personales que se recogen a través del sitio web se explica
          en la <a href="/politica-privacidad">Política de privacidad</a>. El uso de cookies y
          tecnologías similares se detalla en la{' '}
          <a href="/politica-cookies">Política de cookies</a>.
        </p>
      </Apartado>

      <Apartado titulo="7. Modificaciones">
        <p>
          El titular se reserva el derecho a modificar en cualquier momento la presentación, la
          configuración y los contenidos del sitio web, así como estas condiciones de uso.
        </p>
      </Apartado>

      <Apartado titulo="8. Legislación aplicable y jurisdicción">
        <p>
          Este aviso legal se rige por la legislación española. Para cualquier controversia
          derivada del acceso o uso del sitio web, las partes se someten a los juzgados y
          tribunales que resulten competentes conforme a la normativa vigente. Cuando el usuario
          tenga la condición de consumidor, serán competentes los tribunales de su lugar de
          residencia, conforme a la normativa de protección de consumidores y usuarios.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
