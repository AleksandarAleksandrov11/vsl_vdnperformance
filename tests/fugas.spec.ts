/**
 * Fugas: ningún enlace de la portada saca de la página antes del formulario.
 * Sólo se permiten enlaces internos (#ancla o /ruta de la propia web). Las
 * pantallas de gracias y de error de envío son la excepción (ver whatsapp.spec).
 */
import { type Page } from '@playwright/test';
import { decisionGuardada, expect, test } from './support/fixtures';

const PROHIBIDOS = [
  'wa.me', 'api.whatsapp', 'whatsapp:', 'tel:', 'mailto:', 'instagram.com', 'tiktok.com',
  'facebook.com', 'google.com/maps', 'share.google', 'vdnperformance.es',
];

/** Enlaces que salen de la página: prohibidos o de cualquier dominio externo. */
async function fugas(page: Page): Promise<string[]> {
  return page.evaluate((prohibidos) => {
    const malos: string[] = [];
    for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      const href = a.getAttribute('href') ?? '';
      const url = new URL(href, location.href);
      const externo = url.origin !== location.origin;
      if (externo || prohibidos.some((p) => href.includes(p))) malos.push(href);
    }
    return malos;
  }, PROHIBIDOS);
}

test.describe('Fugas en la portada', () => {
  test('inicial, con banner, tras aceptar y tras rechazar', async ({ page }) => {
    await page.goto('/');
    expect(await fugas(page), 'inicial').toEqual([]);
    await expect(page.getByRole('region', { name: 'Aviso de cookies' })).toBeVisible();
    expect(await fugas(page), 'con banner').toEqual([]);
    await page.getByRole('button', { name: 'Configurar', exact: true }).click();
    expect(await fugas(page), 'panel de cookies').toEqual([]);
    await page.getByRole('button', { name: 'Aceptar todas' }).click();
    expect(await fugas(page), 'tras aceptar').toEqual([]);
  });

  test('tras rechazar, con la FAQ abierta, con errores y con la barra móvil', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
    expect(await fugas(page), 'tras rechazar').toEqual([]);

    for (const b of await page.locator('#dudas button[aria-expanded]').all()) {
      await b.click();
      expect(await fugas(page), 'FAQ abierta').toEqual([]);
    }

    await page.locator('#presupuesto').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.locator('#presupuesto [role="alert"]')).toContainText('marca');
    expect(await fugas(page), 'con errores').toEqual([]);

    if (isMobile) {
      await page.locator('#dudas').scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 200);
      expect(await fugas(page), 'con la barra móvil').toEqual([]);
    }
  });

  test('con decisión guardada y cookies aceptadas', async ({ page }) => {
    await decisionGuardada(page, true);
    await page.goto('/');
    expect(await fugas(page)).toEqual([]);
  });
});

test.describe('Legales sin enlaces de contacto', () => {
  for (const ruta of ['/aviso-legal/', '/politica-privacidad/', '/politica-cookies/']) {
    test(`${ruta}: correo y teléfono como texto`, async ({ page }) => {
      await page.goto(ruta);
      const malos = await page.evaluate(() =>
        [...document.querySelectorAll('a[href]')]
          .map((a) => a.getAttribute('href') ?? '')
          .filter((h) => h.startsWith('mailto:') || h.startsWith('tel:')),
      );
      expect(malos).toEqual([]);
      await expect(page.locator('main')).toContainText('vdnperformance@gmail.com');
    });
  }
});
