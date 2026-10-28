/**
 * Visitas por servidor: el navegador manda PageView al cargar y ViewContent al
 * empezar el formulario a /api/evento/ (interceptado en los fixtures), con el
 * mismo event_id que el píxel.
 */
import { decisionGuardada, eventosDe, expect, rellenar, test } from './support/fixtures';

test('sin consentimiento: PageView y ViewContent salen por servidor, con el fbclid, sin cookies', async ({ page, visitas, eventos }) => {
  await page.goto('/?fbclid=PRUEBA123');
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  await expect.poll(() => visitas.map((v) => v.event_name)).toContain('PageView');
  const pv = visitas.find((v) => v.event_name === 'PageView')!;
  expect(pv.fbclid).toBe('PRUEBA123');
  expect(Number(pv.fbclid_ts)).toBeGreaterThan(1_700_000_000_000);
  expect(pv.event_id).toMatch(/^[0-9a-f-]{36}$/);
  expect(pv.event_source_url).toBe('http://localhost:3000/');

  await rellenar(page);
  expect(visitas.filter((v) => v.event_name === 'ViewContent')).toHaveLength(1);
  expect(eventos, 'sin consentimiento, nada del píxel').toEqual([]);
  expect((await page.context().cookies()).map((c) => c.name)).not.toContain('_fbc');
});

test('con consentimiento: el píxel usa el mismo event_id que el servidor', async ({ page, visitas, eventos }) => {
  await decisionGuardada(page, true);
  await page.goto('/');
  await rellenar(page);
  const pvServidor = visitas.find((v) => v.event_name === 'PageView')!.event_id;
  const vcServidor = visitas.find((v) => v.event_name === 'ViewContent')!.event_id;
  expect(eventosDe(eventos, 'PageView')[0].args[3]).toEqual({ eventID: pvServidor });
  expect(eventosDe(eventos, 'ViewContent')[0].args[3]).toEqual({ eventID: vcServidor });
});

test('si acepta después, el PageView del píxel sale con el event_id ya enviado', async ({ page, visitas, eventos }) => {
  await page.goto('/');
  await expect.poll(() => visitas.length).toBeGreaterThan(0);
  const pvServidor = visitas.find((v) => v.event_name === 'PageView')!.event_id;
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
  await expect.poll(() => eventosDe(eventos, 'PageView').length).toBe(1);
  expect(eventosDe(eventos, 'PageView')[0].args[3]).toEqual({ eventID: pvServidor });
  // Una sola visita por carga.
  expect(visitas.filter((v) => v.event_name === 'PageView')).toHaveLength(1);
});
