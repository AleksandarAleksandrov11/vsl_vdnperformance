/**
 * Aviso de cookies: Aceptar y Rechazar con el mismo tamaño y estilo, y sin
 * tapar el botón principal del hero.
 */
import { expect, test } from './support/fixtures';

test('Aceptar y Rechazar miden y pesan lo mismo, y el aviso no tapa el CTA', async ({ page, isMobile }) => {
  for (const q of ['', '?utm_campaign=cerrar']) {
    await page.goto(`/${q}`);
    const aviso = page.getByRole('region', { name: 'Aviso de cookies' });
    await expect(aviso).toBeVisible();
    const r = await page.evaluate(() => {
      const av = document.querySelector('[aria-label="Aviso de cookies"]')!;
      const [a, rz] = ['Aceptar', 'Rechazar'].map((t) => [...av.querySelectorAll('button')].find((b) => b.textContent === t)!);
      const caja = (b: Element) => b.getBoundingClientRect();
      return {
        clases: a.className === rz.className,
        ancho: [Math.round(caja(a).width), Math.round(caja(rz).width)],
        alto: [Math.round(caja(a).height), Math.round(caja(rz).height)],
        ctaFin: document.querySelector('#top a[data-cta]')!.getBoundingClientRect().bottom,
        avisoTop: av.getBoundingClientRect().top,
      };
    });
    expect(r.clases).toBe(true);
    expect(r.ancho[0]).toBe(r.ancho[1]);
    expect(r.alto[0]).toBe(r.alto[1]);
    if (isMobile) expect(r.alto[0]).toBeGreaterThanOrEqual(44);
    expect(r.ctaFin, `CTA (${q || 'sin UTM'})`).toBeLessThanOrEqual(r.avisoTop);
  }
});
