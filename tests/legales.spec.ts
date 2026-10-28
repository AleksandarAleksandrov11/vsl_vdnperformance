/**
 * Enlaces legales en pestaña nueva y progreso del formulario conservado.
 */
import { COCHE, decisionGuardada, expect, test } from './support/fixtures';

const LEGALES = 'a[href*="aviso-legal"], a[href*="politica-privacidad"], a[href*="politica-cookies"]';

test('todos los enlaces legales de la portada abren en pestaña nueva', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Aviso de cookies' })).toBeVisible();
  const comprobar = async (cuantos: number) => {
    const enlaces = await page.locator(LEGALES).all();
    expect(enlaces.length).toBeGreaterThanOrEqual(cuantos);
    for (const a of enlaces) {
      await expect(a).toHaveAttribute('target', '_blank');
      expect(await a.getAttribute('rel')).toContain('noopener');
    }
  };
  // Pie (3) y "Más info" del aviso.
  await comprobar(4);
  // Pie y "Política de cookies" del panel.
  await page.getByRole('button', { name: 'Configurar', exact: true }).click();
  await comprobar(4);
});

test('abrir la privacidad desde el último paso no pierde lo rellenado', async ({ page, context }) => {
  await decisionGuardada(page, false);
  await page.goto('/');
  await page.locator('#presupuesto').scrollIntoViewIfNeeded();
  // Cuatro pasos contestados y el quinto a medias.
  for (const [id, v] of [['#f-modelo', COCHE.modelo], ['#f-anio', COCHE.anio], ['#f-motor', '2.0 TDI'], ['#f-potencia', '150']]) {
    await page.locator(id).fill(v);
    await page.locator(id).press('Enter');
    await expect(page.locator(id)).toBeHidden();
  }
  await page.locator('#f-nombre').fill('Laura');

  const enlace = page.locator('#presupuesto a[href*="politica-privacidad"]');
  await expect(enlace).toHaveAttribute('target', '_blank');
  const [pestana] = await Promise.all([context.waitForEvent('page'), enlace.click()]);
  await pestana.waitForLoadState();
  await expect(pestana).toHaveURL(/politica-privacidad/);
  await pestana.close();

  await expect(page.locator('#presupuesto .num').first()).toContainText('5 / 5');
  await expect(page.locator('#f-nombre')).toHaveValue('Laura');

  // Y si la página se recarga o se vuelve desde una legal, también.
  await page.reload();
  await expect(page.locator('#presupuesto .num').first()).toContainText('5 / 5');
  await expect(page.locator('#f-nombre')).toHaveValue('Laura');
  await page.goto('/aviso-legal/');
  await page.goBack();
  await expect(page.locator('#presupuesto .num').first()).toContainText('5 / 5');
});
