/**
 * API: eventoLead (sin red) y /api/lead/ contra el simulador de la hoja y de
 * la Graph API. Nada sale a Google ni a Meta.
 */
import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { eventoLead, fbcDe } from '@/lib/capi';
import contrato from './fixtures/payload-hoja.json';

const SIMULADOR = 'http://127.0.0.1:4610';
const sha = (v: string) => createHash('sha256').update(v, 'utf8').digest('hex');

type Recibido = { t: number; url: string; cuerpo: string };
const registro = async (): Promise<Recibido[]> => (await fetch(`${SIMULADOR}/__registro`)).json();
const limpiar = () => fetch(`${SIMULADOR}/__limpiar`, { method: 'POST' });

/** Espera a que llegue a la Graph API simulada un evento (la CAPI va en after()). */
async function esperarCapi(ms = 4000, evento = 'Lead'): Promise<Recibido | undefined> {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    const g = (await registro()).find(
      (r) => r.url.startsWith('/graph/') && JSON.parse(r.cuerpo).data?.[0]?.event_name === evento,
    );
    if (g) return g;
    await new Promise((r) => setTimeout(r, 150));
  }
  return undefined;
}

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Mobile/21F90 Instagram 340.0.0.22.109';

/** Lo que manda el navegador, con los campos para la CAPI. */
const cuerpoNavegador = (extra: Record<string, unknown> = {}) => ({
  nombre: 'Laura Gómez',
  telefono: '611223344',
  modelo: 'Seat León',
  anio: '2015',
  motor: '2.0 TDI',
  potencia: '150',
  event_id: 'evt-api-1',
  website: '',
  utm_source: 'meta',
  utm_campaign: 'cerrar',
  utm_content: 'prueba',
  fbclid: 'PRUEBA123',
  fbclid_ts: '1760000000000',
  fbc: '',
  fbp: 'fb.1.1760000000000.987654321',
  consent_marketing: false,
  event_source_url: 'https://www.vdnperformance.com/',
  ...extra,
});

test.describe('eventoLead (sin red)', () => {
  const base = {
    eventId: 'e1',
    nombre: 'Laura Gómez Ruiz',
    telefono: '611223344',
    url: 'https://www.vdnperformance.com/',
    userAgent: UA,
  };

  test('hashes, país, IP y fbc construido desde fbclid', () => {
    const ev = eventoLead({ ...base, ip: '203.0.113.7', fbclid: 'ABC', fbclidTs: 1760000000000 }, 1760000100000);
    const u = ev.user_data as Record<string, unknown>;
    expect(u.ph).toEqual([sha('34611223344')]);
    expect(u.external_id).toEqual([sha('34611223344')]);
    expect(u.fn).toEqual([sha('laura')]);
    expect(u.ln).toEqual([sha('gómez ruiz')]);
    expect(u.country).toEqual([sha('es')]);
    expect(u.client_ip_address).toBe('203.0.113.7');
    expect(u.client_user_agent).toBe(UA);
    expect(u.fbc).toBe('fb.1.1760000000000.ABC');
    expect(ev.event_id).toBe('e1');
    expect(ev.event_name).toBe('Lead');
  });

  test('sin valor ni moneda', () => {
    const ev = eventoLead(base);
    expect(ev.custom_data).toEqual({ content_name: 'Presupuesto reprogramación' });
    expect(JSON.stringify(ev)).not.toMatch(/"value"|"currency"/);
  });

  test('sin fbc si no hay cookie ni fbclid; la cookie manda sobre el fbclid', () => {
    expect((eventoLead(base).user_data as Record<string, unknown>).fbc).toBeUndefined();
    expect(fbcDe({ fbc: 'fb.1.1700000000000.COOKIE', fbclid: 'OTRO' })).toBe('fb.1.1700000000000.COOKIE');
  });

  test('teléfono extranjero: formato internacional y país del prefijo', () => {
    const u = eventoLead({ ...base, telefono: '+351912345678' }).user_data as Record<string, unknown>;
    expect(u.ph).toEqual([sha('351912345678')]);
    expect(u.country).toEqual([sha('pt')]);
  });
});

