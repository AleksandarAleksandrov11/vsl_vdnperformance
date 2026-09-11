/**
 * VDN Performance — Apps Script que recibe los leads de vsl.vdnperformance.es
 * y los escribe en la pestaña "Leads".
 *
 * Cómo instalarlo
 * ---------------
 * 1. Abre la hoja → Extensiones → Apps Script.
 * 2. Borra lo que haya y pega este archivo entero.
 * 3. Implementar → Nueva implementación → Aplicación web.
 *    · Ejecutar como: yo.
 *    · Quién tiene acceso: cualquier usuario.
 * 4. Copia la URL que termina en /exec y ponla en SHEETS_WEBHOOK_URL,
 *    en src/lib/config.ts.
 *
 * Por qué este script y no el anterior
 * ------------------------------------
 * El anterior escribía la fila como una lista fija y se había quedado
 * desfasado respecto a las cabeceras: la potencia no se guardaba en ningún
 * sitio y las tres columnas de utm_ y el "Nuevo" caían una columna a la
 * izquierda de su cabecera. Este busca cada valor por el nombre de la
 * cabecera, así que se pueden mover, renombrar o añadir columnas sin tocar
 * el código.
 */

var PESTANA = 'Leads';

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

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Honeypot: si viene relleno es un bot. Se responde bien y no se guarda nada.
  if (p.website) return ok();

  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PESTANA);
  var cabeceras = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];

  var fila = cabeceras.map(function (cabecera) {
    var nombre = String(cabecera).trim();
    if (nombre === 'Fecha') return new Date();
    if (nombre === 'Estado') return 'Nuevo';
    var campo = COLUMNAS[nombre];
    return campo && p[campo] ? p[campo] : '';
  });

  hoja.appendRow(fila);
  return ok();
}

/** Para poder comprobar desde el navegador que la implementación responde. */
function doGet() {
  return ok();
}

function ok() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true }),
  ).setMimeType(ContentService.MimeType.JSON);
}
