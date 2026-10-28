/**
 * Fixtures comunes de la suite.
 *
 * En cada página, siempre:
 *  · connect.facebook.net devuelve un fbevents.js vacío: los eventos se quedan
 *    en la cola de fbq y se pueden leer, y nada sale a Meta;
 *  · graph.facebook.com, www.facebook.com y script.google.com se cortan: si
 *    algo intentara llegar a la hoja real o a Meta desde el navegador, la
 *    prueba falla (`salidas` lo apunta);
 *  · wa.me devuelve una página vacía, para ver a dónde se iría sin salir.
 *
 * `eventos` registra cada llamada a fbq con su hora, también la de justo antes
 * de navegar a WhatsApp.
 */
import { test as base, expect, type Page } from '@playwright/test';

export const SIMULADOR = 'http://127.0.0.1:4610';
export const CONSENT_KEY = 'vdn.consent.v1';

export type EventoFbq = { t: number; args: unknown[] };

type Fixtures = {
  eventos: EventoFbq[];
  salidas: string[];
};

export const test = base.extend<Fixtures>({
  salidas: async ({}, usar) => {
    await usar([]);
  },
  eventos: [
    async ({ context, salidas }, usar) => {
    const eventos: EventoFbq[] = [];
    await context.exposeBinding('__registrarFbq', (_o, json: string) => {
      eventos.push({ t: Date.now(), args: JSON.parse(json) });
    });
    /* Envuelve window.fbq en cuanto la web lo crea, conservando su cola. */
    await context.addInitScript(() => {
      let actual: unknown;
      Object.defineProperty(window, 'fbq', {
        configurable: true,
        get: () => actual,
        set(v: ((...a: unknown[]) => void) & Record<string, unknown>) {
          const envuelta = function (this: unknown, ...a: unknown[]) {
            try {
              (window as unknown as { __registrarFbq: (j: string) => void }).__registrarFbq(JSON.stringify(a));
            } catch {
              /* sin enlace: no se registra */
            }
            return v.apply(this, a);
          } as unknown as Record<string, unknown>;
          Object.assign(envuelta, v);
          actual = envuelta;
        },
      });
    });
    await context.route('https://connect.facebook.net/**', (r) =>
      r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
    );
    await context.route(/https:\/\/(graph\.facebook\.com|www\.facebook\.com|script\.google\.com)\//, (r) => {
      salidas.push(r.request().url());
      return r.abort();
    });
    await context.route('https://wa.me/**', (r) =>
      r.fulfill({ status: 200, contentType: 'text/html', body: '<p>wa</p>' }),
    );
    await usar(eventos);
    expect(salidas, 'nada sale del navegador a la hoja ni a Meta').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/* ------------------------------------------------------------------ */

export const eventosDe = (eventos: EventoFbq[], nombre: string) =>
  eventos.filter((e) => e.args[0] === 'track' || e.args[0] === 'trackCustom').filter((e) => e.args[1] === nombre);

/** Deja una decisión de cookies guardada antes de cargar la página. */
export async function decisionGuardada(page: Page, marketing: boolean) {
  await page.addInitScript(
    ([clave, m]) =>
      localStorage.setItem(
        clave as string,
        JSON.stringify({ version: 1, necesarias: true, marketing: m, fecha: '2026-01-01T00:00:00.000Z' }),
      ),
    [CONSENT_KEY, marketing] as const,
  );
}

export type DatosCoche = {
  modelo: string;
  anio: string;
  motor: string | null;
  potencia: string | null;
  nombre: string;
  telefono: string;
};

export const COCHE: DatosCoche = {
  modelo: 'Seat León',
  anio: '2015',
  motor: '2.0 TDI',
  potencia: '150',
  nombre: 'Laura Gómez',
  telefono: '611 22 33 44',
};

/** Contesta los cuatro primeros pasos y rellena nombre y teléfono (sin enviar). */
export async function rellenar(page: Page, d: DatosCoche = COCHE) {
  await page.locator('#presupuesto').scrollIntoViewIfNeeded();
  const pasos: [string, string | null][] = [
    ['#f-modelo', d.modelo],
    ['#f-anio', d.anio],
    ['#f-motor', d.motor],
    ['#f-potencia', d.potencia],
  ];
  for (const [id, v] of pasos) {
    await expect(page.locator(id)).toBeVisible();
    if (v === null) await page.getByRole('button', { name: 'No lo sé' }).click();
    else {
      await page.locator(id).fill(v);
      await page.locator(id).press('Enter');
    }
    await expect(page.locator(id)).toBeHidden();
  }
  await page.locator('#f-nombre').fill(d.nombre);
  await page.locator('#f-telefono').fill(d.telefono);
}

/** Botón de envío del último paso, sea cual sea su texto en móvil o escritorio. */
export const botonEnviar = (page: Page) => page.locator('#presupuesto button[type="submit"]');

/** Simulador: lo recibido hasta ahora y limpieza. */
export async function registro(): Promise<{ t: number; url: string; cuerpo: string }[]> {
  return (await fetch(`${SIMULADOR}/__registro`)).json();
}
export async function limpiarRegistro() {
  await fetch(`${SIMULADOR}/__limpiar`, { method: 'POST' });
}

/** Intercepta /api/lead/ con la respuesta dada y guarda los cuerpos recibidos. */
export async function interceptarApi(page: Page, status = 200, ok = true) {
  const cuerpos: Record<string, unknown>[] = [];
  const horas: number[] = [];
  await page.route('**/api/lead/', async (r) => {
    cuerpos.push(r.request().postDataJSON());
    horas.push(Date.now());
    await r.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ ok }) });
  });
  return { cuerpos, horas };
}
