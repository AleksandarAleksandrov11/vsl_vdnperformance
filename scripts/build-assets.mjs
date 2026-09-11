/**
 * build-assets.mjs — pipeline de imágenes de vsl.vdnperformance.es
 * -----------------------------------------------------------------
 * Lee los originales de /assets-src (que NO se despliegan) y escribe en
 * /public/img las variantes AVIF + WebP + JPEG de respaldo que consume el
 * componente <Picture>.
 *
 * Por cada foto:
 *   1. Orientación EXIF corregida y metadatos eliminados (incluye GPS).
 *   2. Matrícula difuminada: es un dato personal de un tercero (RGPD) y además
 *      queda más limpio. Las cajas están en PLATES (coordenadas normalizadas).
 *   3. Recorte al ratio de cada hueco de la página, manteniendo el punto focal.
 *   4. Grado de color común para que fotos con luces muy distintas casen entre sí.
 *   5. Export multi-ancho + LQIP en base64 + color dominante -> images.generated.ts
 *
 * Uso:  npm run assets
 */
import sharp from 'sharp';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets-src');
const OUT = path.join(ROOT, 'public', 'img');
const MANIFEST = path.join(ROOT, 'src', 'lib', 'images.generated.ts');

/* ------------------------------------------------------------------ *
 * Matrículas: [x, y, ancho, alto] en fracción del lado correspondiente.
 * Medidas a ojo sobre las fotos originales, con margen de sobra.
 * ------------------------------------------------------------------ */
const PLATES = {
  'IMG_20260324_210954_Original.jpeg': [[0.198, 0.542, 0.162, 0.058]],
  'IMG_0124.jpeg': [[0.497, 0.521, 0.168, 0.056]],
  'IMG_0326.jpeg': [[0.292, 0.564, 0.298, 0.080]],
  'IMG_0430.jpeg': [[0.551, 0.574, 0.223, 0.070]],
  'IMG_0796.jpeg': [[0.741, 0.674, 0.198, 0.060]],
  'IMG_0778.jpeg': [[0.100, 0.640, 0.160, 0.074]],
  'IMG_1188.jpeg': [[0.596, 0.572, 0.345, 0.092]],
  'IMG_1227.jpeg': [[0.108, 0.596, 0.312, 0.098]],
  'IMG_0239.jpeg': [[0.628, 0.666, 0.300, 0.092]],
  'IMG_0214.jpeg': [[0.300, 0.682, 0.365, 0.092]],
};

/* ------------------------------------------------------------------ *
 * Qué imagen va en cada hueco de la página.
 * focus: punto que debe quedar en el centro del recorte (0-1).
 * ------------------------------------------------------------------ */