test.describe('/api/lead/', () => {
  test.beforeEach(async () => {
    await limpiar();
  });

  test('sin consentimiento también manda la CAPI, con IP, user agent, fbc y fbp', async ({ request }) => {
    const r = await request.post('http://localhost:3000/api/lead/', {
      data: cuerpoNavegador(),
      headers: { 'user-agent': UA, 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
    });
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ ok: true });

    const capi = await esperarCapi();
    expect(capi, 'llega a la Graph API simulada').toBeTruthy();
    expect(capi!.url).toContain('/graph/1264303155893965/events?access_token=token-de-prueba');
    const ev = JSON.parse(capi!.cuerpo).data[0];
    expect(ev.event_id).toBe('evt-api-1');
    expect(ev.user_data.client_ip_address).toBe('203.0.113.7');
    expect(ev.user_data.client_user_agent).toBe(UA);
    expect(ev.user_data.fbc).toBe('fb.1.1760000000000.PRUEBA123');
    expect(ev.user_data.fbp).toBe('fb.1.1760000000000.987654321');
    expect(ev.custom_data.value).toBeUndefined();
  });

  test('el cuerpo hacia la hoja es idéntico al de antes y no lleva nada de la CAPI', async ({ request }) => {
    const r = await request.post('http://localhost:3000/api/lead/', { data: cuerpoNavegador(), headers: { 'user-agent': UA } });
    expect(r.status()).toBe(200);
    const hoja = (await registro()).filter((x) => x.url.startsWith('/exec'));
    expect(hoja).toHaveLength(1);
    expect(hoja[0].cuerpo).toBe(contrato.completo.cuerpo.replace('{EVENT_ID}', 'evt-api-1'));
    expect([...new URLSearchParams(hoja[0].cuerpo).keys()]).toEqual([
      'nombre', 'telefono', 'modelo', 'anio', 'motor', 'potencia', 'event_id',
      'utm_source', 'utm_campaign', 'utm_content', 'objetivo', 'website',
    ]);
  });

  test('sin token no se llama a la CAPI', async ({ request }) => {
    const r = await request.post('http://localhost:3001/api/lead/', { data: cuerpoNavegador(), headers: { 'user-agent': UA } });
    expect(r.status()).toBe(200);
    expect(await esperarCapi(2000)).toBeUndefined();
    expect((await registro()).filter((x) => x.url.startsWith('/exec'))).toHaveLength(1);
  });

  test('hoja caída (5xx): 502 y sin CAPI', async ({ request }) => {
    const r = await request.post('http://localhost:3000/api/lead/', {
      data: cuerpoNavegador({ nombre: 'Caida Prueba' }),
      headers: { 'user-agent': UA },
    });
    expect(r.status()).toBe(502);
    expect(await r.json()).toEqual({ ok: false });
    expect(await esperarCapi(2000)).toBeUndefined();
  });

  test('hoja con JSON sin ok:true: 502 y sin CAPI', async ({ request }) => {
    const r = await request.post('http://localhost:3000/api/lead/', {
      data: cuerpoNavegador({ nombre: 'OkNo Prueba' }),
      headers: { 'user-agent': UA },
    });
    expect(r.status()).toBe(502);
    expect(await esperarCapi(2000)).toBeUndefined();
  });

  test('hoja que responde 2xx pero no JSON: se da por guardado y sale la CAPI', async ({ request }) => {
    const r = await request.post('http://localhost:3000/api/lead/', {
      data: cuerpoNavegador({ nombre: 'NoJson Prueba', event_id: 'evt-nojson' }),
      headers: { 'user-agent': UA },
    });
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    const capi = await esperarCapi();
    expect(JSON.parse(capi!.cuerpo).data[0].event_id).toBe('evt-nojson');
  });

  test('hoja lenta (25 s): se espera y se da por guardado', async ({ request }) => {
    test.setTimeout(60_000);
    const t0 = Date.now();
    const r = await request.post('http://localhost:3000/api/lead/', {
      data: cuerpoNavegador({ nombre: 'Lenta Prueba', event_id: 'evt-lenta' }),
      headers: { 'user-agent': UA },
      timeout: 40_000,
    });
    expect(Date.now() - t0).toBeGreaterThanOrEqual(24_000);
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(JSON.parse((await esperarCapi())!.cuerpo).data[0].event_id).toBe('evt-lenta');
  });

  test('teléfono extranjero: va a la hoja con su prefijo, en el mismo campo', async ({ request }) => {
    const r = await request.post('http://localhost:3000/api/lead/', {
      data: cuerpoNavegador({ telefono: '+351912345678', event_id: 'evt-api-pt' }),
      headers: { 'user-agent': UA },
    });
    expect(r.status()).toBe(200);
    const hoja = (await registro()).find((x) => x.url.startsWith('/exec'))!;
    expect(new URLSearchParams(hoja.cuerpo).get('telefono')).toBe('+351912345678');
    const ev = JSON.parse((await esperarCapi())!.cuerpo).data[0];
    expect(ev.user_data.country).toEqual([sha('pt')]);
  });

  test('datos no válidos y bots', async ({ request }) => {
    const malo = await request.post('http://localhost:3000/api/lead/', { data: cuerpoNavegador({ telefono: '123' }) });
    expect(malo.status()).toBe(400);
    const bot = await request.post('http://localhost:3000/api/lead/', { data: cuerpoNavegador({ website: 'http://spam' }) });
    expect(await bot.json()).toEqual({ ok: true });
    expect(await registro()).toHaveLength(0);
  });
});

