/**
 * test-form.mjs — recorrido completo del formulario en un móvil simulado.
 *
 * Comprueba lo que no se ve en una captura: que el cuentarrevoluciones avanza,
 * que Enter pasa de pregunta, que "No lo sé" guarda el valor correcto, que la
 * validación salta cuando toca, que el envío llega al webhook con los campos
 * exactos y que el mensaje de WhatsApp final se arma bien.
 *
 *   node scripts/test-form.mjs [url]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const CHROMIUM = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let fallos = 0;
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} ${msg}${extra ? ' — ' + extra : ''}`);
  if (!cond) fallos++;
};

async function main() {
  const browser = await chromium.launch({ executablePath: CHROMIUM });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    locale: 'es-ES',
  });
  const page = await ctx.newPage();

  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));

  // Se intercepta el webhook: no queremos escribir en la hoja de verdad.
  let envio = null;
  await page.route('**/script.google.com/**', async (route) => {
    envio = route.request().postData();
    await route.fulfill({ status: 200, body: '' });
  });

  // Lo mismo con el píxel, para poder ver qué eventos se dispararían.
  await page.route('**/connect.facebook.net/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );

  /* --- Con UTM en la URL, como llegaría desde un anuncio de Meta --- */
  await page.goto(
    `${BASE}/?utm_source=facebook&utm_campaign=stage1-villalba&utm_content=video-e46`,
    { waitUntil: 'networkidle' },
  );

  /* --- Sin consentimiento no debe cargarse nada de Meta --- */
  await page.waitForTimeout(1400);
  const pixelAntes = await page.evaluate(() =>
    [...document.scripts].some((s) => s.src.includes('facebook')),
  );
  ok(!pixelAntes, 'Sin decisión de cookies, el píxel de Meta no se carga');

  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
  await page.waitForTimeout(500);
  const pixelDespues = await page.evaluate(() =>
    [...document.scripts].some((s) => s.src.includes('facebook')),
  );
  ok(pixelDespues, 'Al aceptar, el píxel se carga en ese momento');

  /* --- El CTA del hero baja al formulario --- */
  await page.getByRole('link', { name: /Calcula cuánto gana tu coche/ }).click();
  await page.waitForTimeout(900);
  const enVista = await page.evaluate(() => {
    const r = document.getElementById('presupuesto').getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });
  ok(enVista, 'El CTA principal lleva al formulario');

  /* --- Paso 1: validación y avance --- */
  await page.locator('#f-modelo').fill('A');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.waitForTimeout(300);
  ok(
    (await page.locator("#presupuesto [role=\"alert\"]").innerText()).includes('marca'),
    'Con menos de 2 caracteres, el paso 1 avisa',
  );

  await page.locator('#f-modelo').fill('BMW Serie 3');
  await page.locator('#f-modelo').press('Enter'); // Enter avanza
  await page.waitForTimeout(500);
  ok(await page.locator('#f-anio').isVisible(), 'Enter pasa a la pregunta siguiente');
  ok(
    (await page.locator('text=/\\bde 5\\b/').innerText()).startsWith('2'),
    'El cuentarrevoluciones marca 2 de 5',
  );

  /* --- Paso 2: rango de años --- */
  await page.locator('#f-anio').fill('1975');
  await page.locator('#f-anio').press('Enter');
  await page.waitForTimeout(300);
  ok(
    (await page.locator("#presupuesto [role=\"alert\"]").innerText()).includes('1990'),
    'Un año fuera de rango se rechaza',
  );
  const soloDigitos = await page.evaluate(() => {
    const i = document.getElementById('f-anio');
    return i.getAttribute('inputmode') === 'numeric' && i.getAttribute('maxlength') === '4';
  });
  ok(soloDigitos, 'El campo de año es numérico y de 4 dígitos');

  await page.locator('#f-anio').fill('2016');
  await page.locator('#f-anio').press('Enter');
  await page.waitForTimeout(500);

  /* --- Paso 3: "No lo sé" --- */
  ok(await page.locator('#f-motor').isVisible(), 'Paso 3 en pantalla');
  await page.getByRole('button', { name: 'No lo sé' }).click();
  await page.waitForTimeout(500);

  /* --- Paso 4: sufijo CV y "No lo sé" --- */
  ok(await page.locator('#f-potencia').isVisible(), 'Paso 4 en pantalla');
  ok(await page.locator('text=CV').first().isVisible(), 'El campo de potencia muestra el sufijo CV');
  await page.locator('#f-potencia').fill('150');
  await page.locator('#f-potencia').press('Enter');
  await page.waitForTimeout(500);

  /* --- Volver atrás no debe dejar un campo vacío con "No lo sabe" dentro --- */
  await page.getByRole('button', { name: 'Atrás' }).click();
  await page.waitForTimeout(450);
  ok((await page.locator('#f-potencia').inputValue()) === '150', 'Atrás conserva lo contestado');
  await page.locator('#f-potencia').press('Enter');
  await page.waitForTimeout(500);

  /* --- Paso 5: nombre y teléfono --- */
  ok(await page.locator('#f-nombre').isVisible(), 'Paso 5 pide nombre y teléfono juntos');
  await page.locator('#f-nombre').fill('Diego');
  await page.locator('#f-telefono').fill('123');
  await page.getByRole('button', { name: 'Quiero mi presupuesto gratis' }).click();
  await page.waitForTimeout(300);
  ok(
    (await page.locator("#presupuesto [role=\"alert\"]").innerText()).includes('9 cifras'),
    'Un teléfono que no es español se rechaza',
  );

  // Con espacios y prefijo +34, como lo escribe mucha gente.
  await page.locator('#f-telefono').fill('+34 611 22 33 44');
  await page.getByRole('button', { name: 'Quiero mi presupuesto gratis' }).click();
  await page.waitForTimeout(1400);

  /* --- Pantalla final --- */
  const final = await page.locator('text=/¡Listo, Diego!/').isVisible();
  ok(final, 'Se muestra la pantalla final con el nombre');

  /* --- Lo que se manda a la hoja --- */
  ok(!!envio, 'El formulario envía al webhook de Google');
  if (envio) {
    const p = new URLSearchParams(envio);
    const esperado = {
      nombre: 'Diego',
      telefono: '611223344',
      modelo: 'BMW Serie 3',
      anio: '2016',
      motor: 'No lo sabe',
      potencia: '150',
      utm_source: 'facebook',
      utm_campaign: 'stage1-villalba',
      utm_content: 'video-e46',
      website: '',
    };
    for (const [k, v] of Object.entries(esperado)) {
      ok(p.get(k) === v, `Campo ${k}`, `"${p.get(k)}"`);
    }
    ok(/^[0-9a-f-]{20,}$/i.test(p.get('event_id') ?? ''), 'event_id es un UUID', p.get('event_id'));
    const campos = [...p.keys()].sort().join(',');
    ok(
      campos === 'anio,event_id,modelo,motor,nombre,potencia,telefono,utm_campaign,utm_content,utm_source,website',
      'No se manda ningún campo de más',
      campos,
    );
  }

  /* --- Mensaje de WhatsApp de la pantalla final --- */
  // El de dentro del formulario, no el botón flotante ni el del pie.
  const wa = await page
    .locator('#presupuesto a[href*="wa.me"]')
    .first()
    .getAttribute('href');
  const texto = decodeURIComponent(new URL(wa).searchParams.get('text') ?? '');
  ok(texto.includes('soy Diego'), 'El mensaje de WhatsApp lleva el nombre');
  ok(texto.includes('BMW Serie 3 de 2016'), 'Lleva coche y año');
  ok(texto.includes('150 CV de serie'), 'Lleva la potencia');
  ok(!texto.includes('No lo sabe'), 'Omite el motor porque no lo sabía', texto);

  await page.screenshot({ path: '/tmp/form-final.png' });

  ok(errores.length === 0, 'Sin errores de consola', errores.join(' | ').slice(0, 200));

  await browser.close();
  console.log(fallos ? `\n${fallos} comprobaciones fallidas.` : '\nTodo correcto.');
  process.exit(fallos ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