const JOBS = [
  {
    id: 'hero',
    src: 'IMG_20260324_210954_Original.jpeg',
    alt: 'BMW Serie 3 gris saliendo del taller de VDN Performance en Collado Villalba de noche',
    grade: { brightness: 1.04, saturation: 0.82, contrast: 1.1 },
    /* Es la imagen que marca el LCP y encima va cubierta por dos velos oscuros:
       admite bastante más compresión sin que se note, y cada kilobyte que se
       quita aquí es tiempo que gana la primera impresión en móvil. */
    calidad: { avif: 36, webp: 62 },
    variants: [
      { name: 'hero-portrait', ratio: 3 / 4.4, widths: [420, 560, 760, 900], focus: { x: 0.43, y: 0.47 } },
      { name: 'hero-wide', ratio: 16 / 9, widths: [1100, 1500, 1920], focus: { x: 0.44, y: 0.5 } },
    ],
  },
  {
    id: 'impact',
    src: 'IMG_0326.jpeg',
    alt: 'BMW Serie 3 negro con los faros encendidos dentro del taller',
    grade: { brightness: 0.94, saturation: 0.7, contrast: 1.12 },
    variants: [
      { name: 'impact-portrait', ratio: 3 / 4, widths: [420, 560, 820], focus: { x: 0.46, y: 0.5 } },
      { name: 'impact-wide', ratio: 16 / 9, widths: [1100, 1500, 1920], focus: { x: 0.46, y: 0.52 } },
    ],
  },
  {
    id: 'garantia',
    src: 'IMG_1188.jpeg',
    alt: 'BMW Serie 5 plateado aparcado en la puerta del taller',
    grade: { brightness: 0.99, saturation: 0.8, contrast: 1.08 },
    variants: [{ name: 'garantia', ratio: 4 / 5, widths: [420, 620, 860], focus: { x: 0.5, y: 0.52 } }],
  },
  {
    id: 'proceso',
    src: 'IMG_1227.jpeg',
    alt: 'Audi A3 gris preparado para la diagnosis en el taller',
    grade: { brightness: 0.9, saturation: 0.66, contrast: 1.1 },
    variants: [{ name: 'proceso-wide', ratio: 16 / 9, widths: [760, 1200, 1600], focus: { x: 0.4, y: 0.52 } }],
  },
  {
    id: 'servicios',
    src: 'IMG_0214.jpeg',
    alt: 'Range Rover Sport en el puesto de trabajo del taller',
    grade: { brightness: 0.9, saturation: 0.66, contrast: 1.1 },
    variants: [{ name: 'servicios-wide', ratio: 16 / 9, widths: [760, 1200, 1600], focus: { x: 0.5, y: 0.55 } }],
  },
  {
    id: 'dyno',
    src: 'IMG_0239.jpeg',
    alt: 'Audi A3 blanco esperando su reprogramación',
    grade: { brightness: 0.86, saturation: 0.6, contrast: 1.12 },
    variants: [{ name: 'dyno-wide', ratio: 16 / 9, widths: [760, 1200, 1600], focus: { x: 0.52, y: 0.55 } }],
  },
  /* --- Galería "Trabajos reales" --- */
  {
    id: 'work-e46-330d',
    src: 'IMG_0796.jpeg',
    alt: 'BMW E46 330d azul oscuro reprogramado en Stage 1 por VDN Performance',
    grade: { brightness: 1.0, saturation: 0.84, contrast: 1.1 },
    variants: [{ name: 'work-e46-330d', ratio: 4 / 5, widths: [380, 560, 780], focus: { x: 0.52, y: 0.56 } }],
  },
  {
    id: 'work-e46-320i',
    src: 'IMG_0430.jpeg',
    alt: 'BMW E46 320i plateado con Stage 1 y Hardcut',
    grade: { brightness: 0.98, saturation: 0.8, contrast: 1.1 },
    variants: [{ name: 'work-e46-320i', ratio: 4 / 5, widths: [380, 560, 780], focus: { x: 0.52, y: 0.5 } }],
  },
  {
    id: 'work-e60-530d',
    src: 'IMG_0124.jpeg',
    alt: 'BMW E60 530d negro con Stage 2 y más de 80 CV de ganancia',
    grade: { brightness: 1.08, saturation: 0.82, contrast: 1.12 },
    variants: [{ name: 'work-e60-530d', ratio: 4 / 5, widths: [380, 560, 780], focus: { x: 0.52, y: 0.48 } }],
  },
  {
    id: 'work-audi-diag',
    src: 'IMG_0778.jpeg',
    alt: 'Audi TDI con el capó abierto durante la diagnosis previa a la reprogramación',
    grade: { brightness: 1.02, saturation: 0.78, contrast: 1.1 },
    variants: [{ name: 'work-audi-diag', ratio: 4 / 5, widths: [380, 560, 780], focus: { x: 0.42, y: 0.52 } }],
  },
];

/* ------------------------------------------------------------------ */

/** Recorte de ratio fijo centrado en un punto focal, sin salirse de la imagen. */
function cropBox(W, H, ratio, focus) {
  let w = W;
  let h = Math.round(w / ratio);
  if (h > H) {
    h = H;
    w = Math.round(h * ratio);
  }
  let left = Math.round(focus.x * W - w / 2);
  let top = Math.round(focus.y * H - h / 2);
  left = Math.max(0, Math.min(W - w, left));
  top = Math.max(0, Math.min(H - h, top));
  return { left, top, width: w, height: h };
}

/**
 * Difumina cada matrícula: recorta la zona, la desenfoca muy fuerte, le baja el
 * detalle y la vuelve a pegar. No queda un rectángulo plano feo, sino una
 * matrícula "fuera de foco" que pasa desapercibida.
 */
async function blurPlates(pipeline, boxes, W, H) {
  if (!boxes?.length) return pipeline;
  const base = await pipeline.png().toBuffer();
  const overlays = [];
  for (const [bx, by, bw, bh] of boxes) {
    const left = Math.max(0, Math.round(bx * W));
    const top = Math.max(0, Math.round(by * H));
    const width = Math.min(W - left, Math.round(bw * W));
    const height = Math.min(H - top, Math.round(bh * H));
    if (width < 8 || height < 4) continue;
    const patch = await sharp(base)
      .extract({ left, top, width, height })
      .resize(Math.max(6, Math.round(width / 22)), Math.max(3, Math.round(height / 22)), { fit: 'fill' })
      .resize(width, height, { fit: 'fill', kernel: 'cubic' })
      .blur(Math.max(4, width / 28))
      .png()
      .toBuffer();
    overlays.push({ input: patch, left, top });
  }
  return sharp(base).composite(overlays);
}

