/**
 * build-assets.mjs — pipeline de imágenes de vsl.vdnperformance.es
 * -----------------------------------------------------------------
 * Lee los originales de /assets-src (que NO se despliegan) y escribe en
 * /public/img las variantes AVIF + WebP + JPEG de respaldo que consume <Picture>.
 *
 * Por cada foto:
 *   1. Orientación EXIF corregida y metadatos eliminados (incluye GPS).
 *   2. Matrícula difuminada: es un dato personal de un tercero (RGPD).
 *   3. Exposición igualada. Las fotos vienen de noche, a mediodía y con
 *      fluorescentes: sin esto, puestas una al lado de otra, cantan.
 *   4. UN ÚNICO tratamiento de color para todas (LOOK), para que parezcan de la
 *      misma sesión. Ni un ajuste artístico por foto.
 *   5. Recorte al ratio de cada hueco respetando un punto focal.
 *   6. Export multi-ancho + LQIP + color dominante -> images.generated.ts
 *
 * Uso:  npm run assets            (todo)
 *       node scripts/build-assets.mjs hero cierre   (sólo esos huecos)
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
 * Tratamiento común. Es el mismo para las diez fotos: es lo que hace que
 * la página se vea de una pieza y no como un álbum de móvil.
 * ------------------------------------------------------------------ */
const LOOK = { saturation: 0.74, contrast: 1.07 };

/* Corrección de exposición por foto, sólo para llevarlas todas a un punto
   parecido. Medido sobre la luminancia media del original; las nocturnas se
   suben menos a propósito, porque su oscuridad es lo que las hace buenas. */
const EXPOSICION = {
  'IMG_20260324_210954_Original.jpeg': 1.16,
  'IMG_0124.jpeg': 1.26,
  'IMG_0214.jpeg': 0.9,
  'IMG_0239.jpeg': 0.92,
  'IMG_0326.jpeg': 0.92,
  'IMG_0430.jpeg': 0.86,
  'IMG_0778.jpeg': 0.95,
  'IMG_0796.jpeg': 1.0,
  'IMG_1188.jpeg': 0.96,
  'IMG_1227.jpeg': 1.05,
};

/* Matrículas: [x, y, ancho, alto] en fracción del lado correspondiente. */
const PLATES = {
  'IMG_20260324_210954_Original.jpeg': [[0.198, 0.542, 0.162, 0.058]],
  'IMG_0124.jpeg': [[0.497, 0.521, 0.168, 0.056]],
  'IMG_0326.jpeg': [[0.292, 0.564, 0.298, 0.08]],
  'IMG_0430.jpeg': [[0.551, 0.574, 0.223, 0.07]],
  'IMG_0796.jpeg': [[0.741, 0.674, 0.198, 0.06]],
  'IMG_0778.jpeg': [[0.1, 0.64, 0.16, 0.074]],
  'IMG_1188.jpeg': [[0.596, 0.572, 0.345, 0.092]],
  'IMG_1227.jpeg': [[0.108, 0.596, 0.312, 0.098]],
  'IMG_0239.jpeg': [[0.628, 0.666, 0.3, 0.092]],
  'IMG_0214.jpeg': [[0.3, 0.682, 0.365, 0.092]],
};

/* ------------------------------------------------------------------ *
 * Qué foto va en cada hueco. focus: punto que queda centrado en el recorte.
 * ------------------------------------------------------------------ */
