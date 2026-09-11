#!/usr/bin/env python3
"""
build_brand.py — logo recortado, favicons, iconos PWA y imagen Open Graph.

Todo sale del logo original (assets-src/logo-vdn.png), así que la marca es
siempre la misma y no hay versiones sueltas por ahí.

Qué hace:
  1. Recorta el logo y le pone transparencia real (el original viene con fondo
     negro plano), para poder usarlo sobre cualquier fondo.
  2. Vectoriza la "N" azul y escribe src/app/icon.svg. A 16 px "VDN" no se lee;
     la N sí, y es la parte del logo que más se reconoce.
  3. Genera favicon.ico (16/32/48), apple-icon 180 (sin transparencia, con
     fondo #0A0A0C como pide iOS), icon-192, icon-512 y icon-maskable-512.
  4. Compone la imagen Open Graph de 1200x630.

Los resultados están commiteados: no hace falta ejecutarlo salvo que cambie
el logo. Necesita: pillow, numpy y scikit-image.

    python3 scripts/build_brand.py
"""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFont
from skimage import measure

ROOT = Path(__file__).resolve().parent.parent
SRC_LOGO = ROOT / "assets-src" / "logo-vdn.png"
PUBLIC = ROOT / "public"
APP = ROOT / "src" / "app"
FONTS = ROOT / "scripts" / ".fonts"

INK = (10, 10, 12)
BLUE = (30, 107, 240)
BLUE_HI = (90, 160, 255)

# Fuentes de Google para la imagen Open Graph.
# Son los .ttf completos, no los .woff2 del CSS moderno: esos vienen partidos
# por subconjuntos Unicode y el primero que sirve Google no trae el latino, así
# que el texto saldría en cajas vacías.
FONT_URLS = {
    "chakra700.ttf": "https://fonts.gstatic.com/s/chakrapetch/v13/cIflMapbsEk7TDLdtEz1BwkeJI91R5_A.ttf",
    "chakra300.ttf": "https://fonts.gstatic.com/s/chakrapetch/v13/cIflMapbsEk7TDLdtEz1BwkeNIh1R5_A.ttf",
    "inter600.ttf": "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf",
}


def ensure_fonts() -> dict[str, Path]:
    """Descarga los .ttf de Google Fonts si no están ya en scripts/.fonts."""
    FONTS.mkdir(parents=True, exist_ok=True)
    out: dict[str, Path] = {}
    for name, url in FONT_URLS.items():
        ttf = FONTS / name
        if not ttf.exists():
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            ttf.write_bytes(urllib.request.urlopen(req, timeout=40).read())
        out[ttf.stem] = ttf
    return out


# --------------------------------------------------------------------------- #
# 1. Logo con transparencia
# --------------------------------------------------------------------------- #

def logo_transparente() -> Image.Image:
    """
    El logo original está sobre negro plano. La transparencia se saca de la
    luminancia: el fondo tiene luminancia ~11 y las letras entre 60 y 255.
    Después se "desmultiplica" el color para que el borde no se vea gris al
    ponerlo sobre un fondo claro.
    """
    rgb = np.asarray(Image.open(SRC_LOGO).convert("RGB")).astype(np.float32)
    lum = rgb.max(axis=2)

    alpha = np.clip((lum - 24.0) / (205.0 - 24.0), 0.0, 1.0)
    # El fondo del original no es negro puro: tiene grano y un viñeteado que
    # dejarían un halo casi transparente alrededor de las letras (y un recorte
    # enorme). Todo lo que quede por debajo del 7% se considera fondo.
    alpha[alpha < 0.07] = 0.0

    safe = np.maximum(alpha, 1e-3)[..., None]
    color = np.clip(rgb / safe, 0, 255)

    out = np.dstack([color, alpha * 255.0]).astype(np.uint8)
    img = Image.fromarray(out, "RGBA")
    return img.crop(img.getbbox())


# --------------------------------------------------------------------------- #
# 2. Vectorizado de la "N"
# --------------------------------------------------------------------------- #

def trazar_n(tolerancia: float = 4.0, escala: int = 3) -> tuple[list[list[tuple[float, float]]], tuple[float, float, float, float]]:
    """La N es azul saturada: se aísla por color y se traza su contorno."""
    a = np.asarray(Image.open(SRC_LOGO).convert("RGB")).astype(np.int16)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mask = (b > 90) & (b > r + 45) & (b > g + 30)

    up = Image.fromarray((mask * 255).astype(np.uint8)).resize(
        (mask.shape[1] * escala, mask.shape[0] * escala), Image.LANCZOS
    )
    m = np.pad(np.asarray(up).astype(np.float32) / 255.0, 1, constant_values=0)

    polys = []
    for c in measure.find_contours(m, 0.5):
        if len(c) < 30:
            continue
        p = measure.approximate_polygon(c, tolerance=tolerancia)
        if len(p) >= 3:
            polys.append([(float(x) / escala, float(y) / escala) for y, x in p])

    xs = [x for p in polys for x, _ in p]
    ys = [y for p in polys for _, y in p]
    return polys, (min(xs), min(ys), max(xs), max(ys))


