/**
 * WhatsApp tras enviar (pantalla de gracias) y pantalla de error de envío.
 * Son las dos únicas excepciones a la regla de "ningún enlace fuera".
 */
import { botonEnviar, decisionGuardada, eventosDe, expect, interceptarApi, rellenar, test } from './support/fixtures';

const MENSAJE = 'Hola, soy Laura Gómez. Mi coche: Seat León, 2015, 2.0 TDI, 150 CV.';

test('móvil: tras enviar se abre WhatsApp solo, con el coche, y no antes de 800 ms del Lead', async ({ page, eventos, isMobile }) => {
  test.skip(!isMobile, 'Sólo en móvil');
  await decisionGuardada(page, true);
  await interceptarApi(page);
  let navegaEn = 0;
  let destino = '';
  page.on('request', (r) => {
    if (r.url().startsWith('https://wa.me/') && r.isNavigationRequest()) {
      navegaEn = Date.now();
      destino = r.url();
    }
  });
  await page.goto('/');
  await rellenar(page);
  await botonEnviar(page).click();
  await expect(page.locator('text=/Listo, Laura\\./')).toBeVisible();
  await expect(page.locator('#presupuesto')).toContainText('Te abrimos WhatsApp para que nos escribas ya.');
  await expect(page.getByRole('link', { name: 'Abrir WhatsApp' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pedir otro presupuesto' })).toBeVisible();

  await page.waitForURL(/wa\.me/, { timeout: 5000 });
  const url = new URL(destino);
  expect(url.host + url.pathname).toBe('wa.me/34711523484');
  expect(url.searchParams.get('text')).toBe(MENSAJE);

  const lead = eventosDe(eventos, 'Lead')[0];
  expect(lead, 'el Lead sale antes').toBeTruthy();
  expect(navegaEn - lead.t).toBeGreaterThanOrEqual(800);
  const contacto = eventosDe(eventos, 'Contact').map((e) => e.args[2]);
  expect(contacto).toEqual([{ content_category: 'gracias-auto' }]);
});

test('escritorio: no redirige, sólo el botón, que mide gracias-boton', async ({ page, eventos, isMobile, context }) => {
  test.skip(isMobile, 'Sólo en escritorio');
  await decisionGuardada(page, true);
  await interceptarApi(page);
  await page.goto('/');
  await rellenar(page);
  await botonEnviar(page).click();
  await expect(page.locator('text=/Listo, Laura\\./')).toBeVisible();
  await page.waitForTimeout(2500);
  expect(page.url()).not.toContain('wa.me');

  const boton = page.getByRole('link', { name: 'Abrir WhatsApp' });
  const href = (await boton.getAttribute('href'))!;
  expect(new URL(href).searchParams.get('text')).toBe(MENSAJE);
  const [pestana] = await Promise.all([context.waitForEvent('page'), boton.click()]);
  await pestana.close();
  expect(eventosDe(eventos, 'Contact').map((e) => e.args[2])).toEqual([{ content_category: 'gracias-boton' }]);
});

test('lo que no se sabía no sale en el mensaje', async ({ page, isMobile }) => {
  test.skip(isMobile, 'El enlace se lee mejor sin la redirección de móvil');
  await decisionGuardada(page, false);
  await interceptarApi(page);
  await page.goto('/');
  await rellenar(page, { modelo: 'BMW Serie 3', anio: '2016', motor: null, potencia: null, nombre: 'Diego', telefono: '611223344' });
  await botonEnviar(page).click();
  const href = (await page.getByRole('link', { name: 'Abrir WhatsApp' }).getAttribute('href'))!;
  expect(new URL(href).searchParams.get('text')).toBe('Hola, soy Diego. Mi coche: BMW Serie 3, 2016.');
});

test('error de envío (502): botón de WhatsApp con todos los datos y sin Lead', async ({ page, eventos, context }) => {
  await decisionGuardada(page, true);
  await interceptarApi(page, 502, false);
  await page.goto('/');
  await rellenar(page);
  await botonEnviar(page).click();
  await expect(page.locator('#presupuesto [role="alert"]')).toContainText('No se ha podido enviar');
  await page.waitForTimeout(1800);
  expect(page.url(), 'con error no se redirige').not.toContain('wa.me');

  const boton = page.getByRole('link', { name: 'Enviar por WhatsApp' });
  const href = (await boton.getAttribute('href'))!;
  const url = new URL(href);
  expect(url.host + url.pathname).toBe('wa.me/34711523484');
  expect(url.searchParams.get('text')).toBe(`${MENSAJE}\nMi teléfono: 611223344.`);
  // Lo rellenado sigue ahí para reintentar.
  await expect(page.locator('#f-nombre')).toHaveValue('Laura Gómez');

  const [pestana] = await Promise.all([context.waitForEvent('page'), boton.click()]);
  await pestana.close();
  expect(eventosDe(eventos, 'Lead')).toHaveLength(0);
  expect(eventosDe(eventos, 'Contact').map((e) => e.args[2])).toEqual([{ content_category: 'error-envio' }]);
});
