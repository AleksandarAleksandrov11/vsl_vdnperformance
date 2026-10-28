/**
 * Formulario: las mismas preguntas de siempre, validaciones, "No lo sé",
 * Atrás, el selector de prefijo y el texto del botón final.
 */
import { botonEnviar, decisionGuardada, expect, interceptarApi, test } from './support/fixtures';

/** Las preguntas de hoy, tal cual. Si cambian, esta prueba falla. */
const PREGUNTAS = [
  { titulo: '¿Qué coche tienes?', campos: [['f-modelo', 'Audi A3, Golf GTI…']], noLoSe: false },
  { titulo: '¿De qué año es?', campos: [['f-anio', '2016']], noLoSe: false },
  { titulo: '¿Qué motor lleva?', campos: [['f-motor', '2.0 TDI, 1.5 TSI…']], noLoSe: true },
  { titulo: '¿Cuántos CV tiene de serie?', campos: [['f-potencia', '150']], noLoSe: true },
  { titulo: '¿A quién se lo enviamos?', campos: [['f-nombre', 'Nombre'], ['f-telefono', 'Teléfono']], noLoSe: false },
];

const alerta = (page: import('@playwright/test').Page) => page.locator('#presupuesto [role="alert"]');

test.beforeEach(async ({ page }) => {
  await decisionGuardada(page, false);
  await page.goto('/');
  await page.locator('#presupuesto').scrollIntoViewIfNeeded();
});

test('las preguntas y sus opciones son exactamente las de hoy', async ({ page }) => {
  const respuestas = ['Seat León', '2015', '2.0 TDI', '150'];
  for (let i = 0; i < PREGUNTAS.length; i++) {
    const q = PREGUNTAS[i];
    await expect(page.locator('#presupuesto h3')).toHaveText(q.titulo);
    await expect(page.locator('#presupuesto .num').first()).toContainText(`${i + 1} / 5`);
    for (const [id, placeholder] of q.campos) {
      await expect(page.locator(`#${id}`)).toHaveAttribute('placeholder', placeholder);
    }
    await expect(page.getByRole('button', { name: 'No lo sé' })).toHaveCount(q.noLoSe ? 1 : 0);
    if (i < 4) {
      await page.locator(`#${q.campos[0][0]}`).fill(respuestas[i]);
      await page.locator(`#${q.campos[0][0]}`).press('Enter');
    }
  }
  // Ninguna pregunta de más: en el paso 5 sólo están nombre, teléfono y el prefijo.
  const campos = await page.locator('#presupuesto form input:visible, #presupuesto form select').evaluateAll((els) =>
    els.map((e) => e.id).filter((id) => id !== 'website'), // website es el honeypot, invisible
  );
  expect(campos.sort()).toEqual(['f-nombre', 'f-prefijo', 'f-telefono']);
});

test('validaciones: vacío, corto y fuera de rango, sin enlaces en los mensajes', async ({ page }) => {
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(alerta(page)).toContainText('marca');
  await page.locator('#f-modelo').fill('A');
  await page.locator('#f-modelo').press('Enter');
  await expect(alerta(page)).toContainText('marca');
  await page.locator('#f-modelo').fill('BMW Serie 3');
  await page.locator('#f-modelo').press('Enter');

  await page.locator('#f-anio').fill('1975');
  await page.locator('#f-anio').press('Enter');
  await expect(alerta(page)).toContainText('1990');
  await expect(page.locator('#f-anio')).toHaveAttribute('inputmode', 'numeric');
  await page.locator('#f-anio').fill('2016');
  await page.locator('#f-anio').press('Enter');

  await page.getByRole('button', { name: 'No lo sé' }).click();
  await page.locator('#f-potencia').fill('20');
  await page.locator('#f-potencia').press('Enter');
  await expect(alerta(page)).toContainText('40');
  await page.getByRole('button', { name: 'No lo sé' }).click();

  await page.locator('#f-nombre').fill('D');
  await botonEnviar(page).click();
  await expect(alerta(page)).toContainText('nombre');
  await page.locator('#f-nombre').fill('Diego');
  await page.locator('#f-telefono').fill('123');
  await botonEnviar(page).click();
  await expect(alerta(page)).toContainText('9 cifras');
  await expect(alerta(page).locator('a')).toHaveCount(0);
});