def escribir_icon_svg(polys, bbox) -> None:
    """icon.svg: la N en un cuadrado de 64 con aire alrededor, sobre #0A0A0C."""
    x0, y0, x1, y1 = bbox
    w, h = x1 - x0, y1 - y0
    caja = 42.0  # lado útil dentro del lienzo de 64
    s = caja / max(w, h)
    ox = (64 - w * s) / 2 - x0 * s
    oy = (64 - h * s) / 2 - y0 * s

    d = " ".join(
        "M " + " L ".join(f"{x * s + ox:.2f},{y * s + oy:.2f}" for x, y in p) + " Z"
        for p in polys
    )

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="VDN Performance">
  <title>VDN Performance</title>
  <defs>
    <linearGradient id="n" x1="14%" y1="0%" x2="86%" y2="100%">
      <stop offset="0%" stop-color="#0042BA"/>
      <stop offset="100%" stop-color="#2E7BFF"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="12" fill="#0A0A0C"/>
  <path d="{d}" fill="url(#n)" fill-rule="evenodd"/>
</svg>
"""
    (APP / "icon.svg").write_text(svg, encoding="utf-8")
    print(f"  · src/app/icon.svg ({sum(len(p) for p in polys)} vértices)")


def render_n(size: int, pad: float, fondo: tuple[int, int, int] | None, radio: float = 0.0) -> Image.Image:
    """Dibuja la N centrada, con degradado azul, en un cuadrado de `size`."""
    polys, (x0, y0, x1, y1) = trazar_n(tolerancia=2.0)
    ss = 4  # supermuestreo: los cortes en ángulo quedan limpios
    S = size * ss
    caja = S * (1 - 2 * pad)
    w, h = x1 - x0, y1 - y0
    s = caja / max(w, h)
    ox = (S - w * s) / 2 - x0 * s
    oy = (S - h * s) / 2 - y0 * s

    # Degradado azul en diagonal, como la N del logo.
    grad = Image.new("RGB", (S, S))
    gx = np.linspace(0, 1, S)[None, :]
    gy = np.linspace(0, 1, S)[:, None]
    t = np.clip(gx * 0.55 + gy * 0.45, 0, 1)
    arr = np.dstack([
        (0x00 + (0x2E - 0x00) * t),
        (0x42 + (0x7B - 0x42) * t),
        (0xBA + (0xFF - 0xBA) * t),
    ]).astype(np.uint8)
    grad = Image.fromarray(np.broadcast_to(arr, (S, S, 3)).copy())

    shape = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(shape)
    for p in polys:
        d.polygon([(x * s + ox, y * s + oy) for x, y in p], fill=255)

    capa = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    capa.paste(grad, (0, 0), shape)

    if fondo is None:
        base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    else:
        base = Image.new("RGBA", (S, S), (*fondo, 255))
        if radio > 0:
            mascara = Image.new("L", (S, S), 0)
            ImageDraw.Draw(mascara).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radio), fill=255)
            base.putalpha(mascara)

    base.alpha_composite(capa)
    return base.resize((size, size), Image.LANCZOS)


# --------------------------------------------------------------------------- #
# 4. Imagen Open Graph
# --------------------------------------------------------------------------- #

def build_og(fonts: dict[str, Path], logo: Image.Image) -> None:
    W, H = 1200, 630
    ss = 2  # se compone al doble y se reduce: texto y línea quedan más finos
    img = Image.new("RGB", (W * ss, H * ss), INK)
    d = ImageDraw.Draw(img)

    # Rejilla técnica, la misma del hero.
    for x in range(0, W * ss, 48 * ss):
        d.line([(x, 0), (x, H * ss)], fill=(23, 25, 31), width=ss)
    for y in range(0, H * ss, 48 * ss):
        d.line([(0, y), (W * ss, y)], fill=(23, 25, 31), width=ss)

    # Resplandor azul difuso desde abajo, apagado hacia los bordes.
    glow = Image.new("RGB", (W * ss, H * ss), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(40, 0, -1):
        k = i / 40
        rx, ry = 520 * ss * k, 300 * ss * k
        gd.ellipse(
            [W * ss / 2 - rx, H * ss * 1.06 - ry, W * ss / 2 + rx, H * ss * 1.06 + ry],
            fill=(int(6 * (1 - k)), int(26 * (1 - k)), int(74 * (1 - k))),
        )
    img = Image.blend(img, ImageChops.add(img, glow), 1.0)
    d = ImageDraw.Draw(img)

    # Logo centrado arriba.
    lw = 470 * ss
    lh = round(logo.height * lw / logo.width)
    lg = logo.resize((lw, lh), Image.LANCZOS)
    top = 96 * ss
    img.paste(lg, ((W * ss - lw) // 2, top), lg)

    # Línea azul fina, desvaneciéndose hacia los lados.
    y_rule = top + lh + 52 * ss
    half = 200 * ss
    for i in range(-half, half):
        k = 1 - abs(i) / half
        d.rectangle(
            [W * ss / 2 + i, y_rule, W * ss / 2 + i, y_rule + ss],
            fill=(int(10 + 20 * k), int(10 + 97 * k), int(12 + 228 * k)),
        )

    # Reclamo principal.
    f_main = ImageFont.truetype(str(fonts["chakra700"]), 50 * ss)
    texto = "STAGE 1 DESDE 219 €  ·  COLLADO VILLALBA"
    tw = d.textlength(texto, font=f_main)
    d.text(((W * ss - tw) / 2, y_rule + 34 * ss), texto, font=f_main, fill=(240, 242, 246))

    f_sub = ImageFont.truetype(str(fonts["inter600"]), 25 * ss)
    sub = "15 días de garantía · Presupuesto gratis en menos de 24 h"
    sw = d.textlength(sub, font=f_sub)
    d.text(((W * ss - sw) / 2, y_rule + 108 * ss), sub, font=f_sub, fill=(152, 157, 170))

    img = img.resize((W, H), Image.LANCZOS)
    for nombre in ("opengraph-image.jpg", "twitter-image.jpg"):
        img.save(APP / nombre, quality=88, optimize=True, progressive=True)
    print(f"  · src/app/opengraph-image.jpg + twitter-image.jpg  {W}x{H}")


# --------------------------------------------------------------------------- #

def main() -> None:
    PUBLIC.mkdir(exist_ok=True)
    APP.mkdir(parents=True, exist_ok=True)
    fonts = ensure_fonts()

    print("Logo:")
    logo = logo_transparente()
    logo.save(PUBLIC / "logo-vdn.png", optimize=True)
    # Versión para la web: en la cabecera se ve a 24 px de alto y en el pie a 28.
    # Con 400 px de ancho sobra incluso en una pantalla a 3x, y baja de 44 kB a
    # unos 6 kB, que es ancho de banda que le quitábamos a la foto del hero.
    web = logo.resize((400, round(logo.height * 400 / logo.width)), Image.LANCZOS)
    web.save(PUBLIC / "logo-vdn.webp", quality=88, method=6)
    print(f"  · public/logo-vdn.png {logo.width}x{logo.height} · logo-vdn.webp {web.width}x{web.height}")

    print("Iconos:")
    polys, bbox = trazar_n()
    escribir_icon_svg(polys, bbox)

    # favicon.ico — la N a sangre, con muy poco aire: a 16 px cada píxel cuenta.
    # Se guarda en RGBA: el empaquetador de Next rechaza los .ico cuyos PNG
    # internos vienen en RGB.
    ico = render_n(64, pad=0.11, fondo=INK)
    ico.save(APP / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("  · src/app/favicon.ico (16/32/48)")

    # apple-icon: sin transparencia, iOS la pinta en negro si la hay.
    render_n(180, pad=0.17, fondo=INK).convert("RGB").save(APP / "apple-icon.png", optimize=True)
    print("  · src/app/apple-icon.png 180x180")

    render_n(192, pad=0.15, fondo=INK).save(PUBLIC / "icon-192.png", optimize=True)
    render_n(512, pad=0.15, fondo=INK).save(PUBLIC / "icon-512.png", optimize=True)
    # Maskable: Android recorta hasta un 20% por lado, así que margen de sobra.
    render_n(512, pad=0.29, fondo=INK).save(PUBLIC / "icon-maskable-512.png", optimize=True)
    print("  · public/icon-192.png, icon-512.png, icon-maskable-512.png")

    print("Open Graph:")
    build_og(fonts, logo)

    manifest = {
        "name": "VDN Performance",
        "short_name": "VDN",
        "description": "Reprogramación de centralitas en Collado Villalba. Stage 1 desde 219 €.",
        "start_url": "/",
        "scope": "/",
        "display": "standalone",
        "orientation": "portrait",
        "lang": "es-ES",
        "theme_color": "#0A0A0C",
        "background_color": "#0A0A0C",
        "icons": [
            {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (PUBLIC / "site.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("  · public/site.webmanifest")


if __name__ == "__main__":
    main()
