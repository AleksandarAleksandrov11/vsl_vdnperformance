# vsl.vdnperformance.es

Landing de captación para **VDN Performance** (reprogramación de centralitas,
Collado Villalba). El tráfico llega de anuncios de Meta Ads y casi todo entra
desde el móvil, así que está diseñada primero para móvil.

Un único objetivo: que la persona rellene el formulario o escriba por WhatsApp.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion
- **Salida:** exportación estática (`output: 'export'`) → carpeta `out/`
- **Rutas:** `/`, `/aviso-legal`, `/politica-privacidad`, `/politica-cookies`

---

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # genera out/
npm start          # sirve out/ en local, tal cual se verá en producción
```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run assets` | Regenera las imágenes de `/public/img` desde `assets-src/` |
| `npm run typecheck` | TypeScript sin emitir |
| `node scripts/shots.mjs <url>` | Capturas a 360/390/430/768/1440 y avisos de maquetado |
| `node scripts/test-form.mjs <url>` | Recorrido completo del formulario |
| `node scripts/test-motion.mjs <url>` | Comprueba `prefers-reduced-motion` |
| `python3 scripts/build_brand.py` | Regenera logo, favicons, iconos y la imagen Open Graph |

Los scripts de prueba necesitan un servidor levantado (`npm start`) y usan el
Chromium del sistema; con otra ruta, `CHROMIUM_PATH=/ruta/al/chrome`.

---

## Dónde está cada cosa

```
assets-src/              Fotos y logo originales. NO se despliegan.
public/img/              Imágenes generadas (AVIF + WebP + JPEG de respaldo).
scripts/
  build-assets.mjs       Recorte, difuminado de matrículas y export multi-ancho.
  build_brand.py         Logo con transparencia, favicons, iconos PWA y OG.
  shots.mjs              Auditoría visual y de maquetado.
  test-form.mjs          Prueba de extremo a extremo del formulario.
  test-motion.mjs        Prueba de accesibilidad del movimiento.
src/
  app/                   Rutas, metadatos, iconos y hoja de estilos global.
  components/            Secciones de la página y piezas compartidas.
  lib/
    config.ts            Teléfono, dirección, precios, webhook, ID del píxel.
    content.ts           Todos los textos: servicios, reseñas, FAQ, trabajos.
    tracking.ts          Toda la medición de Meta, en un solo archivo.
    consent.ts           Consentimiento de cookies.
    leads.ts             Captura de UTM y envío a Google Sheets.
    images.generated.ts  Generado por build-assets.mjs. No se edita a mano.
```

### Cambios habituales

- **Teléfono, dirección, precio, horario** → `src/lib/config.ts`
- **Textos, reseñas, preguntas frecuentes, servicios** → `src/lib/content.ts`
- **Fotos** → deja el original en `assets-src/`, añádelo a `JOBS` en
  `scripts/build-assets.mjs` (con la caja de su matrícula en `PLATES`) y lanza
  `npm run assets`

---

## Formulario y leads

Cinco pantallas, una pregunta en cada una. Al enviar:

1. Se hace `POST` al Apps Script (`SHEETS_WEBHOOK_URL` en `config.ts`) con
   `mode: 'no-cors'` y `URLSearchParams`. Sin JSON ni cabeceras propias: Apps
   Script lee `e.parameter` y así no hay CORS.
2. Campos que se envían: `nombre`, `telefono`, `modelo`, `anio`, `motor`,
   `potencia`, `utm_source`, `utm_campaign`, `utm_content`, `event_id`,
   `website`.
3. La pantalla final se muestra siempre, incluso si falla la red: la respuesta
   con `no-cors` es opaca y no se puede saber si la hoja lo guardó. Si algo ha
   ido mal, el botón de WhatsApp de esa pantalla recupera el contacto.

`event_id` es un UUID que se manda a la vez a la hoja y al evento `Lead` del
píxel. Sirve para conectar la API de Conversiones desde el servidor sin que las
conversiones se cuenten dos veces.

## Medición

