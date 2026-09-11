# vsl.vdnperformance.es

Landing de captación para **VDN Performance** (reprogramación de centralitas,
Collado Villalba). El 90 % del tráfico llega de anuncios de Instagram en móvil,
así que está diseñada primero para móvil.

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

1. Se hace `POST` al Apps Script (`SHEETS_WEBHOOK_URL` en `config.ts`) con
   `mode: 'no-cors'` y `URLSearchParams`. Sin JSON ni cabeceras propias: Apps
   Script lee `e.parameter` y así no hay CORS.
2. Campos: `nombre`, `telefono`, `modelo`, `anio`, `motor`, `potencia`,
   `utm_source`, `utm_campaign`, `utm_content`, `event_id`, `website`.
3. La petición se corta a los 8 segundos. La pantalla final se muestra siempre,
   incluso si falla la red: con `no-cors` la respuesta es opaca y no se puede
   saber si la hoja lo guardó. Si algo ha ido mal, el botón de WhatsApp de esa
   pantalla recupera el contacto.

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

`event_id` es un UUID que se manda a la vez a la hoja y al evento `Lead` del
píxel, para poder conectar la API de Conversiones sin duplicar conversiones.

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
4. No hace falta ninguna variable de entorno.
5. **Deploy**.

### 2. Conectar vsl.vdnperformance.es

1. En el proyecto: **Settings → Domains → Add**.
2. Escribe `vsl.vdnperformance.es` y confirma.
3. Vercel pedirá un registro **CNAME** en el DNS de `vdnperformance.es`:

   | Tipo | Nombre | Valor |
   |---|---|---|
   | CNAME | `vsl` | `cname.vercel-dns.com` |

   Sólo se toca el subdominio `vsl`: **la web principal no se ve afectada.**
4. Cuando Vercel marque el dominio en verde, emite el certificado HTTPS solo.
5. Comprueba que el formulario escribe en la hoja de cálculo.

### 3. Después de publicar

- **Instagram Ads:** usa la URL con parámetros, por ejemplo
  `https://vsl.vdnperformance.es/?utm_source=instagram&utm_campaign=stage1&utm_content=reel-e46`.
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
- **La entrada del coche es HTML estático y CSS puro** (`Intro.tsx` y el bloque
  `.intro` de `globals.css`). Ni una línea de JavaScript, así que se pinta con
  el primer fotograma. El panel negro es un `div` con color de fondo y el coche
  un SVG en línea: ninguno de los dos puede ser candidato a LCP, de modo que la
  métrica la sigue marcando el titular de detrás. Se enseña una vez por sesión y
  con `prefers-reduced-motion` no se enseña nunca.
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
