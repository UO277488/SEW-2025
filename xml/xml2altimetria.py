#!/usr/bin/env python3
import xml.etree.ElementTree as ET
from pathlib import Path
import math

SRC = Path(__file__).parent / 'circuitoEsquema.xml'
OUT_SVG = Path(__file__).parent / 'altimetria.svg'

def main():
    tree = ET.parse(SRC)
    root = tree.getroot()
    ns = root.tag[1:].split('}')[0] if root.tag.startswith('{') else ''
    def t(name):
        return f'{{{ns}}}{name}' if ns else name

    altitudes = []
    distances = []
    total = 0.0
    for tramo in root.findall(t('tramos') + '/' + t('tramo')):
        dist_attr = tramo.get('distancia') or '0'
        try:
            d = float(dist_attr)
        except:
            d = 0.0
        p = tramo.find(t('punto'))
        c = p.find(t('coordenada'))
        alt = float(c.find(t('altitud')).text.strip())
        total += d
        distances.append(total)
        altitudes.append(alt)

    if not altitudes:
        print('No hay tramos/altitudes en el XML')
        return

    width = 900
    height = 300
    margin = 40

    max_alt = max(altitudes)
    min_alt = min(altitudes)
    if math.isclose(max_alt, min_alt):
        max_alt += 1

    xs = [margin + (d / distances[-1]) * (width - 2*margin) for d in distances]
    ys = [margin + (1 - ((a - min_alt) / (max_alt - min_alt))) * (height - 2*margin) for a in altitudes]

    points = ' '.join([f'{x:.2f},{y:.2f}' for x,y in zip(xs,ys)])

    svg = [f'<?xml version="1.0" encoding="utf-8"?>', f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">', '<rect width="100%" height="100%" fill="#fff"/>']

    svg.append(f'<line x1="{margin}" y1="{height-margin}" x2="{width-margin}" y2="{height-margin}" stroke="#333"/>')
    svg.append(f'<line x1="{margin}" y1="{margin}" x2="{margin}" y2="{height-margin}" stroke="#333"/>')
    # polyline
    svg.append(f'<polyline fill="none" stroke="#d9534f" stroke-width="2" points="{points}"/>')
    # markers
    for i,(x,y,a) in enumerate(zip(xs,ys,altitudes)):
        svg.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="3" fill="#337ab7"/>')
        svg.append(f'<text x="{x+4:.2f}" y="{y-4:.2f}" font-size="10" fill="#222">{int(a)}m</text>')

    svg.append('</svg>')
    OUT_SVG.write_text('\n'.join(svg), encoding='utf-8')
    print(f'Generado {OUT_SVG}')

if __name__ == '__main__':
    main()
