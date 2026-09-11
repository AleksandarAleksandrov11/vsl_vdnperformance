import { SITE } from '@/lib/config';
import { RESENAS } from '@/lib/content';

/**
 * Datos estructurados del taller (schema.org/AutoRepair).
 *
 * La página lleva noindex, así que esto no busca posicionar: sirve para que
 * cualquier servicio que lea la web (el propio Google al rastrear el anuncio,
 * un agregador, una vista previa) entienda que detrás hay un taller real con
 * dirección, teléfono y horario.
 */
export function JsonLd() {
  const datos = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': `${SITE.url}/#taller`,
    name: SITE.name,
    legalName: SITE.legalName,
    description:
      'Reprogramación de centralitas (chiptuning) en Collado Villalba. Stage 1, 2 y 3 con 15 días de garantía.',
    url: SITE.url,
    telephone: SITE.phoneIntl,
    email: SITE.email,
    image: `${SITE.url}/icon-512.png`,
    priceRange: '€€',
    currenciesAccepted: 'EUR',
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.taller.calle,
      postalCode: SITE.taller.cp,
      addressLocality: SITE.taller.ciudad,
      addressRegion: SITE.taller.provincia,
      addressCountry: SITE.taller.pais,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.taller.lat,
      longitude: SITE.taller.lng,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '08:00',
        closes: '23:00',
      },
    ],
    sameAs: [SITE.webPrincipal, SITE.instagram, SITE.tiktok],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      bestRating: '5',
      ratingCount: RESENAS.length,
    },
    makesOffer: [
      {
        '@type': 'Offer',
        name: 'Reprogramación Stage 1',
        priceCurrency: 'EUR',
        price: SITE.precioStage1,
        priceSpecification: {
          '@type': 'PriceSpecification',
          minPrice: SITE.precioStage1,
          priceCurrency: 'EUR',
        },
      },
      { '@type': 'Offer', name: 'Reprogramación Stage 2' },
      { '@type': 'Offer', name: 'Reprogramación Stage 3' },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Sin datos de usuario: es un objeto fijo definido aquí mismo.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos) }}
    />
  );
}
