/**
 * UTM persistentes y contrato del payload a la hoja, por el flujo real:
 * navegador -> /api/lead/ (servidor local) -> simulador de la hoja.
 * Nada llega a la hoja real: el servidor de pruebas apunta al simulador.
 */
import contrato from './fixtures/payload-hoja.json';
import { botonEnviar, decisionGuardada, expect, limpiarRegistro, registro, rellenar, test } from './support/fixtures';

async function cuerpoHoja(): Promise<string> {
  const fin = Date.now() + 8000;
  while (Date.now() < fin) {
    const h = (await registro()).find((r) => r.url.startsWith('/exec'));
    if (h) return h.cuerpo;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('No llegó nada a la hoja simulada');
}

test.beforeEach(async () => {
  await limpiarRegistro();
});

test('los UTM llegan a la hoja aunque se recargue y se pase por una legal', async ({ page }) => {
  await decisionGuardada(page, false);
  // Se recarga en cuanto llega el HTML, sin esperar a que cargue la web: los
  // UTM tienen que estar guardados ya.
  await page.goto('/?utm_source=meta&utm_campaign=cerrar&utm_content=prueba', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  // El navegador de Instagram a veces restaura la página sin parámetros.
  await page.goto('/politica-privacidad/');
  await page.goto('/');
  await rellenar(page);
  await botonEnviar(page).click();
  await expect(page.locator('text=/Listo, Laura\\./')).toBeVisible({ timeout: 10_000 });

  const p = new URLSearchParams(await cuerpoHoja());
  expect(p.get('utm_source')).toBe('meta');
  expect(p.get('utm_campaign')).toBe('cerrar');
  expect(p.get('utm_content')).toBe('prueba');
});

test('una visita sin UTM no inventa valores, aunque traiga fbclid', async ({ page }) => {
  await decisionGuardada(page, false);
  await page.goto('/?fbclid=PRUEBA123');
  await rellenar(page);
  await botonEnviar(page).click();
  await expect(page.locator('text=/Listo, Laura\\./')).toBeVisible({ timeout: 10_000 });
  const p = new URLSearchParams(await cuerpoHoja());
  expect([p.get('utm_source'), p.get('utm_campaign'), p.get('utm_content')]).toEqual(['', '', '']);
});

for (const caso of ['completo', 'nolose'] as const) {
  test(`contrato: el cuerpo a la hoja es idéntico al de antes (${caso}, +34)`, async ({ page }) => {
    const c = contrato[caso];
    await decisionGuardada(page, false);
    await page.goto(c.entrada.url);
    await rellenar(page, c.entrada);
    let eventId = '';
    page.on('request', (r) => {
      if (r.url().includes('/api/lead/')) eventId = r.postDataJSON().event_id;
    });
    await botonEnviar(page).click();
    await expect(page.locator('text=/Listo, /')).toBeVisible({ timeout: 10_000 });
    expect(await cuerpoHoja()).toBe(c.cuerpo.replace('{EVENT_ID}', eventId));
  });
}
