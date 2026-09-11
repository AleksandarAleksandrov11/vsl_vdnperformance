/**
 * test-motion.mjs — comprueba que con "reducir movimiento" activado todo el
 * contenido sigue viéndose: ninguna animación puede dejar nada invisible.
 *
 *   node scripts/test-motion.mjs [url]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4326';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

let fallos = 0;
for (const motion of ['reduce', 'no-preference']) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: motion === 'reduce' ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const invisibles = await page.evaluate(() => {
    const malos = [];
    for (const el of document.querySelectorAll('h1, h2, h3, p, a, button, li')) {
      if (el.closest('[hidden], [aria-hidden="true"], .sr-only')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      // Sólo lo que está en pantalla: lo de más abajo aparece al hacer scroll.
      if (r.bottom < 0 || r.top > window.innerHeight || r.height === 0) continue;
      if (parseFloat(cs.opacity) < 0.9) {
        malos.push(el.tagName + ' op=' + cs.opacity + ' "' + (el.textContent || '').trim().slice(0, 40) + '"');
      }
    }
    return [...new Set(malos)];
  });

  const parallax = await page.evaluate(async () => {
    const capa = document.querySelector('#top > div');
    window.scrollTo(0, 300);
    await new Promise((r) => setTimeout(r, 400));
    return getComputedStyle(capa).transform;
  });

  console.log(`\nprefers-reduced-motion: ${motion}`);
  console.log(`  contenido invisible en pantalla: ${invisibles.length ? '✗ ' + invisibles.join(' | ') : '✓ ninguno'}`);
  const parallaxActivo = parallax !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(parallax);
  const esperado = motion === 'reduce' ? !parallaxActivo : parallaxActivo;
  console.log(`  parallax del hero: ${parallaxActivo ? 'activo' : 'parado'} ${esperado ? '✓' : '✗'}`);
  if (invisibles.length || !esperado) fallos++;
  await ctx.close();
}
await browser.close();
console.log(fallos ? `\n${fallos} problemas.` : '\nTodo correcto.');
process.exit(fallos ? 1 : 0);
