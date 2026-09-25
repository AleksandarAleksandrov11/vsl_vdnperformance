/**
 * VDN Performance — Apps Script que recibe los leads de la landing y los
 * escribe en la pestaña "Leads".
 *
 * Cómo instalarlo
 * ---------------
 * 1. Abre la hoja → Extensiones → Apps Script.
 * 2. Borra lo que haya y pega este archivo entero. Guarda.
 * 3. Implementar → Gestionar implementaciones → lápiz de la implementación
 *    activa → Versión: "Nueva versión" → Implementar.
 *    Así la URL /exec sigue siendo la misma y la web sigue escribiendo aquí.
 *    NO uses "Nueva implementación": crea otra URL y la web dejaría de
 *    escribir en la hoja.
 *
 * Qué hace
 * --------
 * · Busca cada valor por el nombre de la cabecera: las columnas se pueden
 *   mover, renombrar o añadir sin tocar el código.
 * · Estado: "X" si el coche es de ANIO_MARCA o más nuevo; "Nuevo" si no.
 * · Teléfono: sale como enlace. Desde el móvil se abre una pantalla con un
 *   botón que llama al cliente (y otro para escribirle por WhatsApp).
 *
 * Por qué el teléfono no enlaza directamente a la llamada
 * -------------------------------------------------------
 * Google Sheets no admite enlaces tel: en una celda: sólo http, https, mailto
 * y poco más. Así que la celda enlaza a este mismo script, que enseña el
 * botón de llamar. Todo se queda dentro de Google; la web no cambia.
 */

var PESTANA = 'Leads';

/** Desde este año, incluido, el Estado sale como "X" en vez de "Nuevo". */
var ANIO_MARCA = 2020;

/**
 * La URL de este mismo script, la que termina en /exec. Es la misma que usa la
 * web para mandar los leads. Si algún día cambia, hay que cambiarla aquí y en
 * la web.
 */
var URL_SCRIPT =
  'https://script.google.com/macros/s/AKfycbz8ORocSTJkqaaKDZ7gyc1cyMm_3kHrqVdbSfuIJOXrKAfHbnbZyilC_gw0_IFJlyAy/exec';

/** Cabecera de la hoja -> nombre del campo que manda la web. */
var COLUMNAS = {
  'Nombre': 'nombre',
  'Teléfono': 'telefono',
  'Marca y modelo': 'modelo',
  'Motor': 'motor',
  'Año': 'anio',
  'Potencia de serie': 'potencia',
  'utm_source': 'utm_source',
  'utm_campaign': 'utm_campaign',
  'utm_content': 'utm_content',
  'event_id': 'event_id',
};

/* ==========================================================================
   Entrada de leads (la web hace POST aquí)
   ========================================================================== */

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Honeypot: si viene relleno es un bot. Se responde bien y no se guarda nada.
  if (p.website) return ok();

  // La web manda la potencia con dos nombres por compatibilidad con el script
  // anterior. Si sólo llegara el viejo, se usa ese.
  if (!p.potencia && p.objetivo) p.potencia = p.objetivo;

  // Dos presupuestos a la vez no deben pisarse la fila: se escriben de uno en uno.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PESTANA);
    var cabeceras = hoja
      .getRange(1, 1, 1, hoja.getLastColumn())
      .getValues()[0]
      .map(function (c) {
        return String(c).trim();
      });
    var tel = normalizarTelefono(p.telefono);

    var valores = cabeceras.map(function (nombre) {
      if (nombre === 'Fecha') return new Date();
      if (nombre === 'Estado') return estado(p.anio);
      if (nombre === 'Teléfono') return tel ? tel.texto : p.telefono || '';
      var campo = COLUMNAS[nombre];
      return campo && p[campo] ? p[campo] : '';
    });

    var fila = hoja.getLastRow() + 1;
    hoja.getRange(fila, 1, 1, valores.length).setValues([valores]);

    // El teléfono se vuelve a escribir, esta vez como texto con enlace.
    var col = cabeceras.indexOf('Teléfono');
    if (col !== -1 && tel) {
      var enlace = SpreadsheetApp.newRichTextValue()
        .setText(tel.texto)
        .setLinkUrl(URL_SCRIPT + '?llamar=' + tel.digitos)
        .build();
      hoja.getRange(fila, col + 1).setRichTextValue(enlace);
    }

    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return ok();
}

/* ==========================================================================
   Pantalla de llamar (se abre al tocar un teléfono de la hoja)
   ========================================================================== */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.llamar) return pantallaLlamar(p.llamar);
  // Sin parámetros sólo responde que está vivo, para poder comprobarlo.
  return ok();
}

function pantallaLlamar(valor) {
  var tel = normalizarTelefono(valor);

  // En el HTML sólo entran cifras y espacios: nada de lo que venga en la URL
  // llega a la página tal cual.
  var cuerpo = tel
    ? '<p class="num">' + tel.texto + '</p>' +
      '<a class="btn" href="tel:+' + tel.digitos + '" target="_top">Llamar</a>' +
      '<a class="btn sec" href="https://wa.me/' + tel.digitos + '" target="_top">WhatsApp</a>'
    : '<p>Este enlace no lleva un teléfono válido.</p>';

  var html =
    '<!doctype html><html lang="es"><head><meta charset="utf-8"><style>' +
    'body{margin:0;background:#050505;color:#f5f5f2;font:16px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    'main{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;box-sizing:border-box;text-align:center}' +
    '.num{margin:0 0 10px;font-size:30px;font-weight:600;letter-spacing:.01em;color:#f5f5f2}' +
    '.btn{display:flex;align-items:center;justify-content:center;width:100%;max-width:320px;min-height:60px;border-radius:999px;background:#1f5cff;color:#fff;font-size:18px;font-weight:600;text-decoration:none}' +
    '.sec{background:transparent;border:1px solid rgba(255,255,255,.2)}' +
    'p{color:#8c8c91}' +
    '</style></head><body><main>' + cuerpo + '</main></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('Llamar')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ==========================================================================
   Ayudas
   ========================================================================== */

/** "X" para coches de ANIO_MARCA en adelante; "Nuevo" para el resto. */
function estado(anio) {
  var n = parseInt(anio, 10);
  return !isNaN(n) && n >= ANIO_MARCA ? 'X' : 'Nuevo';
}

/**
 * Deja el teléfono en dos formas: las cifras con prefijo para los enlaces
 * ("34611223344") y el texto que se lee en la hoja ("611 22 33 44").
 * Acepta el número con o sin +34. Si no parece un teléfono, devuelve null.
 */
function normalizarTelefono(valor) {
  var d = String(valor || '').replace(/\D/g, '');
  if (d.indexOf('0034') === 0) d = d.slice(2);
  if (d.length === 9) d = '34' + d;
  if (d.length < 9 || d.length > 15) return null;

  var texto = /^34\d{9}$/.test(d)
    ? d.slice(2).replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')
    : '+' + d;
  return { digitos: d, texto: texto };
}

function ok() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON,
  );
}
