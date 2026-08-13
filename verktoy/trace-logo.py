#!/usr/bin/env python3
"""
trace-logo.py — gjør en flatfarget PNG/JPG-logo om til en eksakt SVG.

Skrevet fordi maskinen mangler potrace/ImageMagick/Inkscape, og fordi en
detaljert logo ikke lar seg tegne «prikk lik» på frihånd. Her følges den
faktiske pikselkanten i stedet.

Bruk:
    python3 verktoy/trace-logo.py bilder/zebra.png logo.svg

Valgfritt:
    --terskel 128     hvor mørkt et piksel må være for å telle som fyll
    --epsilon 0.6     hvor hardt konturen forenkles (lavere = mer nøyaktig)
    --farge  #0b3d33  fyllfargen i SVG-en (som standard hentes den fra bildet)

Framgangsmåte:
  1. Bildet gjøres binært — fyll mot bakgrunn, via alfa hvis den finnes,
     ellers via lyshet.
  2. Alle konturer følges med «marching squares» langs pikselgrensene, så
     kanten blir nøyaktig der pikslene faktisk slutter.
  3. Hver kontur forenkles med Ramer–Douglas–Peucker, som fjerner punkter
     som ikke endrer formen målbart.
  4. Alt legges i én path med fill-rule="evenodd", slik at hull (øyet,
     stripene mellom) blir hull uten at de må håndteres hver for seg.
"""

import sys, os
from collections import defaultdict
from PIL import Image


def les_maske(sti, terskel):
    """Returnerer (bredde, høyde, sett med fylte piksler, dominerende farge)."""
    im = Image.open(sti).convert('RGBA')
    b, h = im.size
    px = im.load()

    fylt = set()
    sum_r = sum_g = sum_b = antall = 0

    for y in range(h):
        for x in range(b):
            r, g, bl, a = px[x, y]
            if a < 128:
                continue                      # gjennomsiktig = bakgrunn
            lyshet = 0.299 * r + 0.587 * g + 0.114 * bl
            if lyshet < terskel:
                fylt.add((x, y))
                sum_r += r; sum_g += g; sum_b += bl; antall += 1

    farge = '#0a0a0a'
    if antall:
        farge = '#%02x%02x%02x' % (sum_r // antall, sum_g // antall, sum_b // antall)
    return b, h, fylt, farge


def finn_kanter(b, h, fylt):
    """Alle kantsegmenter mellom et fylt og et tomt piksel, med retning.

    Retningen velges slik at fylt område alltid ligger til venstre. Da
    lukker segmentene seg av seg selv til hele konturer."""
    seg = {}
    for (x, y) in fylt:
        if (x, y - 1) not in fylt: seg[(x, y)]         = (x + 1, y)          # topp  →
        if (x + 1, y) not in fylt: seg[(x + 1, y)]     = (x + 1, y + 1)      # høyre ↓
        if (x, y + 1) not in fylt: seg[(x + 1, y + 1)] = (x, y + 1)          # bunn  ←
        if (x - 1, y) not in fylt: seg[(x, y + 1)]     = (x, y)              # venstre ↑
    return seg


def foelg_konturer(seg):
    """Setter segmentene sammen til lukkede løkker."""
    fra = defaultdict(list)
    for a, b in seg.items():
        fra[a].append(b)

    brukt = set()
    konturer = []
    for start in list(fra.keys()):
        for foerste in fra[start]:
            if (start, foerste) in brukt:
                continue
            loop = [start]
            a, b = start, foerste
            while True:
                brukt.add((a, b))
                loop.append(b)
                if b == start:
                    break
                neste = None
                for kand in fra.get(b, []):
                    if (b, kand) not in brukt:
                        neste = kand
                        break
                if neste is None:
                    break
                a, b = b, neste
            if len(loop) > 3:
                konturer.append(loop)
    return konturer


def rdp(punkter, eps):
    """Ramer–Douglas–Peucker: fjerner punkter som ikke endrer formen."""
    if len(punkter) < 3:
        return punkter
    a, b = punkter[0], punkter[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    lengde = (dx * dx + dy * dy) ** 0.5

    verst, verst_i = 0.0, 0
    for i in range(1, len(punkter) - 1):
        p = punkter[i]
        if lengde == 0:
            d = ((p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2) ** 0.5
        else:
            d = abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / lengde
        if d > verst:
            verst, verst_i = d, i

    if verst > eps:
        v = rdp(punkter[:verst_i + 1], eps)
        hoyre = rdp(punkter[verst_i:], eps)
        return v[:-1] + hoyre
    return [a, b]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flagg = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if '=' in a and a.startswith('--')}

    if len(args) < 2:
        print(__doc__)
        sys.exit(1)

    inn, ut = args[0], args[1]
    terskel = int(flagg.get('--terskel', 200))
    eps     = float(flagg.get('--epsilon', 0.6))

    if not os.path.exists(inn):
        print('Fant ikke bildet:', inn)
        sys.exit(1)

    b, h, fylt, funnet_farge = les_maske(inn, terskel)
    if not fylt:
        print('Ingen piksler under terskelen — prøv en høyere --terskel.')
        sys.exit(1)

    farge = flagg.get('--farge', funnet_farge)

    sys.setrecursionlimit(100000)
    konturer = foelg_konturer(finn_kanter(b, h, fylt))
    konturer = [rdp(k, eps) for k in konturer]
    konturer = [k for k in konturer if len(k) > 3]

    # Beskjær til motivet og legg på litt luft, så merket ikke klistrer
    # seg til kanten av viewBoxen.
    xs = [p[0] for k in konturer for p in k]
    ys = [p[1] for k in konturer for p in k]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    bredde, hoyde = x1 - x0, y1 - y0
    side = max(bredde, hoyde)
    dx = x0 - (side - bredde) / 2
    dy = y0 - (side - hoyde) / 2
    skala = 64.0 / side

    def f(v):
        return ('%.2f' % v).rstrip('0').rstrip('.')

    baner = []
    for k in konturer:
        d = 'M' + ' L'.join(
            '%s %s' % (f((p[0] - dx) * skala), f((p[1] - dy) * skala)) for p in k
        ) + ' Z'
        baner.append(d)

    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" '
        'role="img" aria-label="Index Development">\n'
        '  <title>Index Development</title>\n'
        '  <path fill="currentColor" fill-rule="evenodd" d="%s"/>\n'
        '</svg>\n' % ' '.join(baner)
    )
    open(ut, 'w', encoding='utf-8').write(svg)

    print('Kilde     :', inn, '(%dx%d)' % (b, h))
    print('Konturer  :', len(konturer))
    print('Punkter   :', sum(len(k) for k in konturer))
    print('Farge     :', farge, '(funnet i bildet)' if '--farge' not in flagg else '(oppgitt)')
    print('Skrevet   :', ut, '— %.1f kB' % (len(svg) / 1024))


if __name__ == '__main__':
    main()
