import type { Metadata } from 'next';
import { SITE } from '@/lib/config';
import { Apartado, Ficha, PaginaLegal } from '@/components/PaginaLegal';

export const metadata: Metadata = {
  title: 'Política de privacidad · VDN Performance',
  description: 'Cómo trata VDN Performance los datos que se recogen en el formulario de presupuesto.',
  robots: { index: false, follow: false },
};

/*
 * TODO (legal): texto de partida redactado con los datos que facilitó el
 * titular. Antes de publicar, conviene que Diego Sánchez Rabasco o su asesoría
 * lo revisen, y en particular confirmen los plazos de conservación y la lista
 * de proveedores (encargados del tratamiento) que se usan en la práctica.
 */
export default function PoliticaPrivacidad() {
  return (
    <PaginaLegal titulo="Política de privacidad">
      <Apartado titulo="1. Responsable del tratamiento">
        <Ficha
          filas={[
            ['Responsable', `${SITE.legalName} (${SITE.name})`],
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
          ]}
        />
        <p>
          Esta política explica qué datos recogemos a través de{' '}
          <a href={SITE.url}>{SITE.url}</a>, para qué los usamos y qué puedes hacer con ellos, de
          acuerdo con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018, de Protección
          de Datos Personales y garantía de los derechos digitales (LOPDGDD).
        </p>
      </Apartado>

      <Apartado titulo="2. Qué datos recogemos">
        <p>
          A través del formulario de solicitud de presupuesto recogemos únicamente lo necesario
          para poder darte un precio y contactarte:
        </p>
        <ul>
          <li>
            <strong>Datos de contacto:</strong> nombre y número de teléfono.
          </li>
          <li>
            <strong>Datos del vehículo:</strong> marca y modelo, año, motorización y potencia de
            serie. Son datos del coche, no tuyos, pero van unidos a tu solicitud.
          </li>
          <li>
            <strong>Datos de origen de la visita:</strong> los parámetros de campaña (UTM) de la
            URL con la que llegaste, y un identificador técnico del envío. Nos dicen qué anuncio
            te trajo, no quién eres.
          </li>
        </ul>
        <p>
          No pedimos DNI, dirección postal, matrícula ni datos bancarios en este formulario, y no
          tratamos categorías especiales de datos. No se dirige a menores de 14 años.
        </p>
      </Apartado>

      <Apartado titulo="3. Para qué usamos tus datos y con qué base legal">
        <ul>
          <li>
            <strong>Preparar y enviarte el presupuesto que has pedido</strong>, y contactarte por
            WhatsApp o por teléfono para cerrar los detalles o una cita. Base legal: la aplicación
            de medidas precontractuales adoptadas a petición del interesado (art. 6.1.b RGPD). Eres
            tú quien nos pide el presupuesto al enviar el formulario.
          </li>
          <li>
            <strong>Medir la eficacia de nuestros anuncios</strong> en Instagram y Facebook, para
            saber qué campañas funcionan. Base legal: tu consentimiento (art. 6.1.a RGPD), que das
            al aceptar las cookies de marketing y que puedes retirar cuando quieras.
          </li>
          <li>
            <strong>Cumplir obligaciones legales</strong> cuando llegues a ser cliente
            (facturación, garantías). Base legal: obligación legal (art. 6.1.c RGPD).
          </li>
        </ul>
        <p>
          No usamos tus datos para enviarte publicidad por WhatsApp, SMS o correo salvo que nos des
          tu consentimiento por separado, y no tomamos decisiones automatizadas que te afecten.
        </p>
      </Apartado>

      <Apartado titulo="4. Cuánto tiempo los conservamos">
        <ul>
          <li>
            <strong>Si no llegas a ser cliente:</strong> conservamos la solicitud durante un máximo
            de <strong>12 meses</strong> desde el último contacto, por si retomas el presupuesto.
            Pasado ese plazo, se elimina.
          </li>
          <li>
            <strong>Si contratas el servicio:</strong> conservamos los datos durante la relación y,
            después, el tiempo que exijan las obligaciones fiscales y mercantiles (con carácter
            general, <strong>6 años</strong>), bloqueados y accesibles sólo para atender posibles
            responsabilidades.
          </li>
          <li>
            <strong>Datos de medición publicitaria:</strong> según los plazos de Meta indicados en
            la <a href="/politica-cookies">Política de cookies</a>.
          </li>
        </ul>
      </Apartado>

      <Apartado titulo="5. A quién se los comunicamos">
        <p>
          No vendemos tus datos ni los cedemos a terceros para sus propios fines. Sí utilizamos
          proveedores que los tratan por cuenta nuestra para poder prestar el servicio:
        </p>
        <ul>
          <li>
            <strong>Google Ireland Limited</strong> — las solicitudes del formulario se guardan en
            una hoja de cálculo de Google. Actúa como encargado del tratamiento.
          </li>
          <li>
            <strong>Meta Platforms Ireland Limited</strong> — medición de la eficacia de los
            anuncios mediante el píxel de Meta, <strong>sólo si aceptas</strong> las cookies de
            marketing. En este tratamiento Meta y el titular actúan como corresponsables respecto
            de la recogida y transmisión de los datos.
          </li>
          <li>
            <strong>Vercel Inc.</strong> — alojamiento del sitio web.
          </li>
          <li>
            <strong>WhatsApp Ireland Limited</strong> — si decides escribirnos por WhatsApp, la
            conversación se desarrolla en esa plataforma y se somete además a sus propias
            condiciones.
          </li>
        </ul>
        <p>
          Algunos de estos proveedores pueden realizar transferencias internacionales de datos a
          Estados Unidos. En ese caso se amparan en la decisión de adecuación del Marco de
          Privacidad de Datos UE-EE. UU. o en cláusulas contractuales tipo aprobadas por la
          Comisión Europea.
        </p>
      </Apartado>

      <Apartado titulo="6. Tus derechos">
        <p>Puedes ejercer en cualquier momento los siguientes derechos:</p>
        <ul>
          <li>
            <strong>Acceso:</strong> saber qué datos tuyos tenemos.
          </li>
          <li>
            <strong>Rectificación:</strong> corregir los que estén mal o incompletos.
          </li>
          <li>
            <strong>Supresión:</strong> pedir que los borremos cuando ya no sean necesarios.
          </li>
          <li>
            <strong>Oposición:</strong> oponerte a un tratamiento concreto.
          </li>
          <li>
            <strong>Limitación:</strong> pedir que los conservemos pero no los usemos.
          </li>
          <li>
            <strong>Portabilidad:</strong> recibirlos en un formato estructurado y de uso común.
          </li>
          <li>
            <strong>Retirar el consentimiento</strong> que hayas dado, sin que ello afecte a la
            licitud del tratamiento anterior.
          </li>
        </ul>
        <p>
          Para ejercerlos, escribe a <a href={`mailto:${SITE.email}`}>{SITE.email}</a> indicando
          qué derecho quieres ejercer. Podemos pedirte que acredites tu identidad. Te
          responderemos en el plazo de un mes.
        </p>
      </Apartado>

      <Apartado titulo="7. Reclamación ante la autoridad de control">
        <p>
          Si consideras que no hemos tratado tus datos correctamente, puedes reclamar ante la{' '}
          <strong>Agencia Española de Protección de Datos</strong> (C/ Jorge Juan 6, 28001 Madrid),
          a través de su sede electrónica en{' '}
          <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
            www.aepd.es
          </a>
          . Antes, si lo prefieres, puedes escribirnos a{' '}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a> e intentamos resolverlo.
        </p>
      </Apartado>

      <Apartado titulo="8. Seguridad y cambios">
        <p>
          Aplicamos medidas técnicas y organizativas razonables para proteger tus datos frente a
          accesos no autorizados, pérdida o alteración.
        </p>
        <p>
          Esta política puede actualizarse si cambian los servicios o la normativa. La versión
          vigente es siempre la publicada en esta página.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
