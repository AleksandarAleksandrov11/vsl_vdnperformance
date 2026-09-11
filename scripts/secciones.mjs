/**
 * secciones.mjs — una captura por sección, al ancho que se le pida.
 *
 * Es lo que de verdad ve una persona: lleva cada sección al centro de la
 * pantalla, espera a que terminen sus animaciones de entrada y captura el
 * viewport. Las capturas de página completa no valen aquí, porque las
 * secciones con content-visibility salen en blanco.
 *
 *   node scripts/secciones.mjs <url> <carpeta> <ancho>
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.argv[2] ?? 'http://localhost:4401';
const OUT = process.argv[3] ?? '/tmp/secciones';
const ANCHO = Number(process.argv[4] ?? 390);
const ALTO = ANCHO < 700 ? 844 : 900;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const ctx = await browser.newContext({
  viewport: { width: ANCHO, height: ALTO },
  deviceScaleFactor: 2,
  isMobile: ANCHO < 700,
  hasTouch: ANCHO < 700,
  locale: 'es-ES',
});
const page = await ctx.newPage();
await mkdir(OUT, { recursive: true });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

// Se acepta el aviso de cookies para que no tape las capturas siguientes.
await page.screenshot({ path: `${OUT}/${ANCHO}-00-hero-cookies.png` });
await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/${ANCHO}-01-hero.png` });

const secciones = await page.evaluate(() =>
  [...document.querySelectorAll('main > section, main > *')].map((el, i) => ({
    i,
    id: el.id || el.getAttribute('aria-labelledby') || el.tagName.toLowerCase(),
    top: el.getBoundingClientRect().top + window.scrollY,
    alto: Math.round(el.getBoundingClientRect().height),
  })),
);

let n = 2;
for (const s of secciones.slice(1)) {
  // Secciones altas (proceso, formulario) se capturan en dos alturas.
  const paradas = s.alto > ALTO * 1.6 ? [0.18, 0.62] : [0.5];
  for (const p of paradas) {
    const y = Math.max(0, s.top + s.alto * p - ALTO / 2);
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
    await page.waitForTimeout(1400); // margen para clip-path + contadores
    const nombre = `${ANCHO}-${String(n).padStart(2, '0')}-${s.id.replace(/[^a-z0-9-]/gi, '')}`;
    await page.screenshot({ path: `${OUT}/${nombre}.png` });
    n++;
  }
}

// El pie, al final del todo.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/${ANCHO}-${String(n).padStart(2, '0')}-footer.png` });

console.log(`${n} capturas en ${OUT}`);
console.table(secciones.map((s) => ({ id: s.id, alto: s.alto })));
await browser.close();
