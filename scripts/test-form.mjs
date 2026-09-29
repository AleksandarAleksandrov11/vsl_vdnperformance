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
  let envioEn = 0;
  await page.route('**/script.google.com/**', async (route) => {
    if (route.request().method() === 'POST') {
      envio = route.request().postData();
      envioEn = Date.now();
    }
    await route.fulfill({ status: 200, body: '' });
  });

  // WhatsApp tampoco sale a internet: basta con ver qué se abriría.
  await ctx.route('https://wa.me/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<p>wa</p>' }),
  );

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
  await page.getByRole('link', { name: /Calcular mi coche/ }).first().click();
  await page.waitForTimeout(900);
  const enVista = await page.evaluate(() => {
    const r = document.getElementById('presupuesto').getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });
  ok(enVista, 'El CTA principal lleva al formulario');

  /* --- Paso 1: validación y avance --- */
  await page.locator('#f-modelo').fill('A');
  await page.getByRole('button', { name: 'Continuar' }).click();
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
    (await page.locator('#presupuesto .num').first().innerText()).startsWith('2'),
    'La barra de progreso marca el paso 2 de 5',
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
  await page.getByRole('button', { name: 'Recibir mi precio' }).click();
  await page.waitForTimeout(300);
  ok(
    (await page.locator("#presupuesto [role=\"alert\"]").innerText()).includes('9 cifras'),
    'Un teléfono que no es español se rechaza',
  );

  // Con espacios y prefijo +34, como lo escribe mucha gente.
  await page.locator('#f-telefono').fill('+34 611 22 33 44');
  let whatsappEn = 0;
  const ventanaWhatsapp = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
  page.once('popup', () => { whatsappEn = Date.now(); });
  await page.getByRole('button', { name: 'Recibir mi precio' }).click();
  const popup = await ventanaWhatsapp;
  if (popup) await popup.waitForLoadState();
  await page.waitForTimeout(1400);

  /* --- Pantalla final --- */
  const final = await page.locator('text=/Listo, Diego\\./').isVisible();
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
      objetivo: '150',
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
      campos === 'anio,event_id,modelo,motor,nombre,objetivo,potencia,telefono,utm_campaign,utm_content,utm_source,website',
      'No se manda ningún campo de más',
      campos,
    );
  }

  /* --- WhatsApp se abre solo al enviar, con el mensaje escrito --- */
  // El motor se contestó con "No lo sé": esa línea no aparece.
  const MENSAJE = [
    'Hola, soy Diego. Estos son los datos de mi coche:',
    '',
    'Marca y modelo: BMW Serie 3',
    'Año: 2016',
    'Potencia de serie: 150 CV',
    '',
    '¿Cuánto le puedo sacar con una buena repro?',
  ].join('\n');

  ok(!!popup, 'Al enviar, se abre WhatsApp solo');
  if (popup) {
    const url = new URL(popup.url());
    ok(url.host === 'wa.me' && url.pathname === '/34711523484', 'Al número de VDN', url.host + url.pathname);
    const texto = url.searchParams.get('text') ?? '';
    ok(texto === MENSAJE, 'Con el mensaje exacto', JSON.stringify(texto));
    ok(!/\p{Extended_Pictographic}/u.test(texto), 'Sin emojis');
    ok(envioEn > 0 && envioEn <= whatsappEn, 'La hoja recibe el presupuesto antes de que se abra WhatsApp',
      `${whatsappEn - envioEn} ms antes`);
    await popup.close();
  }
  const conversion = await page.evaluate(() =>
    (window.fbq?.queue ?? []).some((a) => a[0] === 'track' && a[1] === 'Lead'),
  );
  ok(conversion, 'La conversión Lead del píxel se registra');

  /* --- El botón de la pantalla final lleva el mismo mensaje --- */
  // El de dentro del formulario, no el botón flotante ni el del pie.
  const wa = await page
    .locator('#presupuesto a[href*="wa.me"]')
    .first()
    .getAttribute('href');
  ok(new URL(wa).searchParams.get('text') === MENSAJE, 'El botón "Enviar por WhatsApp" repite el mensaje');

  await page.screenshot({ path: '/tmp/form-final.png' });

  /* --- Pedir otro presupuesto deja el formulario en blanco --- */
  await page.getByRole('button', { name: 'Pedir otro presupuesto' }).click();
  await page.waitForTimeout(700);
  ok(await page.locator('#f-modelo').isVisible(), 'Se puede empezar otro presupuesto');
  ok((await page.locator('#f-modelo').inputValue()) === '', 'El formulario vuelve en blanco');

  ok(errores.length === 0, 'Sin errores de consola', errores.join(' | ').slice(0, 200));

  /* --- Navegador que no deja abrir pestañas nuevas --- */
  // Pasa en algunos navegadores de dentro de apps: window.open no hace nada.
  // WhatsApp se tiene que abrir igualmente, en la misma pestaña, y la hoja
  // tiene que recibir el presupuesto antes.
  {
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'es-ES' });
    await ctx2.addInitScript(() => { window.open = () => null; });
    const p2 = await ctx2.newPage();
    let envio2En = 0;
    await p2.route('**/script.google.com/**', async (route) => {
      if (route.request().method() === 'POST') envio2En = Date.now();
      await route.fulfill({ status: 200, body: '' });
    });
    await ctx2.route('https://wa.me/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<p>wa</p>' }),
    );
    await p2.goto(BASE, { waitUntil: 'networkidle' });
    await p2.waitForTimeout(1400);
    await p2.getByRole('button', { name: 'Rechazar', exact: true }).click();
    await p2.getByRole('link', { name: /Calcular mi coche/ }).first().click();
    await p2.waitForTimeout(900);
    for (const [id, valor] of [['#f-modelo', 'Seat León'], ['#f-anio', '2019'], ['#f-motor', '1.5 TSI'], ['#f-potencia', '150']]) {
      await p2.locator(id).fill(valor);
      await p2.locator(id).press('Enter');
      await p2.waitForTimeout(550);
    }
    await p2.locator('#f-nombre').fill('Laura');
    await p2.locator('#f-telefono').fill('622334455');
    await p2.getByRole('button', { name: 'Recibir mi precio' }).click();
    let navegoEn = 0;
    try {
      await p2.waitForURL(/wa\.me/, { timeout: 5000 });
      navegoEn = Date.now();
    } catch {}
    ok(navegoEn > 0, 'Sin pestañas nuevas, WhatsApp se abre en la misma');
    const texto2 = navegoEn ? new URL(p2.url()).searchParams.get('text') ?? '' : '';
    ok(texto2.startsWith('Hola, soy Laura.') && texto2.includes('Motor: 1.5 TSI'), 'Con el mensaje de esa persona', JSON.stringify(texto2.slice(0, 60)));
    ok(envio2En > 0 && envio2En <= navegoEn, 'y la hoja recibe el presupuesto antes');
    await ctx2.close();
  }

  await browser.close();
  console.log(fallos ? `\n${fallos} comprobaciones fallidas.` : '\nTodo correcto.');
  process.exit(fallos ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
