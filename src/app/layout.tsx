import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { scriptAnuncio } from '@/lib/ad-variants';
import { SITE } from '@/lib/config';
import { CONSENT_KEY } from '@/lib/consent';
import { scriptCapturaVisita } from '@/lib/leads';
import { ConsentProvider } from '@/components/ConsentProvider';
import './globals.css';

/**
 * Una sola familia para toda la página. Inter Tight tiene las formas de Inter
 * pero más estrechas, que es lo que aguanta un titular de 96 px sin partirse en
 * cuatro líneas y sin parecer una plantilla.
 */
const interTight = localFont({
  /* El archivo va en el repo (src/app/fonts): el build no descarga nada y en
     producción hay una petición menos a terceros. Es variable: 400, 500 y 600
     salen del mismo archivo. */
  src: './fonts/inter-tight-latin.woff2',
  weight: '400 600',
  variable: '--font-inter-tight',
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
  alternates: { canonical: `${SITE.url}/` },
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
    url: `${SITE.url}/`,
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
  /* Sin esto, iOS convierte en enlace cualquier número de teléfono en texto. */
  formatDetection: { telephone: false, email: false, address: false },
  other: {
    'msapplication-TileColor': '#050505',
  },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  /* Sin maximumScale ni userScalable: bloquear el zoom rompe la accesibilidad. */
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* suppressHydrationWarning: los scripts del <head> ponen --consent-h,
       data-campaign y data-ad en <html> antes de que React hidrate. */
    <html lang="es" className={interTight.variable} suppressHydrationWarning>
      <head>
        {/* Precalentamos el dominio del píxel sólo como DNS: no descarga nada
            ni deja cookies, y si el usuario acepta, el script llega antes. */}
        <link rel="dns-prefetch" href="https://connect.facebook.net" />

        {/* Tiene que pasar antes del primer pintado, por eso va en línea y sin
            async. El aviso de cookies aparece un momento después de cargar. Si
            su alto se aplicara entonces, todo lo que se apoya en él daría un
            salto y eso penaliza el CLS. Aquí se reserva el hueco de antemano,
            mirando si ya hay una decisión guardada. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;try{var y=localStorage.getItem('${CONSENT_KEY}');d.style.setProperty('--consent-h',y?'0px':(innerWidth<380?'97px':innerWidth<640?'81px':'57px'))}catch(e){d.style.setProperty('--consent-h','97px')}})()`,
          }}
        />
        {/* Hero según el anuncio: marca <html> con data-campaign y data-ad
            antes del primer pintado (ver src/lib/ad-variants.ts). */}
        <script dangerouslySetInnerHTML={{ __html: scriptAnuncio() }} />
        {/* UTM y fbclid guardados en cuanto llega la visita (ver leads.ts). */}
        <script dangerouslySetInnerHTML={{ __html: scriptCapturaVisita() }} />
      </head>
      <body>
        <ConsentProvider>{children}</ConsentProvider>
      </body>
    </html>
  );
}
