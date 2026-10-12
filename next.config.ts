import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Ya no es `output: 'export'`: la web necesita una función de servidor,
     /api/lead/, que confirma que la hoja guardó el presupuesto y manda el Lead
     a la API de Conversiones de Meta. Las páginas siguen siendo estáticas
     (se prerenderizan en el build y Vercel las sirve desde la CDN). */
  // Sin optimizador de imágenes en runtime: las variantes AVIF/WebP se generan
  // en build time con sharp (scripts/build-assets.mjs) y se sirven con <picture>.
  images: { unoptimized: true },
  // URLs con barra final: /aviso-legal/, igual que cuando era export estático.
  trailingSlash: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  async rewrites() {
    /* /llamar/ es un HTML suelto en public/ (los teléfonos de la hoja enlazan
       ahí). Con export estático se servía solo; ahora hay que decirlo. */
    return [{ source: '/llamar/', destination: '/llamar/index.html' }];
  },
};

export default nextConfig;
