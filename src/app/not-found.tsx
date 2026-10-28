import { SITE } from '@/lib/config';


export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-void px-5 text-center">
      <div>
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-5 text-[clamp(2.25rem,8vw,4rem)]">Esta página no existe.</h1>
        {/* <a> a la URL de la web y no next/link: esta página va en el layout
            raíz, y next/link añadiría un archivo de JavaScript a la carga de
            la portada. Desde un 404 basta con una navegación normal. */}
        <a
          href={`${SITE.url}/`}
          className="mt-10 inline-flex h-14 items-center rounded-full bg-accent px-7 text-[0.9375rem] font-medium text-white"
        >
          Volver al inicio
        </a>
      </div>
    </main>
  );
}
