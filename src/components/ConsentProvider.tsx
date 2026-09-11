'use client';

import { useEffect } from 'react';
import { initTracking } from '@/lib/tracking';
import { CookieBanner } from './CookieBanner';

/**
 * Envuelve toda la app: arranca la medición (que por dentro no hace nada hasta
 * que hay consentimiento) y pinta el banner de cookies.
 *
 * Va en el layout para que el banner esté también en las páginas legales: si
 * alguien entra directo a la política de privacidad, tiene que poder decidir
 * igual que en la portada.
 */
export function ConsentProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => initTracking(), []);

  return (
    <>
      {children}
      <CookieBanner />
    </>
  );
}
