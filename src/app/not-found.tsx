import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-ink px-6 text-center">
      <div>
        <p className="font-display text-sm font-semibold tracking-[0.28em] text-blue-300 uppercase">
          Error 404
        </p>
        <h1 className="text-metal mt-3 text-[clamp(2rem,9vw,3.5rem)]">Esta página no existe</h1>
        <p className="mt-4 text-mist">Vuelve al inicio y calcula lo que puede ganar tu coche.</p>
        <Link
          href="/"
          className="bg-blue-grad glow-blue tap mt-8 inline-flex items-center justify-center rounded-xl px-7 font-semibold text-white"
        >
          Volver a la página
        </Link>
      </div>
    </main>
  );
}
