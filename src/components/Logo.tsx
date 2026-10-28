/**
 * Logo de la marca. Va en un <picture> con su fuente WebP, como el resto de
 * imágenes de la web (Picture.tsx), y sin next/image: con `images.unoptimized`
 * no optimiza nada y sólo añadiría JavaScript de cliente a la primera carga.
 */
export function Logo({ className = '', lazy = false }: { className?: string; lazy?: boolean }) {
  return (
    <picture>
      <source type="image/webp" srcSet="/logo-vdn.webp" />
      <img
        src="/logo-vdn.webp"
        alt="VDN Performance"
        width={400}
        height={97}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
