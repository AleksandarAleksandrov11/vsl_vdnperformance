/**
 * shots.mjs — capturas de revisión y comprobaciones automáticas de maquetado.
 *
 * Recorre la web servida en local a los anchos que importan (360, 390, 430 y
 * escritorio), guarda capturas y avisa de:
 *   · scroll horizontal,
 *   · elementos que se salen por el lado derecho,
 *   · botones o enlaces por debajo de 44 px de alto,
 *   · errores de consola.
 *
 *   node scripts/shots.mjs [url] [carpeta]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const OUT = process.argv[3] ?? '/tmp/shots';

const ANCHOS = [
  { nombre: '360', width: 360, height: 800, movil: true },
  { nombre: '390', width: 390, height: 844, movil: true },
  { nombre: '430', width: 430, height: 932, movil: true },
  { nombre: '768', width: 768, height: 1024, movil: false },
  { nombre: '1440', width: 1440, height: 900, movil: false },
];

const RUTAS = ['/', '/aviso-legal/', '/politica-privacidad/', '/politica-cookies/'];

/* Se ejecuta dentro de la página. */
function auditoria() {
  const doc = document.documentElement;
  const problemas = [];

  if (doc.scrollWidth > doc.clientWidth + 1) {
    problemas.push('SCROLL HORIZONTAL: scrollWidth ' + doc.scrollWidth + ' > ' + doc.clientWidth);
  }

  /* Un elemento puede salirse de la pantalla sin que eso sea un fallo si algún
     antepasado lo recorta (marquee, carrusel de reseñas, tabla con scroll).
     Esos se ignoran: lo que importa es lo que desborda de verdad. */
  const recortado = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p);
      if (/hidden|clip|auto|scroll/.test(o.overflowX + o.overflow)) return true;
    }
    return false;
  };

  const limite = doc.clientWidth;
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if ((r.right > limite + 1.5 || r.left < -1.5) && !recortado(el)) {
      const id =
        el.tagName.toLowerCase() +
        (el.className && typeof el.className === 'string'
          ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
          : '');
      problemas.push('DESBORDA ' + id + ' left=' + r.left.toFixed(0) + ' right=' + r.right.toFixed(0));
    }
  }

  /* Tamaño de diana: sólo en lo que se comporta como botón (tiene fondo o
     borde propio). Un enlace dentro de una frase no cuenta, y forzarlo a 48 px
     rompería la línea de texto. */
  for (const el of document.querySelectorAll('a, button, [role="switch"]')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (cs.display === 'inline' && !el.style.minHeight) continue;
    const tieneFondo =
      cs.backgroundImage !== 'none' ||
      (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') ||
      parseFloat(cs.borderTopWidth) > 0;
    if (!tieneFondo) continue;
    const r = el.getBoundingClientRect();
    if (r.height === 0 || r.width === 0) continue;
    if (r.height < 44) {
      problemas.push(
        'DIANA PEQUEÑA ' + r.height.toFixed(0) + 'px: "' +
        (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40) + '"',
      );
    }
  }

  /* Solape entre la barra inferior fija y el botón flotante de WhatsApp. */
  const wa = document.querySelector('a[aria-label="Escríbenos por WhatsApp"]');
  const barra = document.querySelector('.safe-b.safe-x.fixed');
  if (wa && barra) {
    const a = wa.getBoundingClientRect();
    const b = barra.getBoundingClientRect();
    const visible = getComputedStyle(wa).opacity !== '0' && b.top < window.innerHeight;
    if (visible && a.bottom > b.top + 1 && a.right > b.left && a.left < b.right) {
      problemas.push('SOLAPE: el botón de WhatsApp pisa la barra inferior');
    }
  }

  return [...new Set(problemas)];
}

async function main() {
  await mkdir(OUT, { recursive: true });
  // El contenedor ya trae Chromium instalado; se usa ése en vez de descargar otro.
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });
  let fallos = 0;

  for (const v of ANCHOS) {
    const ctx = await browser.newContext({
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: 2,
      isMobile: v.movil,
      hasTouch: v.movil,
      locale: 'es-ES',
    });

    for (const ruta of RUTAS) {
      // Las páginas legales sólo se revisan a un ancho de móvil y otro de escritorio.
      if (ruta !== '/' && !['360', '1440'].includes(v.nombre)) continue;

      const page = await ctx.newPage();
      const errores = [];
      page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
      page.on('pageerror', (e) => errores.push('PAGEERROR ' + e.message));

      await page.goto(BASE + ruta, { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);

      const slug = ruta === '/' ? 'home' : ruta.replaceAll('/', '');
      await page.screenshot({ path: `${OUT}/${slug}-${v.nombre}-top.png` });

      // Recorrido completo para disparar las animaciones de entrada.
      await page.evaluate(async () => {
        const alto = document.documentElement.scrollHeight;
        for (let y = 0; y < alto; y += window.innerHeight * 0.8) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 110));
        }
      });
      await page.waitForTimeout(700);

      const problemas = await page.evaluate(auditoria);
      await page.screenshot({ path: `${OUT}/${slug}-${v.nombre}-full.png`, fullPage: true });

      if (problemas.length || errores.length) {
        fallos += problemas.length + errores.length;
        console.log(`\n✗ ${ruta} @ ${v.nombre}px`);
        problemas.forEach((p) => console.log('   ' + p));
        errores.forEach((e) => console.log('   CONSOLA: ' + e.slice(0, 160)));
      } else {
        console.log(`✓ ${ruta} @ ${v.nombre}px`);
      }
      await page.close();
    }
    await ctx.close();
  }

  await browser.close();
  console.log(fallos ? `\n${fallos} avisos.` : '\nSin avisos.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
