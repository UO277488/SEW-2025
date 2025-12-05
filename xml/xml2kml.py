#!/usr/bin/env python3
"""
xml2kml.py
Genera `circuito.kml` a partir de `circuitoEsquema.xml`.
Uso: python xml2kml.py
"""
import xml.etree.ElementTree as ET
from pathlib import Path

SRC = Path(__file__).parent / 'circuitoEsquema.xml'
OUT = Path(__file__).parent / 'circuito.kml'

def main():
    tree = ET.parse(SRC)
    root = tree.getroot()
    ns = root.tag[1:].split('}')[0] if root.tag.startswith('{') else ''
    def t(name):
        return f'{{{ns}}}{name}' if ns else name

    # gather coordinates from origen and tramos
    origen = root.find(t('origen'))
    coords = []
    if origen is not None:
        c = origen.find(t('coordenada'))
        lon = c.find(t('longitud')).text.strip()
        lat = c.find(t('latitud')).text.strip()
        coords.append((lon, lat))

    for tramo in root.findall(t('tramos') + '/' + t('tramo')):
        p = tramo.find(t('punto'))
        c = p.find(t('coordenada'))
        lon = c.find(t('longitud')).text.strip()
        lat = c.find(t('latitud')).text.strip()
        coords.append((lon, lat))

    # build KML
    kml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<kml xmlns="http://www.opengis.net/kml/2.2">',
           '<Document>']
    name = root.find(t('nombreCircuito'))
    if name is not None:
        kml.append(f'<name>{name.text}</name>')

    # Placemark for origin
    if origen is not None:
        lon, lat = coords[0]
        kml.append('<Placemark><name>Origen</name><Point><coordinates>{},{},0</coordinates></Point></Placemark>'.format(lon, lat))

    # LineString for track
    coord_text = ' '.join([f'{lon},{lat},0' for lon, lat in coords])
    kml.append('<Placemark><name>Trazo circuito</name><LineString><tessellate>1</tessellate><coordinates>')
    kml.append(coord_text)
    kml.append('</coordinates></LineString></Placemark>')

    # points for tramos with sector label
    for i, tramo in enumerate(root.findall(t('tramos') + '/' + t('tramo'))):
        p = tramo.find(t('punto'))
        c = p.find(t('coordenada'))
        lon = c.find(t('longitud')).text.strip()
        lat = c.find(t('latitud')).text.strip()
        sector = tramo.find(t('sector')).text.strip()
        kml.append(f'<Placemark><name>Tramo {i+1} (sector {sector})</name><Point><coordinates>{lon},{lat},0</coordinates></Point></Placemark>')

    kml.append('</Document></kml>')

    OUT.write_text('\n'.join(kml), encoding='utf-8')
    print(f'Generado {OUT}')

if __name__ == '__main__':
    main()
