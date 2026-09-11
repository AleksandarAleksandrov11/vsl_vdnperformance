import { ComoFunciona } from '@/components/ComoFunciona';
import { CtaFinal } from '@/components/CtaFinal';
import { CurvaPotencia } from '@/components/CurvaPotencia';
import { Faq } from '@/components/Faq';
import { FloatingUi } from '@/components/FloatingUi';
import { Footer } from '@/components/Footer';
import { Formulario } from '@/components/Formulario';
import { Garantia } from '@/components/Garantia';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Impacto } from '@/components/Impacto';
import { JsonLd } from '@/components/JsonLd';
import { Marcas } from '@/components/Marcas';
import { PorQue } from '@/components/PorQue';
import { Resenas } from '@/components/Resenas';
import { Servicios } from '@/components/Servicios';
import { Trabajos } from '@/components/Trabajos';

export default function Home() {
  return (
    <>
      <JsonLd />
      <Header />

      <main id="contenido">
        <Hero />
        <Marcas />
        <PorQue />
        <CurvaPotencia />
        <Servicios />
        <ComoFunciona />
        <Impacto />
        <Trabajos />
        <Resenas />
        <Garantia />
        <Formulario />
        <Faq />
        <CtaFinal />
      </main>

      <Footer />
      <FloatingUi />
    </>
  );
}
