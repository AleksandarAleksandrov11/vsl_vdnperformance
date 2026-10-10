# www.vdnperformance.com

Landing de captación para **VDN Performance** (reprogramación de centralitas,
Collado Villalba). El 90 % del tráfico llega de anuncios de Instagram en móvil,
así que está diseñada primero para móvil.

Un único objetivo: que la persona rellene el formulario o escriba por WhatsApp.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion
- **Salida:** páginas prerenderizadas (estáticas, servidas desde la CDN de Vercel)
  más una función de servidor, `/api/lead/`
- **Rutas:** `/`, `/aviso-legal`, `/politica-privacidad`, `/politica-cookies`

---

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # genera .next/ (npm start lo sirve en :3000)
npm start          # sirve el build en local, tal cual se verá en producción
```

| Comando | Qué hace |
|---|---|
| `npm run assets` | Regenera las imágenes de `/public/img` desde `assets-src/` |
| `npm run typecheck` | TypeScript sin emitir |
| `node scripts/checklist.mjs <url>` | Reglas de diseño: tarjetas iguales, ritmo vertical, uso del azul, límites de texto, desbordamientos |
| `node scripts/secciones.mjs <url> <carpeta> <ancho>` | Una captura por sección al ancho que se le pida |
| `node scripts/shots.mjs <url> <carpeta>` | Auditoría de maquetado y dianas táctiles a varios anchos |
| `node scripts/test-form.mjs <url>` | Recorrido completo del formulario y de los eventos |
| `node scripts/test-motion.mjs <url>` | Comprueba `prefers-reduced-motion` |
| `python3 scripts/build_brand.py` | Regenera logo, favicons, iconos y la imagen Open Graph |

Los scripts de prueba necesitan un servidor levantado (`npm start`) y usan el
Chromium del sistema; con otra ruta, `CHROMIUM_PATH=/ruta/al/chrome`.

---

## Sistema de diseño

Todo sale de `src/app/globals.css`. Si algo no está ahí, no debería existir.

| | |
|---|---|
| Fondo | `#050505` · superficie `#0E0E10` |
| Sección clara | `#F4F4F1` con texto `#0A0A0A` (sólo reseñas y garantía) |
| Texto | `#F5F5F2` · secundario `#8C8C91` |
| Bordes | `rgba(255,255,255,.08)` en oscuro, `rgba(0,0,0,.08)` en claro |
| Acento | `#1F5CFF`, plano |
| Tipografía | Inter Tight, un solo peso por uso: 600 titulares, 400-500 cuerpo |
| Radio | 20 px en tarjetas e imágenes, pastilla en botones |
| Ritmo | 96 px de padding vertical en móvil, 160 px en escritorio |

**El azul sólo aparece en cuatro sitios:** botón principal, pestaña activa de
los stages, barra de progreso del formulario y la curva VDN del gráfico.
`scripts/checklist.mjs` lo comprueba en cada ejecución y lista dónde aparece.

**Todas las tarjetas de un grupo miden lo mismo** por construcción: `aspect-ratio`
fijo en las imágenes, `auto-rows-fr` en las rejillas y `line-clamp` en los textos.
El checklist mide las cajas reales y falla si una se sale un píxel.

---

## Dónde está cada cosa

```
assets-src/              Fotos y logo originales. NO se despliegan.
public/img/              Imágenes generadas (AVIF + WebP + JPEG de respaldo).
scripts/
  build-assets.mjs       Matrículas, exposición, recortes y export multi-ancho.
  build_brand.py         Logo con transparencia, favicons, iconos PWA y OG.
  checklist.mjs          Reglas de diseño medibles.
  secciones.mjs          Capturas por sección.
  shots.mjs              Maquetado y dianas táctiles.
  test-form.mjs          Prueba de extremo a extremo del formulario.
  test-motion.mjs        Prueba de accesibilidad del movimiento.
src/
  app/                   Rutas, metadatos, iconos y hoja de estilos global.
  components/
    kit.tsx              Movimiento, botones, secciones e iconos compartidos.
    ...                  Una sección por archivo.
  lib/
    config.ts            Teléfono, dirección, precios, webhook, ID del píxel.
    content.ts           Todos los textos.
    tracking.ts          Toda la medición de Meta, en un solo archivo.
    consent.ts           Consentimiento de cookies.
    leads.ts             Captura de UTM y envío a Google Sheets.
    images.generated.ts  Generado por build-assets.mjs. No se edita a mano.
```

