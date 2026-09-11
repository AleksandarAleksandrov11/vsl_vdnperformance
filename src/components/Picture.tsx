import { IMAGES, type ImageKey } from '@/lib/images.generated';

type Props = {
  /** Clave del hueco en images.generated.ts. Es el encuadre por defecto. */
  name: ImageKey;
  /**
   * Encuadres alternativos por media query, para dirección de arte: en móvil
   * un recorte vertical y en escritorio uno apaisado, por ejemplo.
   * Van antes que el encuadre por defecto y el navegador descarga sólo el que
   * coincide, nunca los dos.
   */
  art?: { name: ImageKey; media: string }[];
  /** Sobrescribe el alt del manifiesto. "" para imágenes decorativas. */
  alt?: string;
  /** Atributo sizes. Cuanto más ajustado, menos bytes descarga el móvil. */
  sizes: string;
  /** Sólo la imagen del hero: carga inmediata y prioritaria. */
  priority?: boolean;
  className?: string;
  imgClassName?: string;
};

const srcset = (list: readonly { src: string; w: number }[]) =>
  list.map((s) => `${s.src} ${s.w}w`).join(', ');

/**
 * <picture> con AVIF, WebP y un JPEG de respaldo, ya generados en build time.
 *
 * Se hace a mano en vez de con next/image porque la web se exporta estática
 * (`output: 'export'`), donde next/image va sin optimizador y acabaría sirviendo
 * el original entero. Aquí cada hueco tiene sus anchos exactos.
 *
 * Mientras la imagen llega se pinta el LQIP (miniatura de 20 px en base64) como
 * fondo, así que nunca hay un rectángulo vacío. El width/height reserva el
 * sitio desde el primer pintado y no hay salto de maquetación.
 */
export function Picture({
  name,
  art = [],
  alt,
  sizes,
  priority = false,
  className = '',
  imgClassName = '',
}: Props) {
  const img = IMAGES[name];

  return (
    <picture className={className}>
      {art.flatMap(({ name: key, media }) => [
        <source key={`${key}-avif`} media={media} type="image/avif" srcSet={srcset(IMAGES[key].avif)} sizes={sizes} />,
        <source key={`${key}-webp`} media={media} type="image/webp" srcSet={srcset(IMAGES[key].webp)} sizes={sizes} />,
      ])}
      <source type="image/avif" srcSet={srcset(img.avif)} sizes={sizes} />
      <source type="image/webp" srcSet={srcset(img.webp)} sizes={sizes} />
      <img
        src={img.src}
        alt={alt ?? img.alt}
        width={img.width}
        height={img.height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        className={imgClassName}
        style={{
          backgroundImage: `url("${img.lqip}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
    </picture>
  );
}