const JOBS = [
  {
    id: 'hero',
    src: 'IMG_20260324_210954_Original.jpeg',
    alt: 'BMW Serie 3 recién reprogramado saliendo del taller de VDN Performance de noche',
    // Marca el LCP y va bajo un velo oscuro: aguanta más compresión.
    calidad: { avif: 38, webp: 64 },
    variants: [
      { name: 'hero-v', ratio: 9 / 17, widths: [420, 600, 820, 1040], focus: { x: 0.45, y: 0.5 } },
      { name: 'hero-h', ratio: 16 / 9, widths: [1200, 1600, 2000], focus: { x: 0.45, y: 0.52 } },
    ],
  },

  /* --- Stages --- */
  {
    id: 'stage-1',
    src: 'IMG_1227.jpeg',
    alt: 'Audi A3 conectado para la lectura de la centralita',
    variants: [{ name: 'stage-1', ratio: 4 / 3, widths: [420, 720, 1040], focus: { x: 0.44, y: 0.48 } }],
  },
  {
    id: 'stage-2',
    src: 'IMG_0778.jpeg',
    alt: 'Audi con el capó abierto durante el trabajo mecánico',
    variants: [{ name: 'stage-2', ratio: 4 / 3, widths: [420, 720, 1040], focus: { x: 0.44, y: 0.45 } }],
  },
  {
    id: 'stage-3',
    src: 'IMG_1188.jpeg',
    alt: 'BMW Serie 5 preparado en el taller',
    variants: [{ name: 'stage-3', ratio: 4 / 3, widths: [420, 720, 1040], focus: { x: 0.5, y: 0.5 } }],
  },

  /* --- Proceso --- */
  {
    id: 'paso-1',
    src: 'IMG_0239.jpeg',
    alt: 'Audi A3 esperando su turno en el taller',
    variants: [{ name: 'paso-1', ratio: 4 / 5, widths: [420, 720, 1000], focus: { x: 0.64, y: 0.5 } }],
  },
  {
    id: 'paso-2',
    src: 'IMG_0214.jpeg',
    alt: 'Range Rover Sport en el puesto de trabajo',
    variants: [{ name: 'paso-2', ratio: 4 / 5, widths: [420, 720, 1000], focus: { x: 0.5, y: 0.52 } }],
  },
  {
    id: 'paso-3',
    src: 'IMG_0326.jpeg',
    alt: 'BMW Serie 3 listo para salir del taller',
    variants: [{ name: 'paso-3', ratio: 4 / 5, widths: [420, 720, 1000], focus: { x: 0.47, y: 0.5 } }],
  },

  /* --- Trabajos (todas las tarjetas comparten ratio 4:5 y anchos) --- */
  ...[
    ['work-e46-330d', 'IMG_0796.jpeg', 'BMW E46 330d con Stage 1', { x: 0.52, y: 0.54 }],
    ['work-e46-320i', 'IMG_0430.jpeg', 'BMW E46 320i con Stage 1', { x: 0.52, y: 0.5 }],
    ['work-e60-530d', 'IMG_0124.jpeg', 'BMW E60 530d con Stage 2', { x: 0.52, y: 0.5 }],
    ['work-a4-tdi', 'IMG_0778.jpeg', 'Audi TDI en la puesta a punto', { x: 0.42, y: 0.5 }],
    ['work-e90', 'IMG_0326.jpeg', 'BMW Serie 3 E90 reprogramado', { x: 0.46, y: 0.5 }],
    ['work-a3', 'IMG_1227.jpeg', 'Audi A3 reprogramado', { x: 0.44, y: 0.5 }],
    ['work-rrsport', 'IMG_0214.jpeg', 'Range Rover Sport reprogramado', { x: 0.5, y: 0.55 }],
  ].map(([name, src, alt, focus]) => ({
    id: name,
    src,
    alt,
    variants: [{ name, ratio: 4 / 5, widths: [320, 460, 640], focus }],
  })),

  /* --- Cierre --- */
  {
    id: 'cierre',
    src: 'IMG_0124.jpeg',
    alt: 'BMW Serie 5 saliendo del taller al anochecer',
    calidad: { avif: 40, webp: 66 },
    variants: [
      { name: 'cierre-v', ratio: 3 / 4, widths: [420, 620, 860], focus: { x: 0.5, y: 0.5 } },
      { name: 'cierre-h', ratio: 16 / 9, widths: [1200, 1600, 2000], focus: { x: 0.5, y: 0.52 } },
    ],
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
 * Difumina cada matrícula: recorta la zona, la reduce a un puñado de píxeles,
 * la estira otra vez y la desenfoca. No queda un rectángulo plano, sino una
 * matrícula fuera de foco que pasa desapercibida.
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

/* Se exportan dos formatos y nada más:
   · AVIF, que es el que descarga casi todo el mundo y pesa la mitad que WebP.
   · WebP, como respaldo y como `src` del <img>.
   Ya no se genera JPEG: lo soportan los mismos navegadores que WebP desde 2020,
   así que era casi un megabyte subido a Vercel que no pedía nadie. */
const enc = {
  avif: { quality: 46, effort: 6, chromaSubsampling: '4:2:0' },
  webp: { quality: 72, effort: 6, smartSubsample: true },
};

async function run() {
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

    let base = sharp(file).rotate();
    base = await blurPlates(base, PLATES[job.src], W, H);

    const exposicion = EXPOSICION[job.src] ?? 1;
    const graded = await base
      .modulate({ brightness: exposicion, saturation: LOOK.saturation })
      .linear(LOOK.contrast, -(128 * (LOOK.contrast - 1)))
      .png({ compressionLevel: 3 })
      .toBuffer();

    for (const v of job.variants) {
      const box = cropBox(W, H, v.ratio, v.focus);
      const cropped = sharp(graded).extract(box);
      const sources = { avif: [], webp: [] };

      for (const width of v.widths) {
        const height = Math.round(width / v.ratio);
        const resized = await cropped
          .clone()
          .resize(width, height, { fit: 'cover', kernel: 'lanczos3' })
          .toBuffer();

        for (const fmt of ['avif', 'webp']) {
          const opciones = { ...enc[fmt] };
          if (job.calidad?.[fmt]) opciones.quality = job.calidad[fmt];
          const out = path.join(OUT, `${v.name}-${width}.${fmt}`);
          const info = await sharp(resized)[fmt](opciones).toFile(out);
          totalBytes += info.size;
          sources[fmt].push({ src: `/img/${v.name}-${width}.${fmt}`, w: width });
        }
      }

      // `src` del <img>: el WebP del ancho intermedio. Es lo que usa el
      // navegador si ignora los <source>, y ya está generado más arriba.
      const fw = v.widths[Math.min(1, v.widths.length - 1)];

      const lqipBuf = await cropped.clone().resize(20).webp({ quality: 28 }).toBuffer();
      const { dominant } = await cropped.clone().resize(64).stats();

      manifest[v.name] = {
        alt: job.alt,
        width: v.widths[v.widths.length - 1],
        height: Math.round(v.widths[v.widths.length - 1] / v.ratio),
        aspect: Number(v.ratio.toFixed(5)),
        src: `/img/${v.name}-${fw}.webp`,
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