### Cambios habituales

- **Teléfono, dirección, precio, horario** → `src/lib/config.ts`
- **Textos** → `src/lib/content.ts`
- **Fotos** → deja el original en `assets-src/`, añádelo a `JOBS` en
  `scripts/build-assets.mjs` (con la caja de su matrícula en `PLATES`) y lanza
  `npm run assets`

---

## Formulario y leads

Cinco pantallas, una pregunta en cada una. Al enviar:

1. El navegador hace `POST` en JSON a **`/api/lead/`** (`src/app/api/lead/route.ts`).
2. La función lo reenvía al Apps Script (`SHEETS_WEBHOOK_URL` en `config.ts`)
   con los mismos campos de siempre (`nombre`, `telefono`, `modelo`, `anio`,
   `motor`, `potencia`, `objetivo`, `utm_*`, `event_id`, `website`) y **lee su
   respuesta**. Desde el navegador eso era imposible: con `no-cors` la respuesta
   de Google llega opaca.
3. Si la hoja contesta `{"ok":true}`, la web enseña la pantalla final y dispara
   el `Lead` del píxel. Si no hay red, se corta (25 s) o la hoja falla, sale un
   aviso en el formulario, no se mide nada y lo rellenado sigue ahí para volver
   a enviarlo.
4. Plan B: si algún despliegue saliera sin la función (404), se manda directo
   al Apps Script como antes. Se enseña la pantalla final, pero sin `Lead`,
   porque no hay forma de confirmar que se guardó.

### Por qué se manda `objetivo` además de `potencia`

Son el mismo dato. El Apps Script publicado llena su columna «Potencia de
serie» leyendo un campo llamado `objetivo`, no `potencia`, así que se mandan
los dos nombres y el script usa el que conozca. Se comprobó enviando ambos
valores por separado y mirando en cuál caía la celda.

Si algún día se despliega el script de `docs/apps-script.gs` —que busca cada
valor por el nombre de la cabecera y espera `potencia`— seguirá funcionando
igual: el campo que no use lo ignora. Cuando eso pase se puede quitar el alias
de `enviarLead`, en `src/lib/leads.ts`.

Las tres columnas `utm_` sólo se rellenan si la visita llega por un enlace que
los traiga, que es lo que hacen los anuncios. Entrando a la web a pelo salen
vacías, y es lo correcto.

`event_id` es un UUID que se manda a la vez a la hoja, al `Lead` del píxel y
al `Lead` de la API de Conversiones: Meta ve el mismo ID por los dos caminos y
lo cuenta una sola vez.

## Medición

Todo pasa por `src/lib/tracking.ts`. **El píxel de Meta no se carga hasta que el
usuario acepta las cookies de marketing.** Si acepta más tarde, se carga en ese
momento y se envían los eventos que hubieran quedado en cola.

| Momento | Evento | Parámetros |
|---|---|---|
| Carga de la página, o justo al aceptar (sin recargar) | `PageView` | — |
| Completa la primera pregunta | `ViewContent` | `content_name: "Calculadora"` |
| Lo mismo (se mantiene por compatibilidad) | `FormStart` (personalizado) | — |
| Clic en cualquier enlace `wa.me` o `tel:` de cualquier página | `Contact` | `content_category: whatsapp \| telefono` |
| La hoja confirma que guardó el presupuesto | `Lead` | `content_name`, `value: 219`, `currency: EUR`, `eventID` |

`Contact` se mide con un único listener en `initTracking`, no botón a botón:
cualquier enlace nuevo de WhatsApp o teléfono queda medido sin tocar nada.

Con consentimiento, el `fbclid` del anuncio se guarda en la cookie `_fbc`
(`fb.1.<ms>.<fbclid>`, dominio `.vdnperformance.com`, 90 días). Sin
consentimiento sólo se guarda en memoria y no se escribe nada.

### API de Conversiones (CAPI)

La manda `/api/lead/` con el `Lead`, **sólo si la persona aceptó marketing** y
la hoja confirmó el guardado. Qué se envía exactamente está documentado en
`src/lib/capi.ts`: teléfono, nombre y apellidos en SHA-256, `fbp` y `fbc`, el
user agent (Meta lo exige en eventos web), la URL y los mismos `content_name`,
`value` y `currency` que el píxel. Ni la IP, ni el coche, ni los UTM.

Variables de entorno en Vercel (**Settings → Environment Variables**):

