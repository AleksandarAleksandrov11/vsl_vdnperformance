import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Exportación estática: Vercel sirve /out como archivos estáticos.
  output: 'export',
  // Sin optimizador de imágenes en runtime: las variantes AVIF/WebP se generan
  // en build time con sharp (scripts/build-assets.mjs) y se sirven con <picture>.
  images: { unoptimized: true },
  // URLs con barra final -> /aviso-legal/index.html (compatible con hosting estático).
  trailingSlash: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
};

export default nextConfig;
