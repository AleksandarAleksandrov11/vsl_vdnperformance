import type { Metadata, Viewport } from 'next';
import { Inter, Chakra_Petch } from 'next/font/google';
import { SITE } from '@/lib/config';
import { CONSENT_KEY } from '@/lib/consent';
import { ConsentProvider } from '@/components/ConsentProvider';
import './globals.css';

/**
 * Chakra Petch para titulares: cuadrada, técnica y con los cortes en ángulo de
 * las letras del logo. Es la de las tres candidatas (Rajdhani, Chakra Petch,
 * Oxanium) que mejor casa con la V y la D anguladas de "VDN".
 * Inter para el cuerpo.
 */
/* Sólo dos pesos: 600 para antetítulos y cifras, 700 para titulares. Cada peso
   es un archivo más que descargar, y el resto de grosores que pide el CSS caen
   en el más cercano de estos dos sin que se note. */
const chakra = Chakra_Petch({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-chakra',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const TITLE = 'Reprogramación Stage 1 desde 219 € · VDN Performance Collado Villalba';
const DESCRIPTION =
  'Más potencia, más par y menos consumo. Stage 1 desde 219 € con 15 días de garantía. Presupuesto gratis en menos de 24h en Collado Villalba.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: SITE.name,
  manifest: '/site.webmanifest',
  alternates: { canonical: SITE.url },
  /* La landing vive sólo para los anuncios: no debe competir en Google con
     vdnperformance.es, así que ninguna página se indexa. */
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: SITE.url,
    siteName: SITE.name,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: true },
  other: {
    'msapplication-TileColor': '#0A0A0C',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0C',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  /* Sin maximumScale ni userScalable: bloquear el zoom rompe la accesibilidad. */
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${chakra.variable}`}>
      <head>
        {/* Precalentamos el dominio del píxel sólo como DNS: no descarga nada
            ni deja cookies, y si el usuario acepta, el script llega antes. */}
        <link rel="dns-prefetch" href="https://connect.facebook.net" />

        {/* El aviso de cookies aparece un momento después de cargar. Si su alto
            se aplicara entonces, todo lo que se apoya en él daría un salto y
            eso penaliza el CLS. Aquí se reserva el hueco antes del primer
            pintado, mirando si ya hay una decisión guardada. Va en línea y sin
            async a propósito: son dos líneas y tienen que ejecutarse antes de
            que se pinte nada. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var y=localStorage.getItem('${CONSENT_KEY}');d.style.setProperty('--consent-h',y?'0px':(innerWidth<640?'138px':'72px'));}catch(e){document.documentElement.style.setProperty('--consent-h','138px')}})()`,
          }}
        />
      </head>
      <body>
        <ConsentProvider>{children}</ConsentProvider>
      </body>
    </html>
  );
}