| Variable | Para qué |
|---|---|
| `META_CAPI_TOKEN` | Token de acceso de la API de Conversiones (Administrador de eventos → píxel → Configuración → Generar token). **Sin él, la CAPI no se manda** y todo lo demás funciona igual. |
| `META_TEST_EVENT_CODE` | Opcional. El código de "Probar eventos" para ver los Lead de prueba en el Administrador de eventos. Quitarlo después. |

---

## Despliegue en Vercel

### 1. Crear el proyecto

1. Sube el repositorio a GitHub.
2. En Vercel, **Add New → Project** e importa el repositorio.
3. Vercel detecta Next.js solo. Deja los valores por defecto:
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Output directory: *(vacío, el de Next.js por defecto)*
4. Variables de entorno: `META_CAPI_TOKEN` para la API de Conversiones (ver
   arriba). Sin ella la web funciona igual, sólo que sin CAPI.
5. **Deploy**.

### 2. Dominio

La landing se sirve en **`https://www.vdnperformance.com`**, conectado en
Vercel (**Settings → Domains**). `vdnperformance.com` sin `www` redirige ahí.
La web principal, `vdnperformance.es`, es otra y no se toca.

Ese dominio está escrito en `SITE.url`, en `src/lib/config.ts`. De ahí salen la
URL canónica, la imagen de vista previa al compartir el enlace, los datos
estructurados y las páginas legales. **Si algún día cambia el dominio, se
cambia ahí**: si no, los enlaces compartidos salen sin imagen.

### 3. Después de publicar

- **Instagram Ads:** usa la URL con parámetros, por ejemplo
  `https://www.vdnperformance.com/?utm_source=instagram&utm_campaign=stage1&utm_content=reel-e46`.
- **Píxel:** en el Administrador de eventos de Meta, comprueba que llegan
  `PageView`, `FormStart`, `Contact` y `Lead`. Recuerda **aceptar las cookies**
  al probarlo: sin consentimiento el píxel no se carga, y eso es lo correcto.

---

## Decisiones que conviene conocer

- **Las matrículas van difuminadas.** Son datos personales de terceros y la web
  lleva su propia política de privacidad. Se difuminan en `build-assets.mjs`, no
  a mano. Los metadatos EXIF (incluida la geolocalización) se eliminan igual.
- **Las fotos llevan un único tratamiento.** Vienen de noche, a mediodía y con
  fluorescentes: el pipeline iguala primero la exposición de cada una y después
  aplica el mismo grado de color a todas. Sin eso no parecen de la misma web.
- **La entrada del hero no usa fundido.** Chrome descarta para siempre como
  candidato a LCP cualquier elemento que en su primer pintado tuviera
  `opacity: 0`. Con fundido, el LCP se iba al último elemento en aparecer.
- **El hero no depende del JavaScript.** La subida del titular
  (`.line-mask-carga`) y el zoom de la foto (`.hero-zoom`) son animaciones CSS
  que arrancan con el primer pintado: con el JS lento o bloqueado, el titular,
  el subtítulo y el botón se ven igual. Ya no hay animación de entrada previa.
- **El aviso de cookies sí entra con fundido, y es a propósito.** Esa misma
  regla de Chrome lo saca de la carrera por el LCP. Sin el fundido, el aviso
  -que se pinta con la página ya hidratada- era el elemento más grande de la
  pantalla y se llevaba el LCP por encima de los tres segundos.
- **El revelado de imágenes va en dos capas.** El `clip-path` se aplica a la de
  dentro y se observa la de fuera: observar la capa recortada daría área cero y
  el `IntersectionObserver` no la daría nunca por visible.
- **No se usa `content-visibility: auto`.** Ahorra trabajo de pintado, pero deja
  sin disparar los `IntersectionObserver` de su subárbol y las fotos se quedaban
  tapadas. Se prefiere que se vean.
- **Una sola barra fija en móvil**, y se esconde cuando ya hay un botón
  principal en pantalla: nunca dos azules a la vez.
- **Toda la página lleva `noindex`**, como pide el encargo, para no competir en
  Google con vdnperformance.es. Efecto secundario: la categoría SEO de
  Lighthouse no puede pasar de **69**, porque la auditoría `is-crawlable` pesa 4
  de los ~13 puntos del total. Todas las demás pasan. Para indexar algún día,
  quita el bloque `robots` de `src/app/layout.tsx` y ajusta `public/robots.txt`.
- **Los textos legales son una base, no asesoramiento jurídico.** Están
  marcados con `TODO (legal)` en cada página.