test('"No lo sé" y Atrás', async ({ page }) => {
  await page.locator('#f-modelo').fill('BMW Serie 3');
  await page.locator('#f-modelo').press('Enter');
  await page.locator('#f-anio').fill('2016');
  await page.locator('#f-anio').press('Enter');
  await page.getByRole('button', { name: 'No lo sé' }).click();
  await expect(page.locator('#f-potencia')).toBeVisible();
  await page.getByRole('button', { name: 'Atrás' }).click();
  // Lo que se saltó con "No lo sé" vuelve en blanco.
  await expect(page.locator('#f-motor')).toHaveValue('');
  await page.getByRole('button', { name: 'Atrás' }).click();
  await expect(page.locator('#f-anio')).toHaveValue('2016');
});

test.describe('prefijo del teléfono', () => {
  async function irAlPaso5(page: import('@playwright/test').Page) {
    for (const [id, v] of [['#f-modelo', 'Seat León'], ['#f-anio', '2015'], ['#f-motor', '2.0 TDI'], ['#f-potencia', '150']]) {
      await page.locator(id).fill(v);
      await page.locator(id).press('Enter');
      await expect(page.locator(id)).toBeHidden();
    }
    await page.locator('#f-nombre').fill('Laura');
  }

  test('+34 por defecto y el teléfono va como hoy', async ({ page }) => {
    const api = await interceptarApi(page);
    await irAlPaso5(page);
    await expect(page.locator('#f-prefijo')).toHaveValue('34');
    await expect(page.locator('#f-telefono')).toHaveAttribute('autocomplete', 'tel-national');
    await expect(page.locator('#f-telefono')).toHaveAttribute('inputmode', 'tel');
    await page.locator('#f-telefono').fill('611 22 33 44');
    await botonEnviar(page).click();
    await expect.poll(() => api.cuerpos.length).toBe(1);
    expect(api.cuerpos[0].telefono).toBe('611223344');
  });

  test('un número portugués (+351) válido', async ({ page }) => {
    const api = await interceptarApi(page);
    await irAlPaso5(page);
    await page.locator('#f-prefijo').selectOption('351');
    await page.locator('#f-telefono').fill('912 345 678');
    await botonEnviar(page).click();
    await expect.poll(() => api.cuerpos.length).toBe(1);
    expect(api.cuerpos[0].telefono).toBe('+351912345678');
  });

  test('pegado con +33: detecta el prefijo y no lo duplica', async ({ page }) => {
    const api = await interceptarApi(page);
    await irAlPaso5(page);
    await page.locator('#f-telefono').fill('+33 6 12 34 56 78');
    await expect(page.locator('#f-prefijo')).toHaveValue('33');
    await expect(page.locator('#f-telefono')).toHaveValue('612345678');
    await botonEnviar(page).click();
    await expect.poll(() => api.cuerpos.length).toBe(1);
    expect(api.cuerpos[0].telefono).toBe('+33612345678');
  });

  test('uno demasiado corto con otro prefijo se rechaza', async ({ page }) => {
    const api = await interceptarApi(page);
    await irAlPaso5(page);
    await page.locator('#f-prefijo').selectOption('351');
    await page.locator('#f-telefono').fill('123');
    await botonEnviar(page).click();
    await expect(alerta(page)).toContainText('6 a 14 cifras');
    expect(api.cuerpos).toHaveLength(0);
  });

  test('"Otro": prefijo escrito a mano', async ({ page }) => {
    const api = await interceptarApi(page);
    await irAlPaso5(page);
    await page.locator('#f-prefijo').selectOption('otro');
    await page.locator('#f-prefijo-otro').fill('353');
    await page.locator('#f-telefono').fill('851234567');
    await botonEnviar(page).click();
    await expect.poll(() => api.cuerpos.length).toBe(1);
    expect(api.cuerpos[0].telefono).toBe('+353851234567');
  });
});

test('texto del botón final y aviso de privacidad', async ({ page, isMobile }) => {
  for (const [id, v] of [['#f-modelo', 'Seat León'], ['#f-anio', '2015'], ['#f-motor', '2.0 TDI'], ['#f-potencia', '150']]) {
    await page.locator(id).fill(v);
    await page.locator(id).press('Enter');
  }
  // innerText: el texto que se ve (el otro va oculto con CSS según el dispositivo).
  await expect(botonEnviar(page)).toHaveText(isMobile ? 'Enviar y abrir WhatsApp' : 'Enviar', { useInnerText: true });
  await expect(page.locator('#presupuesto form')).toContainText(
    'Al enviar aceptas la política de privacidad y que VDN Performance te contacte sobre tu solicitud.',
  );
  await expect(page.locator('#presupuesto input[type="checkbox"]')).toHaveCount(0);
});
