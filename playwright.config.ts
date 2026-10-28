import { defineConfig } from '@playwright/test';

/**
 * Suite de pruebas de la landing. `npm test`.
 *
 * Levanta tres servidores:
 *  · el simulador de la hoja y de la Graph API (tests/support/simulador.mjs);
 *  · la web en producción (`npm run build && npm start`, puerto 3000) con el
 *    Apps Script y Meta apuntando al simulador y un token de prueba;
 *  · la misma web sin token (puerto 3001), para probar que sin token no se
 *    llama a la CAPI.
 * Ningún servidor se reutiliza: así nunca se prueba contra uno que escriba en
 * la hoja real. En el navegador, además, script.google.com, graph.facebook.com,
 * connect.facebook.net y wa.me están siempre interceptados (tests/support).
 *
 * Usa el Chromium que instala Playwright (`npx playwright install chromium`).
 * Si hay que usar otro, CHROMIUM_PATH=/ruta/al/chrome.
 */

const SIMULADOR = 'http://127.0.0.1:4610';
const ENTORNO = {
  SHEETS_WEBHOOK_URL: `${SIMULADOR}/exec`,
  META_GRAPH_URL: `${SIMULADOR}/graph`,
};

const UA_INSTAGRAM =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 Instagram 340.0.0.22.109 (iPhone15,2; iOS 17_5; es_ES; es; scale=3.00; 1179x2556)';

const lanzar = { executablePath: process.env.CHROMIUM_PATH || undefined };

export default defineConfig({
  testDir: './tests',
  // El simulador guarda un único registro: las pruebas van de una en una.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'es-ES',
    launchOptions: lanzar,
  },
  projects: [
    { name: 'api', testMatch: /api\.spec\.ts/ },
    {
      name: 'movil',
      testIgnore: /api\.spec\.ts/,
      use: {
        deviceScaleFactor: 3,
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent: UA_INSTAGRAM,
        launchOptions: lanzar,
      },
    },
    {
      name: 'escritorio',
      testIgnore: /api\.spec\.ts/,
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 }, launchOptions: lanzar },
    },
  ],
  webServer: [
    {
      command: 'node tests/support/simulador.mjs 4610',
      url: `${SIMULADOR}/__registro`,
      reuseExistingServer: false,
    },
    {
      command: 'npm run build && npm start',
      url: 'http://localhost:3000',
      env: { ...ENTORNO, META_CAPI_TOKEN: 'token-de-prueba' },
      timeout: 400_000,
      reuseExistingServer: false,
    },
    {
      command: 'npx next start -p 3001',
      url: 'http://localhost:3001',
      env: { ...ENTORNO, META_CAPI_TOKEN: '' },
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
});
