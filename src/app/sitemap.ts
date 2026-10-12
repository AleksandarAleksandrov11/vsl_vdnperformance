import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/config';

/**
 * /sitemap.xml. Sólo la portada: las páginas legales no aportan nada en un
 * buscador. Ojo: mientras la landing lleve noindex (layout.tsx) y robots.txt
 * bloquee el rastreo, Google no la va a indexar aunque exista este sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE.url}/`, changeFrequency: 'monthly', priority: 1 }];
}