test.describe('/api/evento/', () => {
  test.beforeEach(async () => {
    await limpiar();
  });

  const visita = (extra: Record<string, unknown> = {}) =>
    JSON.stringify({
      event_name: 'PageView',
      event_id: 'pv-1',
      event_source_url: 'http://localhost:3000/?utm_source=meta',
      fbc: '',
      fbp: 'fb.1.1760000000000.555',
      fbclid: 'PRUEBA123',
      fbclid_ts: '1760000000000',
      ...extra,
    });
  const cabeceras = { origin: 'http://localhost:3000', 'user-agent': UA, 'content-type': 'text/plain', 'x-forwarded-for': '203.0.113.9' };

  test('PageView: a la CAPI con event_id, URL, IP, user agent, fbp y fbc construido', async ({ request }) => {
    const r = await request.post('http://localhost:3000/api/evento/', { data: visita(), headers: cabeceras });
    expect(r.status()).toBe(204);
    const ev = JSON.parse((await esperarCapi(4000, 'PageView'))!.cuerpo).data[0];
    expect(ev).toMatchObject({ event_name: 'PageView', event_id: 'pv-1', action_source: 'website', event_source_url: 'http://localhost:3000/' });
    expect(ev.user_data).toEqual({
      client_user_agent: UA,
      client_ip_address: '203.0.113.9',
      fbp: 'fb.1.1760000000000.555',
      fbc: 'fb.1.1760000000000.PRUEBA123',
    });
    expect(ev.custom_data).toBeUndefined();
  });

  test('ViewContent: con content_name "Calculadora"', async ({ request }) => {
    await request.post('http://localhost:3000/api/evento/', {
      data: visita({ event_name: 'ViewContent', event_id: 'vc-1' }),
      headers: cabeceras,
    });
    const ev = JSON.parse((await esperarCapi(4000, 'ViewContent'))!.cuerpo).data[0];
    expect(ev.custom_data).toEqual({ content_name: 'Calculadora' });
  });

  test('rechaza otro origen, eventos fuera de la lista y bots', async ({ request }) => {
    const casos = [
      { data: visita(), headers: { ...cabeceras, origin: 'https://otra-web.com' } },
      { data: visita(), headers: { ...cabeceras, origin: '' } },
      { data: visita({ event_name: 'Lead' }), headers: cabeceras },
      { data: visita({ event_name: 'Purchase' }), headers: cabeceras },
      { data: visita(), headers: { ...cabeceras, 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } },
      { data: visita(), headers: { ...cabeceras, 'user-agent': 'facebookexternalhit/1.1' } },
      { data: 'esto no es json', headers: cabeceras },
    ];
    for (const c of casos) {
      const r = await request.post('http://localhost:3000/api/evento/', c);
      expect(r.status()).toBe(204);
    }
    await new Promise((r) => setTimeout(r, 1500));
    expect((await registro()).filter((x) => x.url.startsWith('/graph/'))).toHaveLength(0);
  });

  test('sin token: 204 y no se llama a Meta', async ({ request }) => {
    const r = await request.post('http://localhost:3001/api/evento/', {
      data: visita(),
      headers: { ...cabeceras, origin: 'http://localhost:3001' },
    });
    expect(r.status()).toBe(204);
    await new Promise((r) => setTimeout(r, 1500));
    expect(await registro()).toHaveLength(0);
  });
});
