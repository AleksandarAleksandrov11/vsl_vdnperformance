# assets-src — originales

Fotos y logo originales que envió el cliente. **Esta carpeta NO se despliega**:
está fuera de `public/`, así que no acaba en `out/` ni ocupa espacio en Vercel.

De aquí salen todas las imágenes de la web. El pipeline es:

```bash
npm run assets    # scripts/build-assets.mjs
```

Ese script, por cada imagen:

1. corrige la orientación EXIF y **borra los metadatos** (incluida la geolocalización);
2. **difumina la matrícula** (dato personal de terceros, RGPD);
3. recorta al encuadre de cada hueco de la página respetando un punto focal;
4. aplica un grado de color común (algo más de contraste, menos saturación) para
   que fotos hechas con luces muy distintas se vean coherentes;
5. exporta AVIF + WebP + JPEG de respaldo en varios anchos a `public/img/`;
6. genera un LQIP (miniatura en base64) y el color dominante en
   `src/lib/images.generated.ts`.

Las coordenadas de matrícula y los encuadres están en `scripts/build-assets.mjs`.
Si añades una foto nueva, añádela ahí también.

`IMG_0741.mov` no se usa en la web (el brief pide no usar vídeo de fondo en móvil).
