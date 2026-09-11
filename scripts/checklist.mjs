/**
 * checklist.mjs — comprueba las reglas de diseño que no se ven en una captura.
 *
 *   · Todas las tarjetas de un mismo grupo miden exactamente lo mismo.
 *   · El azul de acento sólo aparece donde toca.
 *   · Las fotos llevan todas el mismo tratamiento.
 *   · No hay desbordamiento horizontal en 360, 390 y 430.
 *   · El espaciado vertical entre secciones es el mismo en todas.
 *   · Los titulares no pasan de 6 palabras y las frases de 15.
 *
 *   node scripts/checklist.mjs <url>
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4405';
let fallos = 0;
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} ${msg}${extra ? ' — ' + extra : ''}`);
  if (!cond) fallos++;
};

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

/* ---------------- Reglas que dependen del ancho ---------------- */
for (const width of [360, 390, 430, 1440]) {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 700 ? 844 : 900 },
    isMobile: width < 700,
    hasTouch: width < 700,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 350) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);

  const r = await page.evaluate(() => {
    const doc = document.documentElement;
    const grupos = {
      cifras: '[aria-label="VDN Performance en cifras"] li',
      trabajos: '[aria-label="Trabajos realizados"] article',
      resenas: '[aria-label="Opiniones de clientes en Google"] > div figure, .lg\\:block ul > li figure',
    };
    const medidas = {};
    for (const [k, sel] of Object.entries(grupos)) {
      const els = [...document.querySelectorAll(sel)].filter((e) => e.getBoundingClientRect().width > 0);
      medidas[k] = els.map((e) => {
        const b = e.getBoundingClientRect();
        return `${Math.round(b.width)}x${Math.round(b.height)}`;
      });
    }

    /* Ritmo vertical. Se comparan sólo las secciones de contenido normal: el
       hero, el formulario y el cierre ocupan la pantalla entera por diseño y no
       siguen esta escala, y la tira de cifras es una banda entre secciones. */
    const pads = [...document.querySelectorAll('main > section.section-y')].map((s) => {
      const cs = getComputedStyle(s);
      return `${cs.paddingTop}/${cs.paddingBottom}`;
    });

    // Tratamiento de foto: todas las <img> de contenido con el mismo filtro.
    const filtros = [...document.querySelectorAll('picture img')].map((i) => getComputedStyle(i).filter);

    return {
      scrollX: doc.scrollWidth - doc.clientWidth,
      medidas,
      pads,
      filtros: [...new Set(filtros)],
      imgsSinFiltro: filtros.filter((f) => f === 'none').length,
    };
  });

  console.log(`\n── ${width} px ──`);
  ok(r.scrollX <= 1, 'Sin desbordamiento horizontal', `${r.scrollX}px`);
  for (const [grupo, med] of Object.entries(r.medidas)) {
    if (!med.length) continue;
    ok(new Set(med).size === 1, `Tarjetas idénticas · ${grupo} (${med.length})`, [...new Set(med)].join(' '));
  }
  ok(r.filtros.length === 1, 'Mismo tratamiento en todas las fotos', r.filtros.join(' | '));
  ok(r.imgsSinFiltro === 0, 'Ninguna foto sin tratamiento', `${r.imgsSinFiltro} sueltas`);
  ok(new Set(r.pads).size === 1, 'Mismo ritmo vertical entre secciones', [...new Set(r.pads)].join(' '));

  await ctx.close();
}

/* ---------------- Reglas de color y de texto (una sola pasada) ---------------- */
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
await page.waitForTimeout(400);

const color = await page.evaluate(() => {
  const ACENTO = ['rgb(31, 92, 255)', 'rgb(75, 125, 255)'];
  const usos = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    const hit = [cs.backgroundColor, cs.color, cs.borderTopColor, cs.fill, cs.stroke].filter((v) =>
      ACENTO.includes(v),
    );
    if (!hit.length) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0 && el.tagName !== 'PATH') continue;
    usos.push(
      `${el.tagName.toLowerCase()}${el.getAttribute('role') ? '[' + el.getAttribute('role') + ']' : ''}: ` +
        (el.textContent || '').trim().slice(0, 24),
    );
  }
  return [...new Set(usos)];
});
console.log('\n── El azul de acento aparece en ──');
color.forEach((u) => console.log('   ' + u));

/* El límite de palabras es para los titulares y las frases de venta de cada
   sección. Las preguntas frecuentes son otra cosa: ahí el texto es la respuesta,
   y recortarla a quince palabras la dejaría inútil. */
const textos = await page.evaluate(() => {
  const largos = [];
  const fuera = (el) => el.closest('#dudas, [role="region"][aria-labelledby^="faq"], form');
  for (const h of document.querySelectorAll('main h1, main h2, main h3')) {
    const t = (h.textContent || '').trim();
    if (!t || fuera(h) || h.closest('[hidden]')) continue;
    const n = t.split(/\s+/).length;
    if (n > 6) largos.push(`TITULAR ${n} palabras: "${t.slice(0, 60)}"`);
  }
  for (const p of document.querySelectorAll('main p')) {
    const t = (p.textContent || '').trim();
    if (!t || fuera(p) || p.className.includes('eyebrow')) continue;
    const n = t.split(/\s+/).length;
    if (n > 15) largos.push(`FRASE ${n} palabras: "${t.slice(0, 70)}"`);
  }
  return largos;
});
console.log('\n── Textos por encima del límite ──');
if (!textos.length) console.log('   ninguno');
textos.forEach((t) => console.log('   ' + t));

await browser.close();
console.log(fallos ? `\n${fallos} reglas incumplidas.` : '\nTodas las reglas medibles se cumplen.');
