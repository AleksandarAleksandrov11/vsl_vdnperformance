import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/** Reglas oficiales de Next.js 16 (Core Web Vitals + TypeScript). */
const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts'] },
];

export default config;
