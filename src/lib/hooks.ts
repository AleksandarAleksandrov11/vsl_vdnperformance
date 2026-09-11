'use client';

import { useEffect, useRef, useState } from 'react';

/** true si el usuario ha pedido menos movimiento en su sistema. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/**
 * Dispara una sola vez cuando el elemento entra en pantalla.
 * IntersectionObserver, no scroll: no bloquea el hilo principal.
 */
export function useInViewOnce<T extends HTMLElement>(
  options: { rootMargin?: string; threshold?: number } = {},
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  const { rootMargin = '0px 0px -12% 0px', threshold = 0.2 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold, visible]);

  return [ref, visible];
}

/**
 * Contador que sube de 0 a `to` cuando arranca.
 * Usa requestAnimationFrame y una curva easeOutExpo, que es la que hace que un
 * número "frene" al final en vez de pararse en seco.
 */
export function useCountUp(to: number, run: boolean, duracionMs = 1400): number {
  const [valor, setValor] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!run) return;
    if (reduced) {
      setValor(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duracionMs);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setValor(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, duracionMs, reduced]);

  return valor;
}

/** Posición de scroll, leída con rAF para no disparar layouts en cada evento. */
export function useScrollY(): number {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setY(window.scrollY);
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return y;
}