Todo pasa por `src/lib/tracking.ts`. **El píxel de Meta no se carga hasta que el
usuario acepta las cookies de marketing.** Si acepta más tarde, se carga en ese
momento y se envían los eventos que hubieran quedado en cola.

| Momento | Evento |
|---|---|
| Carga de la página (con consentimiento) | `PageView` |
| Responde la primera pregunta | `FormStart` (personalizado) |
| Clic en WhatsApp o en el teléfono | `Contact` |
| Formulario enviado | `Lead` · 219 € · EUR · con `eventID` |

---

## Despliegue en Vercel

### 1. Crear el proyecto

1. Sube el repositorio a GitHub.
2. En Vercel, **Add New → Project** e importa el repositorio.
3. Vercel detecta Next.js solo. Deja los valores por defecto:
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Output directory: *(vacío; con `output: 'export'` Vercel sirve `out/`)*
   - Install command: `npm install`
4. No hace falta ninguna variable de entorno.
5. **Deploy**.

### 2. Conectar vsl.vdnperformance.es

1. En el proyecto: **Settings → Domains → Add**.
2. Escribe `vsl.vdnperformance.es` y confirma.
3. Vercel pedirá un registro **CNAME** en el DNS de `vdnperformance.es`:

   | Tipo | Nombre | Valor |
   |---|---|---|
   | CNAME | `vsl` | `cname.vercel-dns.com` |

   Créalo en el panel del proveedor donde esté el dominio (donde ya apunta
   `vdnperformance.es`). Sólo se toca el subdominio `vsl`: **la web principal no
   se ve afectada.**
4. La propagación suele tardar de unos minutos a un par de horas. Cuando Vercel
   marque el dominio en verde, emite el certificado HTTPS automáticamente.
5. Comprueba que `https://vsl.vdnperformance.es` carga y que el formulario
   escribe en la hoja de cálculo.

### 3. Después de publicar

- **Meta Ads:** usa la URL con parámetros, por ejemplo
  `https://vsl.vdnperformance.es/?utm_source=facebook&utm_campaign=stage1&utm_content=video-e46`.
  Esos valores llegan a la hoja con cada lead.
- **Píxel:** en el Administrador de eventos de Meta, comprueba que llegan
  `PageView`, `FormStart`, `Contact` y `Lead`. Recuerda **aceptar las cookies**
  al probarlo: sin consentimiento el píxel no se carga, y eso es lo correcto.
- **Cabeceras:** `vercel.json` fija el cacheo de las imágenes y unas cabeceras
  de seguridad básicas.

---

## Decisiones que conviene conocer

- **Las matrículas van difuminadas.** Son datos personales de terceros y la web
  lleva su propia política de privacidad. Se difuminan en `build-assets.mjs`, no
  a mano, así que se mantienen aunque se regeneren las imágenes. Los metadatos
  EXIF (incluida la geolocalización) se eliminan en el mismo paso.
- **Los originales viven fuera de `public/`.** Son 51 MB que no pinta nada
  subir a Vercel en cada despliegue.
- **La entrada del hero se anima sólo con `transform`, sin fundido.** Chrome
  descarta para siempre como candidato a LCP cualquier elemento que en su primer
  pintado tuviera `opacity: 0`. Con fundido, el LCP se iba al último elemento en
  aparecer y la nota de rendimiento caía en picado.
- **Toda la página lleva `noindex`.** Es lo que pide el encargo, para no
  competir en Google con vdnperformance.es. Tiene un efecto secundario: la
  categoría SEO de Lighthouse no puede pasar de **69**, porque la auditoría
  `is-crawlable` pesa 4 de los ~13 puntos del total. Todas las demás
  auditorías de SEO pasan. Si algún día se quiere indexar, basta con quitar el
  bloque `robots` de `src/app/layout.tsx` y ajustar `public/robots.txt`.
- **Los textos legales son una base, no asesoramiento jurídico.** Están
  redactados con los datos del titular y marcados con `TODO (legal)` en cada
  página. Conviene que el titular o su asesoría los revisen antes de publicar.
