import type { Metadata, Viewport } from 'next';
import { Inter_Tight } from 'next/font/google';
import { SITE } from '@/lib/config';
import { CONSENT_KEY } from '@/lib/consent';
import { ConsentProvider } from '@/components/ConsentProvider';
import './globals.css';

/**
 * Una sola familia para toda la página. Inter Tight tiene las formas de Inter
 * pero más estrechas, que es lo que aguanta un titular de 96 px sin partirse en
 * cuatro líneas y sin parecer una plantilla.
 */
const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
    <html lang="es" className={interTight.variable}>
      <head>
        {/* Precalentamos el dominio del píxel sólo como DNS: no descarga nada
            ni deja cookies, y si el usuario acepta, el script llega antes. */}
        <link rel="dns-prefetch" href="https://connect.facebook.net" />

        {/* Dos cosas que tienen que pasar antes del primer pintado, por eso va
            en línea y sin async.

            1. El aviso de cookies aparece un momento después de cargar. Si su
               alto se aplicara entonces, todo lo que se apoya en él daría un
               salto y eso penaliza el CLS. Aquí se reserva el hueco de
               antemano, mirando si ya hay una decisión guardada.
            2. La animación de entrada se enseña una vez por sesión. Marcarlo
               aquí evita que vuelva a salir al volver de un aviso legal o al
               recargar, que es cuando cansa. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;try{var y=localStorage.getItem('${CONSENT_KEY}');d.style.setProperty('--consent-h',y?'0px':(innerWidth<640?'138px':'72px'))}catch(e){d.style.setProperty('--consent-h','138px')}try{if(sessionStorage.getItem('vdn-intro'))d.setAttribute('data-intro','visto');else sessionStorage.setItem('vdn-intro','1')}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <ConsentProvider>{children}</ConsentProvider>
      </body>
    </html>
  );
}
