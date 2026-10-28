# www.vdnperformance.com

Landing de captación para **VDN Performance** (reprogramación de centralitas,
Collado Villalba). El 90 % del tráfico llega de anuncios de Instagram en móvil,
así que está diseñada primero para móvil.

Un único objetivo: que la persona rellene el formulario. Antes del formulario no
hay ningún enlace que saque de la página (ni WhatsApp, ni teléfono, ni redes); al
enviarlo, en el móvil se abre WhatsApp con los datos de su coche.

> **El Apps Script y la hoja de Google no se han tocado.** Ni su código
> publicado, ni las columnas, ni los despliegues, ni `docs/apps-script.gs`. La web
> les manda exactamente el mismo cuerpo de siempre, y una prueba
> (`tests/fixtures/payload-hoja.json`) falla si cambia un solo byte.

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
npm run lint       # ESLint con las reglas de Next.js
npm run typecheck  # TypeScript sin emitir
npm test           # Playwright: compila, levanta la web y pasa toda la suite
```

`npm test` usa el Chromium que instala Playwright (`npx playwright install
chromium`); con otro, `CHROMIUM_PATH=/ruta/al/chrome npm test`. Levanta su propio
simulador de la hoja y de Meta (`tests/support/simulador.mjs`): **ninguna prueba
escribe en la hoja real ni manda eventos a Meta.** En el navegador están siempre
interceptados `script.google.com`, `graph.facebook.com`, `connect.facebook.net`
y `wa.me`.

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

Los scripts de `scripts/` necesitan un servidor levantado (`npm start`, puerto
3000) y usan el Chromium de Playwright; con otro, `CHROMIUM_PATH=/ruta/al/chrome`.

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

Cinco pantallas, una pregunta en cada una. **Las preguntas no se cambian** (ni
se añaden, ni se quitan, ni cambian de orden): son las mínimas. Sólo se mejora
cómo se rellenan. Al enviar:

1. El navegador hace `POST` en JSON a **`/api/lead/`** (`src/app/api/lead/route.ts`).
2. La función lo reenvía al Apps Script (`SHEETS_WEBHOOK_URL` en `config.ts`)
   con los mismos campos de siempre (`nombre`, `telefono`, `modelo`, `anio`,
   `motor`, `potencia`, `event_id`, `utm_*`, `objetivo`, `website`), en el mismo
   orden y formato, y **lee su respuesta**. Lo que el navegador manda para la
   CAPI (`fbclid`, `fbc`, `fbp`, `event_source_url`, `consent_marketing`) no se
   reenvía nunca a la hoja.
3. Si la hoja contesta `{"ok":true}`, sale el `Lead` del píxel y la pantalla de
   gracias. En el móvil, a los 1,5 s se abre WhatsApp solo (con
   `location.href`, no `window.open`, que se bloquea en iOS y en Instagram) con
   un mensaje como «Hola, soy Laura. Mi coche: Seat León, 2015, 2.0 TDI, 150 CV.».
   En escritorio no se redirige: queda el botón «Abrir WhatsApp».
4. Si no hay red, se corta (25 s) o la hoja falla: aviso, lo rellenado sigue
   ahí para reintentar (con el mismo `event_id`) y un botón «Enviar por
   WhatsApp» con todos los datos. No se mide `Lead`.
5. Plan B: si algún despliegue saliera sin la función (404), se manda directo
   al Apps Script como antes, sin `Lead` porque no se puede confirmar.

**Teléfono.** Delante del campo hay un selector de prefijo, +34 por defecto, con
los países más habituales y «Otro». Con +34 se valida y se guarda exactamente
como siempre (9 dígitos). Con otro prefijo, de 6 a 14 cifras, y va a la hoja en
el mismo campo `telefono` con el prefijo delante (`+351912345678`). Si se pega
un número con `+` o `00`, el prefijo pasa al selector y no se duplica.

**Progreso.** Lo contestado se guarda en `sessionStorage`: si la persona abre una
legal (siempre en pestaña nueva), recarga o el navegador de Instagram restaura la
página, el formulario sigue donde estaba.

**UTM y fbclid.** Se guardan en `sessionStorage` en cuanto llega la visita,
desde un script en línea del `<head>` (antes de que cargue React) y otra vez al
hidratar. Unos UTM buenos nunca se sobrescriben con vacíos. Llegan a la hoja en
los mismos campos `utm_*` de siempre aunque se recargue o se pase por una legal.

### Por qué se manda `objetivo` además de `potencia`

Son el mismo dato. El Apps Script publicado llena su columna «Potencia de
serie» leyendo un campo llamado `objetivo`, no `potencia`, así que se mandan
los dos nombres y el script usa el que conozca. Se comprobó enviando ambos
valores por separado y mirando en cuál caía la celda.

Si algún día se despliega el script de `docs/apps-script.gs` (que busca cada
valor por el nombre de la cabecera y espera `potencia`) seguirá funcionando
igual: el campo que no use lo ignora. Cuando eso pase se puede quitar el alias
de `enviarLead`, en `src/lib/leads.ts`.

Las tres columnas `utm_` sólo se rellenan si la visita llega por un enlace que
los traiga, que es lo que hacen los anuncios. Entrando a la web a pelo salen
vacías, y es lo correcto.

`event_id` es un UUID que se manda a la vez a la hoja, al `Lead` del píxel y
al `Lead` de la API de Conversiones: Meta ve el mismo ID por los dos caminos y
lo cuenta una sola vez.

## Medición

Todo lo del navegador pasa por `src/lib/tracking.ts`. **El píxel de Meta no se
carga hasta que el usuario acepta las cookies de marketing** (`consent.ts` no ha
cambiado). El `Lead` de servidor (CAPI) sale para todos los leads, con o sin
consentimiento.

| Momento | Evento | Parámetros |
|---|---|---|
| Carga de la página, o justo al aceptar (sin recargar) | `PageView` | |
| Completa la primera pregunta | `ViewContent` | `content_name: "Calculadora"` |
| Lo mismo, una vez por sesión | `FormStart` (personalizado) | |
| Completa cada paso, una vez por paso | `FormStep` (personalizado) | `step` |
| Error de validación | `FormError` (personalizado) | `step`, `field` |
| La hoja confirma el presupuesto | `Lead` | `content_name`, `eventID`. Sin valor ni moneda |
| WhatsApp tras enviar | `Contact` | `content_category`: `gracias-auto`, `gracias-boton` o `error-envio` |

Los tres `Form*` sólo salen con el píxel cargado: sin consentimiento no se
encolan. El `Lead` sale **una sola vez por `event_id`** (se recuerda en memoria
y en `sessionStorage`): ni un doble Enter ni aceptar las cookies después lo
duplican. Antes del `Lead` se llama a `fbq('init', id, { ph, fn, country })`
para la coincidencia avanzada.

`event_id` nace al empezar el formulario (un reintento usa el mismo) y viaja a
la hoja, al `Lead` del píxel y al de la CAPI: Meta ve el mismo ID por los dos
caminos y lo cuenta una vez. Si la persona acepta las cookies después de
enviar, el `Lead` en cola sale con ese mismo `eventID`.

**Cookie `_fbc`.** Sólo con consentimiento, `tracking.ts` guarda el `fbclid` del
anuncio en `_fbc` (`fb.1.<ms del primer clic>.<fbclid>`, 90 días) en el dominio
raíz: en producción queda en **`.vdnperformance.com`**, válida para `www` y para
el dominio sin `www`. Sin consentimiento no se escribe ninguna cookie: el
`fbclid` va en `sessionStorage` y el servidor construye el `fbc` para la CAPI.

### API de Conversiones (CAPI)

La manda `/api/lead/` con `after()`, cuando la hoja ya ha confirmado el guardado:
nunca retrasa la respuesta, y si Meta falla el lead ya está guardado. Qué se
envía exactamente está documentado en `src/lib/capi.ts`:

- `ph` y `external_id`: SHA-256 del teléfono internacional sin `+` ni espacios;
- `fn` y `ln`: SHA-256 del nombre y los apellidos normalizados;
- `country`: SHA-256 del país del prefijo (`es` por defecto);
- `client_ip_address` (primera IP de `x-forwarded-for` o `x-real-ip`) y
  `client_user_agent`, sin hashear;
- `fbp` (cookie o cuerpo) y `fbc` (cookie, cuerpo o construido desde el
  `fbclid`), sin hashear;
- `custom_data.content_name`. Sin valor ni moneda. Ni el coche ni los UTM.

En los logs de Vercel queda `CAPI ok 200` o el error de Meta.

Variables de entorno en Vercel (**Settings → Environment Variables**):

| Variable | Para qué |
|---|---|
| `META_CAPI_TOKEN` | Token de acceso de la API de Conversiones (Administrador de eventos → píxel → Configuración → Generar token). **Sin él, la CAPI no se manda** y todo lo demás funciona igual. |
| `META_TEST_EVENT_CODE` | Opcional. El código de "Probar eventos" para ver los Lead de prueba en el Administrador de eventos. Quitarlo después. |

## Hero según el anuncio

`src/lib/ad-variants.ts`. Un script en línea del `<head>` lee `utm_content` (o,
si no hay, `utm_campaign`), lo normaliza (`TOFU1.0` -> `tofu1`), lo guarda en
`sessionStorage` y marca `<html>` con `data-ad` y `data-campaign` antes del
primer pintado:

- **Cerrar** (`utm_campaign` con «cerrar», o `utm_content` con `mofu`/`bofu`):
  «Presupuesto gratis» / «¿Cuánto gana tu coche?» / «Stage 1 desde 219 €. Te
  damos tu precio por WhatsApp.».
- **Descubrir** (`descubrir`, `tofu`) y sin UTM: el hero de siempre.
- `utm_content` manda sobre `utm_campaign`. `POR_ANUNCIO` está preparado para
  variantes por anuncio concreto (vacío por ahora).

Todas las variantes van en el HTML y el CSS enseña la buena: sin parpadeo y con
CLS 0. Cada titular ocupa dos líneas a 390 px, como el de por defecto (es el
elemento LCP). El botón principal es el mismo en todas.

## Rendimiento

Lighthouse móvil en local (Slow 4G simulada, mediana de 3 pasadas alternas):

| | Rendimiento | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| Antes (main 1e53738) | 0,94 | 932 ms | 3034 ms | 102 ms | 0 |
| Después | 0,94 | 911 ms | 3032 ms | 86 ms | 0 |

JS de la primera carga: 176,6 KB gzip antes, 174,7 KB después. La fuente va
en el repo (`src/app/fonts`, `next/font/local`): el build no descarga nada.

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
- **Píxel y CAPI:** en el Administrador de eventos de Meta, comprueba que llegan
  `PageView`, `ViewContent`, `FormStart`, `FormStep`, `Contact` y `Lead`, y que
  el `Lead` de navegador y el de servidor se deduplican. Para ver los eventos
  del navegador hay que **aceptar las cookies**; el `Lead` de servidor llega
  igual sin aceptarlas.

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
