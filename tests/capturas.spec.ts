/**
 * Capturas para revisar a ojo, en capturas/ (ignorada por git):
 * hero por defecto y de cierre, formulario con el prefijo, gracias y pie.
 */
import { botonEnviar, decisionGuardada, expect, interceptarApi, rellenar, test } from './support/fixtures';

test('capturas', async ({ page }, info) => {
  const dir = `capturas/${info.project.name}`;
  await decisionGuardada(page, false);
  await interceptarApi(page);

  await page.goto('/');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}/hero-defecto.png` });

  await page.goto('/?utm_campaign=cerrar');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}/hero-cierre.png` });

  await page.goto('/');
  await rellenar(page);
  await page.locator('#presupuesto').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.locator('#presupuesto').screenshot({ path: `${dir}/formulario-prefijo.png` });

  await page.locator('#f-prefijo').selectOption('otro');
  await page.locator('#f-prefijo-otro').fill('353');
  await page.locator('#presupuesto').screenshot({ path: `${dir}/formulario-prefijo-otro.png` });
  await page.locator('#f-prefijo').selectOption('34');

  // Sin la redirección de móvil, para fotografiar la pantalla de gracias.
  await page.evaluate(() => {
    Object.defineProperty(window, 'matchMedia', {
      value: (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }),
    });
  });
  await botonEnviar(page).click();
  await expect(page.locator('text=/Listo, Laura\\./')).toBeVisible();
  await page.waitForTimeout(900);
  await page.locator('#presupuesto').screenshot({ path: `${dir}/gracias.png` });

  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.locator('footer').screenshot({ path: `${dir}/pie.png` });
});
