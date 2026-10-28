/**
 * Hero según el anuncio (src/lib/ad-variants.ts): variante correcta, sin
 * parpadeo, con CLS 0 y conservada al ir a una legal y volver.
 */
import { type Page } from '@playwright/test';
import { decisionGuardada, expect, test } from './support/fixtures';

const DEFECTO = 'Tu cochepuede dar más.';
const CIERRE = '¿Cuánto ganatu coche?';

/** Titular visible del hero. */
const titular = (page: Page) =>
  page.evaluate(() => {
    const v = [...document.querySelectorAll<HTMLElement>('[data-hero-v]')].filter(
      (e) => getComputedStyle(e).display !== 'none',
    );
    return { visibles: v.length, h1: v[0]?.querySelector('h1')?.textContent ?? '' };
  });

const CASOS: [string, string][] = [
  ['?utm_campaign=cerrar', CIERRE],
  ['?utm_campaign=descubrir', DEFECTO],
  ['?utm_content=bofu1', CIERRE],
  ['?utm_content=TOFU1.0', DEFECTO],
  ['', DEFECTO],
  // utm_content manda sobre utm_campaign.
  ['?utm_campaign=descubrir&utm_content=bofu1', CIERRE],
  ['?utm_campaign=cerrar&utm_content=tofu2', DEFECTO],
];

for (const [q, esperado] of CASOS) {
  test(`variante para "${q || 'sin UTM'}"`, async ({ page }) => {
    await decisionGuardada(page, false);
    await page.goto(`/${q}`);
    expect(await titular(page)).toEqual({ visibles: 1, h1: esperado });
  });
}

test('atributos normalizados en <html>', async ({ page }) => {
  await page.goto('/?utm_content=TOFU1.0&utm_campaign=cerrar');
  const a = await page.evaluate(() => ({ ...document.documentElement.dataset }));
  expect(a).toMatchObject({ ad: 'tofu1', campaign: 'descubrir' });
});

test('sin parpadeo: la variante se decide antes de que cargue React', async ({ page }) => {
  // Sin el JS de la web (sólo el script en línea del <head>), el hero ya es el bueno.
  await page.route('**/_next/static/chunks/*.js', (r) => r.abort());
  await page.goto('/?utm_campaign=cerrar');
  expect(await titular(page)).toEqual({ visibles: 1, h1: CIERRE });
});

test('CLS 0 con la variante de cierre', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/?utm_campaign=cerrar');
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.01);
});

test('la variante se conserva al ir a una legal y volver', async ({ page }) => {
  await decisionGuardada(page, false);
  await page.goto('/?utm_campaign=cerrar');
  await page.goto('/politica-cookies/');
  await page.goto('/');
  expect(await titular(page)).toEqual({ visibles: 1, h1: CIERRE });
});

test('primer pantallazo: antetítulo, H1, beneficio, CTA y prueba social a la vista, sin tapar por el banner', async ({ page }) => {
  for (const q of ['', '?utm_campaign=cerrar']) {
    await page.goto(`/${q}`);
    await expect(page.getByRole('region', { name: 'Aviso de cookies' })).toBeVisible();
    const r = await page.evaluate(() => {
      const v = [...document.querySelectorAll<HTMLElement>('[data-hero-v]')].find((e) => getComputedStyle(e).display !== 'none')!;
      const fin = (el: Element | null) => (el ? el.getBoundingClientRect().bottom : Infinity);
      return {
        alto: innerHeight,
        eyebrow: fin(v.querySelector('.eyebrow')),
        h1: fin(v.querySelector('h1')),
        sub: fin(v.querySelector('h1 + p')),
        cta: fin(document.querySelector('#top a[data-cta]')),
        prueba: fin(document.querySelector('#top ul')),
        banner: document.querySelector('[aria-label="Aviso de cookies"]')!.getBoundingClientRect().top,
      };
    });
    for (const k of ['eyebrow', 'h1', 'sub', 'cta'] as const) expect(r[k], `${k} (${q})`).toBeLessThanOrEqual(r.banner);
    expect(r.prueba, `prueba social (${q})`).toBeLessThanOrEqual(r.alto);
  }
});
