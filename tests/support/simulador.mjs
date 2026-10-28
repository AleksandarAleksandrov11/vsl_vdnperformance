/**
 * simulador.mjs: hace de Apps Script (la hoja) y de Graph API (la CAPI) en
 * las pruebas. Nada sale a Google ni a Meta.
 *
 *   POST /exec            como el Apps Script: guarda el cuerpo y responde
 *                         {"ok":true}. Según el nombre del lead:
 *                           "NoJson" -> 200 con una página HTML (no es JSON)
 *                           "Caida"  -> 500
 *                           "OkNo"   -> 200 con {"ok":false}
 *                           "Lenta"  -> {"ok":true} a los 25 s
 *   POST /graph/...       como la Graph API: guarda el cuerpo y responde 200.
 *   GET  /__registro      lo recibido hasta ahora, en JSON.
 *   POST /__limpiar       vacía el registro.
 *
 *   node tests/support/simulador.mjs [puerto]
 */
import http from 'node:http';

const PUERTO = Number(process.argv[2] ?? process.env.SIMULADOR_PUERTO ?? 4610);
let registro = [];

http
  .createServer((req, res) => {
    let cuerpo = '';
    req.on('data', (c) => (cuerpo += c));
    req.on('end', () => {
      const url = req.url ?? '/';
      if (url === '/__registro') {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify(registro));
      }
      if (url === '/__limpiar') {
        registro = [];
        res.writeHead(200);
        return res.end('{}');
      }
      registro.push({ t: Date.now(), url, metodo: req.method, cuerpo });
      if (url.startsWith('/exec')) {
        const nombre = new URLSearchParams(cuerpo).get('nombre') ?? '';
        if (nombre.includes('NoJson')) {
          res.writeHead(200, { 'content-type': 'text/html' });
          return res.end('<!DOCTYPE html><html><body>Página de Google</body></html>');
        }
        if (nombre.includes('Caida')) {
          res.writeHead(500, { 'content-type': 'text/html' });
          return res.end('<html><body>Error interno</body></html>');
        }
        if (nombre.includes('OkNo')) {
          res.writeHead(200, { 'content-type': 'application/json' });
          return res.end('{"ok":false}');
        }
        const espera = nombre.includes('Lenta') ? 25_000 : 0;
        return setTimeout(() => {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end('{"ok":true}');
        }, espera);
      }
      if (url.startsWith('/graph/')) {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end('{"events_received":1}');
      }
      res.writeHead(404);
      res.end();
    });
  })
  .listen(PUERTO, '127.0.0.1', () => console.log(`simulador en http://127.0.0.1:${PUERTO}`));
