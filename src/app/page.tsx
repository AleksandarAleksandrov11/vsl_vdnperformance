import { BarraMovil } from '@/components/BarraMovil';
import { Cierre } from '@/components/Cierre';
import { Cifras } from '@/components/Cifras';
import { Faq } from '@/components/Faq';
import { Footer } from '@/components/Footer';
import { Formulario } from '@/components/Formulario';
import { Garantia } from '@/components/Garantia';
import { Grafico } from '@/components/Grafico';
import { Hero } from '@/components/Hero';
import { Intro } from '@/components/Intro';
import { JsonLd } from '@/components/JsonLd';
import { Nav } from '@/components/Nav';
import { Proceso } from '@/components/Proceso';
import { Resenas } from '@/components/Resenas';
import { Stages } from '@/components/Stages';
import { Trabajos } from '@/components/Trabajos';

export default function Home() {
  return (
    <>
      <Intro />
      <JsonLd />
      <Nav />

      <main id="contenido">
        <Hero />
        <Cifras />
        <Stages />
        <Grafico />
        <Proceso />
        <Trabajos />
        <Resenas />
        <Garantia />
        <Formulario />
        <Faq />
        <Cierre />
      </main>

      <Footer />
      <BarraMovil />
    </>
  );
}
