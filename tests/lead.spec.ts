/**
 * Medición: lo que el navegador manda a /api/lead/ y el Lead del píxel.
 * /api/lead/ está interceptado: ni hoja ni Meta.
 */
import { botonEnviar, decisionGuardada, eventosDe, expect, interceptarApi, rellenar, test } from './support/fixtures';

test('con cookies rechazadas: el píxel no se carga y el cuerpo lleva todo lo de la CAPI', async ({ page, eventos }) => {
  const fbevents: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('connect.facebook.net')) fbevents.push(r.url());
  });
  const api = await interceptarApi(page);
  await page.goto('/?fbclid=PRUEBA123&utm_source=meta&utm_campaign=cerrar&utm_content=prueba');
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  // Una _fbp de una visita anterior se lee aunque ahora no haya consentimiento.
  await page.context().addCookies([{ name: '_fbp', value: 'fb.1.1700000000000.111', url: page.url() }]);
  await rellenar(page);
  await botonEnviar(page).click();
  await expect.poll(() => api.cuerpos.length).toBe(1);

  const c = api.cuerpos[0];
  expect(c.fbclid).toBe('PRUEBA123');
  expect(Number(c.fbclid_ts)).toBeGreaterThan(1_700_000_000_000);
  expect(c.fbp).toBe('fb.1.1700000000000.111');
  expect(c).toHaveProperty('fbc');
  expect(c.consent_marketing).toBe(false);
  expect(c.event_source_url).toMatch(/^http:\/\/localhost:3000\/$/);
  expect(c.event_id).toMatch(/^[0-9a-f-]{36}$/);

  await page.waitForTimeout(500);
  expect(fbevents, 'sin consentimiento no se pide fbevents.js').toEqual([]);
  expect(eventos).toEqual([]);
  // No se escribe ninguna cookie de Meta sin consentimiento.
  const cookies = (await page.context().cookies()).map((k) => k.name);
  expect(cookies).not.toContain('_fbc');
});

test('Lead una sola vez aunque se pulse Enter varias veces, sin valor ni moneda', async ({ page, eventos }) => {
  await decisionGuardada(page, true);
  const api = await interceptarApi(page);
  await page.goto('/');
  await rellenar(page);
  await page.locator('#f-telefono').press('Enter');
  await page.locator('#f-telefono').press('Enter').catch(() => {});
  await page.locator('#f-telefono').press('Enter').catch(() => {});
  await expect(page.locator('text=/Listo, Laura\\./')).toBeVisible();
  await page.waitForTimeout(400);

  expect(api.cuerpos, 'un solo POST').toHaveLength(1);
  const leads = eventosDe(eventos, 'Lead');
  expect(leads).toHaveLength(1);
  expect(leads[0].args[2]).toEqual({ content_name: 'Presupuesto reprogramación' });
  expect(leads[0].args[3]).toEqual({ eventID: api.cuerpos[0].event_id });

  // Coincidencia avanzada justo antes del Lead.
  const init = eventos.filter((e) => e.args[0] === 'init' && e.args[2]);
  expect(init.at(-1)?.args[2]).toEqual({ ph: '34611223344', fn: 'laura', country: 'es' });

  // Embudo: ViewContent, FormStart y un FormStep por paso.
  expect(eventosDe(eventos, 'ViewContent')).toHaveLength(1);
  expect(eventosDe(eventos, 'FormStart')).toHaveLength(1);
  expect(eventosDe(eventos, 'FormStep').map((e) => (e.args[2] as { step: number }).step)).toEqual([1, 2, 3, 4, 5]);
});

test('aceptar las cookies después de enviar saca el Lead con el mismo eventID, una vez', async ({ page, eventos }) => {
  const api = await interceptarApi(page);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Aviso de cookies' })).toBeVisible();
  await rellenar(page);
  await botonEnviar(page).click();
  await expect(page.locator('text=/Listo, Laura\\./')).toBeVisible();
  expect(eventosDe(eventos, 'Lead')).toHaveLength(0);

  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
  await expect.poll(() => eventosDe(eventos, 'Lead').length).toBe(1);
  expect(eventosDe(eventos, 'Lead')[0].args[3]).toEqual({ eventID: api.cuerpos[0].event_id });
  // Los eventos del embudo no se encolan sin consentimiento.
  expect(eventosDe(eventos, 'FormStep')).toHaveLength(0);
  expect(eventosDe(eventos, 'PageView')).toHaveLength(1);
});

test('FormError con paso y campo en cada error', async ({ page, eventos }) => {
  await decisionGuardada(page, true);
  await page.goto('/');
  await page.locator('#presupuesto').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  const errores = eventosDe(eventos, 'FormError').map((e) => e.args[2]);
  expect(errores).toEqual([
    { step: 1, field: 'modelo' },
    { step: 1, field: 'modelo' },
  ]);
});

test('un reintento tras un fallo usa el mismo event_id', async ({ page }) => {
  await decisionGuardada(page, false);
  const cuerpos: Record<string, unknown>[] = [];
  let intento = 0;
  await page.route('**/api/lead/', async (r) => {
    cuerpos.push(r.request().postDataJSON());
    intento++;
    await r.fulfill({ status: intento === 1 ? 502 : 200, contentType: 'application/json', body: JSON.stringify({ ok: intento > 1 }) });
  });
  await page.goto('/');
  await rellenar(page);
  await botonEnviar(page).click();
  await expect(page.locator('#presupuesto [role="alert"]')).toContainText('No se ha podido enviar');
  await botonEnviar(page).click();
  await expect(page.locator('text=/Listo, Laura\\./')).toBeVisible();
  expect(cuerpos).toHaveLength(2);
  expect(cuerpos[1].event_id).toBe(cuerpos[0].event_id);
});
