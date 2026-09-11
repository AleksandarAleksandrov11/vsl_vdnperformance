import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-void px-5 text-center">
      <div>
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-5 text-[clamp(2.25rem,8vw,4rem)]">Esta página no existe.</h1>
        <Link
          href="/"
          className="mt-10 inline-flex h-14 items-center rounded-full bg-accent px-7 text-[0.9375rem] font-medium text-white"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