const enc = {
  avif: { quality: 52, effort: 6, chromaSubsampling: '4:2:0' },
  webp: { quality: 74, effort: 6, smartSubsample: true },
  jpeg: { quality: 72, progressive: true, mozjpeg: true, chromaSubsampling: '4:2:0' },
};

async function run() {
  // `node scripts/build-assets.mjs hero impact` regenera sólo esos huecos.
  const only = process.argv.slice(2);
  if (!only.length) await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const manifest = {};
  let totalBytes = 0;

  for (const job of JOBS) {
    if (only.length && !only.includes(job.id)) continue;
    const file = path.join(SRC, job.src);
    const meta = await sharp(file).rotate().metadata();
    const W = meta.autoOrient?.width ?? meta.width;
    const H = meta.autoOrient?.height ?? meta.height;

    // Base: orientación corregida + matrículas difuminadas + grado de color.
    let base = sharp(file).rotate();
    base = await blurPlates(base, PLATES[job.src], W, H);
    const g = job.grade ?? {};
    const graded = await base
      .modulate({ brightness: g.brightness ?? 1, saturation: g.saturation ?? 1 })
      .linear(g.contrast ?? 1, -(128 * ((g.contrast ?? 1) - 1)))
      .png({ compressionLevel: 3 })
      .toBuffer();

    for (const v of job.variants) {
      const box = cropBox(W, H, v.ratio, v.focus);
      const cropped = sharp(graded).extract(box);
      const sources = { avif: [], webp: [] };
      let fallback = '';

      for (const width of v.widths) {
        const height = Math.round(width / v.ratio);
        const resized = await cropped
          .clone()
          .resize(width, height, { fit: 'cover', kernel: 'lanczos3' })
          .toBuffer();

        for (const fmt of ['avif', 'webp']) {
          const out = path.join(OUT, `${v.name}-${width}.${fmt}`);
          const opciones = { ...enc[fmt] };
          if (job.calidad?.[fmt]) opciones.quality = job.calidad[fmt];
          const info = await sharp(resized)[fmt](opciones).toFile(out);
          totalBytes += info.size;
          sources[fmt].push({ src: `/img/${v.name}-${width}.${fmt}`, w: width });
        }
      }

      // Respaldo JPEG en el ancho intermedio, sólo por si falla AVIF y WebP.
      const fw = v.widths[Math.min(1, v.widths.length - 1)];
      const fbInfo = await cropped
        .clone()
        .resize(fw, Math.round(fw / v.ratio), { fit: 'cover', kernel: 'lanczos3' })
        .jpeg(enc.jpeg)
        .toFile(path.join(OUT, `${v.name}-${fw}.jpg`));
      totalBytes += fbInfo.size;
      fallback = `/img/${v.name}-${fw}.jpg`;

      // LQIP: 20px de ancho en WebP, va inline en el HTML como background.
      const lqipBuf = await cropped.clone().resize(20).webp({ quality: 28 }).toBuffer();
      const { dominant } = await cropped.clone().resize(64).stats();

      manifest[v.name] = {
        alt: job.alt,
        width: v.widths[v.widths.length - 1],
        height: Math.round(v.widths[v.widths.length - 1] / v.ratio),
        aspect: Number(v.ratio.toFixed(5)),
        src: fallback,
        avif: sources.avif,
        webp: sources.webp,
        lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
        color: `rgb(${dominant.r},${dominant.g},${dominant.b})`,
      };
      process.stdout.write(`  ✓ ${v.name}  ${v.widths.join('/')}px\n`);
    }
  }

  const ts = `/* GENERADO POR scripts/build-assets.mjs — no editar a mano. */
export type ImgSource = { src: string; w: number };
export type ImgAsset = {
  alt: string;
  width: number;
  height: number;
  aspect: number;
  src: string;
  avif: ImgSource[];
  webp: ImgSource[];
  lqip: string;
  color: string;
};

export const IMAGES = ${JSON.stringify(manifest, null, 2)} as const satisfies Record<string, ImgAsset>;

export type ImageKey = keyof typeof IMAGES;
`;
  await mkdir(path.dirname(MANIFEST), { recursive: true });
  if (only.length) {
    console.log('\nRegeneración parcial: el manifiesto NO se ha reescrito.');
    console.log('Lanza `npm run assets` sin argumentos para actualizarlo entero.');
  } else {
    await writeFile(MANIFEST, ts, 'utf8');
  }
  console.log(`\n${Object.keys(manifest).length} huecos · ${(totalBytes / 1024 / 1024).toFixed(2)} MB en /public/img`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
