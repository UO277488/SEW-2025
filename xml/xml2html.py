#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xml2html.py
Genera `InfoCircuito.html` a partir de `circuitoEsquema.xml`.
Obligatorio: usar xml.etree.ElementTree y extraer información con expresiones XPath.
Se crea una clase Html para componer el documento.

Uso: python xml/xml2html.py
"""
import xml.etree.ElementTree as ET
from pathlib import Path
import html as htmllib

SRC = Path(__file__).parent / 'circuitoEsquema.xml'
OUT = Path(__file__).parent.parent / 'InfoCircuito.html'


class Html:
    def __init__(self, title='Info circuito'):
        self.title = title
        self.lines = []

    def add(self, s=''):
        self.lines.append(s)

    def header(self):
        self.add('<!doctype html>')
        self.add("<html lang=\"es\">")
        self.add('<head>')
        self.add('  <meta charset="utf-8">')
        self.add('  <meta name="viewport" content="width=device-width, initial-scale=1">')
        self.add(f'  <title>{htmllib.escape(self.title)}</title>')
        # link to project CSS
        self.add('  <link rel="stylesheet" href="estilo/estilo.css">')
        self.add('</head>')
        self.add('<body>')

    def footer(self):
        self.add('</body>')
        self.add('</html>')

    def nav(self):
        self.add('  <header>')
        self.add('    <h1><a href="index.html" title="Ir a la página principal">MotoGP Desktop</a></h1>')
        self.add('    <nav>')
        self.add('      <a href="index.html">Inicio</a>')
        self.add('      <a href="piloto.html">Piloto</a>')
        self.add('      <a href="circuito.html">Circuito</a>')
        self.add('      <a href="meteorología.html">Meteorología</a>')
        self.add('      <a href="clasificaciones.php">Clasificaciones</a>')
        self.add('      <a href="juegos.html">Juegos</a>')
        self.add('      <a href="ayuda.html" class="active">Ayuda</a>')
        self.add('    </nav>')
        self.add('  </header>')

    def section_title(self, title):
        self.add(f'  <h2>{htmllib.escape(title)}</h2>')

    def to_string(self):
        return '\n'.join(self.lines)


def ns_map(root):
    # detect namespace if present
    tag = root.tag
    if tag.startswith('{'):
        uri = tag[1:tag.find('}')]
        return {'ns': uri}
    return {}


def text_or_empty(elem):
    return elem.text.strip() if elem is not None and elem.text is not None else ''


def generate():
    tree = ET.parse(SRC)
    root = tree.getroot()
    ns = ns_map(root)

    # helper to use XPath with namespace prefix 'ns' when available
    def xp(path):
        return root.find(path, ns) if ns else root.find(path)

    def xps(path):
        return root.findall(path, ns) if ns else root.findall(path)

    # build HTML
    page = Html(title='Info circuito')
    page.header()
    page.nav()

    page.add('<main>')
    page.add('  <p>Estás en: <a href="index.html">Inicio</a> &gt;&gt; <strong>Información del circuito</strong></p>')

    # Mandatory fields (excluding origen and tramos)
    nombre = text_or_empty(xp('ns:nombreCircuito') if ns else xp('nombreCircuito'))
    extension_elem = xp('ns:extension') if ns else xp('extension')
    extension = text_or_empty(extension_elem)
    extension_unidad = extension_elem.get('unidad') if extension_elem is not None else ''

    anchura_elem = xp('ns:anchura') if ns else xp('anchura')
    anchura = text_or_empty(anchura_elem)
    anchura_unidad = anchura_elem.get('unidad') if anchura_elem is not None else ''

    fecha = text_or_empty(xp('ns:fecha') if ns else xp('fecha'))
    hora = text_or_empty(xp('ns:hora') if ns else xp('hora'))
    vueltas = text_or_empty(xp('ns:vueltas') if ns else xp('vueltas'))

    localidad = text_or_empty(xp('ns:localidad') if ns else xp('localidad'))
    pais = text_or_empty(xp('ns:pais') if ns else xp('pais'))
    patrocinador = text_or_empty(xp('ns:patrocinador') if ns else xp('patrocinador'))

    # referencias (list)
    referencias = xps('ns:referencias/ns:referencia') if ns else xps('referencias/referencia')

    # galeriaFotos
    fotos = xps('ns:galeriaFotos/ns:foto') if ns else xps('galeriaFotos/foto')

    # galeriaVideos
    videos = xps('ns:galeriaVideos/ns:video') if ns else xps('galeriaVideos/video')

    # ganador and podio
    ganador_elem = xp('ns:ganador/ns:nombreGanador') if ns else xp('ganador/nombreGanador')
    ganador = text_or_empty(ganador_elem)
    tiempo_elem = xp('ns:ganador/ns:tiempo') if ns else xp('ganador/tiempo')
    tiempo = text_or_empty(tiempo_elem)

    podio_nodes = xps('ns:podio/ns:corredor') if ns else xps('podio/corredor')

    # Header info
    page.add('  <section aria-label="Resumen">')
    page.add('    <h3>Resumen</h3>')
    page.add('    <table>')
    page.add('      <tr><th>Nombre</th><td>{}</td></tr>'.format(htmllib.escape(nombre)))
    page.add('      <tr><th>Extensión</th><td>{} {}</td></tr>'.format(htmllib.escape(extension), htmllib.escape(extension_unidad)))
    page.add('      <tr><th>Anchura</th><td>{} {}</td></tr>'.format(htmllib.escape(anchura), htmllib.escape(anchura_unidad)))
    page.add('      <tr><th>Vueltas</th><td>{}</td></tr>'.format(htmllib.escape(vueltas)))
    page.add('      <tr><th>Localidad</th><td>{}</td></tr>'.format(htmllib.escape(localidad)))
    page.add('      <tr><th>País</th><td>{}</td></tr>'.format(htmllib.escape(pais)))
    page.add('      <tr><th>Patrocinador</th><td>{}</td></tr>'.format(htmllib.escape(patrocinador)))
    page.add('      <tr><th>Fecha</th><td>{}</td></tr>'.format(htmllib.escape(fecha)))
    page.add('      <tr><th>Hora</th><td>{}</td></tr>'.format(htmllib.escape(hora)))
    page.add('    </table>')
    page.add('  </section>')

    # Referencias
    page.add('  <section aria-label="Referencias">')
    page.add('    <h3>Referencias</h3>')
    if referencias:
        page.add('    <ul>')
        for r in referencias:
            page.add('      <li>{}</li>'.format(htmllib.escape(text_or_empty(r))))
        page.add('    </ul>')
    else:
        page.add('    <p>No hay referencias disponibles.</p>')
    page.add('  </section>')

    # Galería de fotos
    page.add('  <section aria-label="Galería de fotos">')
    page.add('    <h3>Galería de fotos</h3>')
    if fotos:
        for f in fotos:
            src = f.get('src') if f is not None else ''
            src = src.replace('\\', '/').strip()
            alt = Path(src).stem if src else 'foto'
            page.add(f'      <figure><img src="{htmllib.escape(src)}" alt="Foto {htmllib.escape(alt)}"/>')
            caption = text_or_empty(f)
            if caption:
                page.add(f'        <figcaption>{htmllib.escape(caption)}</figcaption>')
            page.add('      </figure>')
    else:
        page.add('    <p>No hay fotos disponibles.</p>')
    page.add('  </section>')

    # Galería de vídeos
    page.add('  <section aria-label="Galería de vídeos">')
    page.add('    <h3>Galería de vídeos</h3>')
    if videos:
        page.add('    <ul>')
        for v in videos:
            src = v.get('src') if v is not None else ''
            src = src.replace('\\', '/').strip()
            page.add(f'      <li><a href="{htmllib.escape(src)}">{htmllib.escape(Path(src).name)}</a></li>')
        page.add('    </ul>')
    else:
        page.add('    <p>No hay vídeos disponibles.</p>')
    page.add('  </section>')

    # Ganador y podio
    page.add('  <section aria-label="Ganador">')
    page.add('    <h3>Ganador</h3>')
    if ganador or tiempo:
        page.add(f'    <p>{htmllib.escape(ganador)} — {htmllib.escape(tiempo)}</p>')
    else:
        page.add('    <p>Sin información del ganador.</p>')
    page.add('  </section>')

    page.add('  <section aria-label="Podio">')
    page.add('    <h3>Podio</h3>')
    if podio_nodes:
        page.add('    <table><thead><tr><th>Pos</th><th>Nombre</th><th>Puntos</th></tr></thead><tbody>')
        for corredor in podio_nodes:
            pos = text_or_empty(corredor.find('ns:posicion', ns) if ns else corredor.find('posicion'))
            nombrec = text_or_empty(corredor.find('ns:nombreCorredorPodio', ns) if ns else corredor.find('nombreCorredorPodio'))
            pts = text_or_empty(corredor.find('ns:puntos', ns) if ns else corredor.find('puntos'))
            page.add(f'      <tr><td>{htmllib.escape(pos)}</td><td>{htmllib.escape(nombrec)}</td><td>{htmllib.escape(pts)}</td></tr>')
        page.add('    </tbody></table>')
    else:
        page.add('    <p>No hay datos del podio.</p>')
    page.add('  </section>')

    page.add('</main>')

    page.footer()

    # write file
    OUT.write_text(page.to_string(), encoding='utf-8')
    print(f'Generado {OUT}')


if __name__ == '__main__':
    generate()
