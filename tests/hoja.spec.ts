/**
 * Respuestas raras del Apps Script, por el flujo real: navegador ->
 * /api/lead/ (servidor local) -> simulador de la hoja. Nada llega a la real.
 */
import { botonEnviar, COCHE, decisionGuardada, eventosDe, expect, limpiarRegistro, rellenar, test } from './support/fixtures';

test.beforeEach(async () => {
  await limpiarRegistro();
});

test('hoja lenta (25 s): el navegador espera y sale la pantalla de gracias con su Lead', async ({ page, eventos }) => {
  test.setTimeout(90_000);
  await decisionGuardada(page, true);
  await page.goto('/');
  await rellenar(page, { ...COCHE, nombre: 'Lenta Prueba' });
  await botonEnviar(page).click();
  await expect(page.locator('text=/Listo, Lenta\\./')).toBeVisible({ timeout: 40_000 });
  expect(eventosDe(eventos, 'Lead')).toHaveLength(1);
});

test('hoja que responde 2xx pero no JSON: se da por guardado y sale el Lead', async ({ page, eventos }) => {
  await decisionGuardada(page, true);
  await page.goto('/');
  await rellenar(page, { ...COCHE, nombre: 'NoJson Prueba' });
  await botonEnviar(page).click();
  await expect(page.locator('text=/Listo, NoJson\\./')).toBeVisible({ timeout: 10_000 });
  expect(eventosDe(eventos, 'Lead')).toHaveLength(1);
});

test('hoja caída (5xx): error, botón de WhatsApp con todos los datos y sin Lead', async ({ page, eventos }) => {
  await decisionGuardada(page, true);
  await page.goto('/');
  await rellenar(page, { ...COCHE, nombre: 'Caida Prueba' });
  await botonEnviar(page).click();
  await expect(page.locator('#presupuesto [role="alert"]')).toContainText('No se ha podido enviar', { timeout: 10_000 });
  const href = (await page.getByRole('link', { name: 'Enviar por WhatsApp' }).getAttribute('href'))!;
  expect(new URL(href).searchParams.get('text')).toBe(
    'Hola, soy Caida Prueba. Mi coche: Seat León, 2015, 2.0 TDI, 150 CV.\nMi teléfono: 611223344.',
  );
  await expect(page.locator('#f-nombre')).toHaveValue('Caida Prueba');
  expect(eventosDe(eventos, 'Lead')).toHaveLength(0);
});
