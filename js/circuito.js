// Clase para cargar y mostrar altimetria.svg en el DOM usando jQuery o DOM nativo
class CargadorAltimetriaSVG {
  constructor(inputSelector, containerSelector) {
    this.inputSelector = inputSelector;
    this.containerSelector = containerSelector;
    this.svgContent = null;
    this.#configAltimetriaReader();
  }

  #configAltimetriaReader() {
    const inputFile = document.querySelector(this.inputSelector);
    if (inputFile) {
      inputFile.addEventListener('change', (e) => {
        this.leerArchivoAltimetriaSVG(e);
      });
    }
  }

  leerArchivoAltimetriaSVG(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.svgContent = e.target.result;
      this.insertarAltimetriaSVG();
    };
    reader.readAsText(file);
  }

  insertarAltimetriaSVG() {
    const container = document.querySelector(this.containerSelector);
    // DOM nativo para insertar el SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.svgContent, 'image/svg+xml');
    container.innerHTML = '';
    container.appendChild(doc.documentElement);
  }
}

// Inicialización automática de Mapbox si existe token global
document.addEventListener('DOMContentLoaded', function () {
  const token = window.MAPBOX_ACCESS_TOKEN || window.MAPBOX_TOKEN || null;
  if (!token) return; // no hay token, no inicializamos Mapbox automáticamente

  if (typeof mapboxgl === 'undefined') {
    // Mapbox GL JS no está cargado en la página. El mapa no se inicializará automáticamente.
    return;
  }

  try {
    mapboxgl.accessToken = token;
    // crear el mapa en el contenedor existente
    const mapaCont = document.querySelector('[data-mapa-circuito]');
    if (!mapaCont) {
      // Contenedor del mapa no encontrado para inicializar Mapbox
      return;
    }

    // crear mapa con vista por defecto (se ajustará cuando se cargue el KML)
    const map = new mapboxgl.Map({ container: mapaCont, style: 'mapbox://styles/mapbox/streets-v11', center: [0,0], zoom: 2 });
    window.__mapboxMap = map;

    // cuando el cargador KML cargue datos, insertar la capa
    window.addEventListener('cargadorKML:loaded', (ev) => {
      try {
        if (window.__cargadorKML && window.__cargadorKML.geojson) {
          window.__cargadorKML.insertarCapaKML(map);
          console.log('Mapbox: capa KML insertada tras evento cargadorKML:loaded');
        }
      } catch (e) { console.error('Error insertando capa KML en Mapbox:', e); }
    });

    // Si el cargador ya existía y ya tiene geojson, insertar inmediatamente
    if (window.__cargadorKML && window.__cargadorKML.geojson) {
      try { window.__cargadorKML.insertarCapaKML(map); console.log('Mapbox: capa KML insertada automáticamente (ya cargada)'); } catch (e) { console.error('Mapbox: error insertando capa KML automáticamente', e); }
    }
  } catch (err) {
    console.error('No se pudo inicializar Mapbox automáticamente:', err);
  }
});

// Inicializar CargadorKML cuando el DOM esté listo (si existe el input)
document.addEventListener('DOMContentLoaded', function () {
  const kmlInput = document.querySelector('input[data-file="circuito-kml"]');
  if (kmlInput) {
    window.__cargadorKML = new CargadorKML('input[data-file="circuito-kml"]');
  }
});

// Inicializar CargadorAltimetriaSVG cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
  const altInput = document.querySelector('input[data-file="altimetria-svg"]');
  const altContainer = document.querySelector('section[data-contenido-altimetria-svg]');
  if (altInput && altContainer) {
    window.__cargadorAltimetriaSVG = new CargadorAltimetriaSVG('input[data-file="altimetria-svg"]', 'section[data-contenido-altimetria-svg]');
  }
});

class Circuito {
  constructor() {
    this.comprobarApiFile();
    this.#configReader();
    this.htmlContent = null;
  }

  // Método privado para verificar soporte de la API File TODO preguntar solís
  comprobarApiFile() {
    const support = (window.File && window.FileReader && window.FileList && window.Blob);
    if (!support) {
      // API File no soportada en este navegador. Algunas funcionalidades de carga/lectura de ficheros no estarán disponibles.
    }
    return support;
  }

  // Método privado para configurar el listener del input file
  #configReader() {
    const inputFile = document.querySelector('input[data-file="infocircuito"]');
    if (inputFile) {
      inputFile.addEventListener('change', (e) => {
        this.leerArchivoHTML(e);
      });
    }
  }

  leerArchivoHTML(event) {
    const file = event.target.files[0];
    if (!file) {
      // No se seleccionó archivo
      return;
    }

    const allowedTypes = ['text/html', 'text/plain'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.html')) {
      // Por favor, selecciona un archivo HTML o de texto.
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      this.htmlContent = e.target.result;
      this._lastFileName = file.name;
      console.log('File read successfully:', file.name);
      this.#showReadContent();
    };

    reader.onerror = (e) => {
      console.error('Error reading file:', reader.error);
      // Error manejado: lectura fallida
    }; 

    reader.readAsText(file);
  }

  // Método público: cargar HTML desde texto (útil para carga automática desde servidor)
  // options: { silent: true } para no mostrar mensaje de estado
  cargarDesdeTexto(text, filename = '', options = {}) {
    this.htmlContent = text;
    if (filename) this._lastFileName = filename;
    this._suppressStatus = !!options.silent;
    this.#showReadContent();
    // reset flag por si acaso
    this._suppressStatus = false;
  }

  // Método privado para mostrar el contenido leído en la página
  #showReadContent() {
    const container = document.querySelector('section[data-contenido-infocircuito]');
    if (!container) return;
    // Limpiar el contenedor antes de procesar para que no quede el placeholder antiguo
    container.innerHTML = '';
    if (!this.htmlContent) {
      container.innerHTML = '<p role="status">No se ha podido leer el archivo.</p>';
      return;
    }

    try {
      // Procesar el HTML para extraer y renderizar información
      this.procesarInfoCircuito();
      // Mostrar mensaje de éxito temporal (accesible) salvo si se solicitó supresión
      if (!this._suppressStatus) {
        const status = document.createElement('p');
        status.setAttribute('role', 'status');
        status.textContent = this._lastFileName ? `Archivo cargado: ${this._lastFileName}` : 'Archivo cargado correctamente.';
        status.style.fontWeight = '600';
        container.prepend(status);
        // eliminar el mensaje tras 5s para no ensuciar la UI
        setTimeout(() => { try { if (status.parentNode) status.parentNode.removeChild(status); } catch (e) {} }, 5000);
      }

      // Si tras procesar no se ha insertado contenido (caso inesperado), mostrar el origen para depuración
      if (!container.innerHTML || container.innerHTML.trim() === '' || container.textContent.trim() === '') {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = 'Ver origen del archivo (debug)';
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.maxHeight = '40vh';
        pre.style.overflow = 'auto';
        pre.textContent = this.htmlContent;
        details.appendChild(summary);
        details.appendChild(pre);
        container.appendChild(details);
      }

      console.log('Contenido del archivo procesado e insertado en la página');
    } catch (err) {
      console.error('Error procesando el archivo:', err);
      container.innerHTML = '<p role="status">Error al procesar el archivo. Revisa la consola para más detalles.</p>';
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Ver fuente (debug)';
      const pre = document.createElement('pre');
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.maxHeight = '40vh';
      pre.style.overflow = 'auto';
      pre.textContent = this.htmlContent || String(err);
      details.appendChild(summary);
      details.appendChild(pre);
      container.appendChild(details);
    }
  }

  // Método para procesar el HTML leído usando DOMParser
  procesarInfoCircuito() {
    if (!this.htmlContent) {
      // No hay contenido HTML para procesar
      return;
    }

    // Parsear el HTML usando DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.htmlContent, 'text/html');

    // Validar que el parseo fue exitoso
    if (doc.body.textContent.includes('parsererror')) {
      console.error('Error al parsear el HTML');
      return;
    }

    // Guardar doc para posibles fallbacks y extraer información del documento parseado
    this._lastDoc = doc;
    const data = this.#extractData(doc);

    // Renderizar la información en el contenedor
    this.#renderInfo(data);
  }

  // Método privado para extraer datos del documento parseado
  #extractData(doc) {
    const data = { name: '', extension: '', width: '', laps: '', location: '', country: '', sponsor: '', date: '', time: '', references: [], photos: [], videos: [], winner: '', raceTime: '', podium: [] };

    // Helper: parse summary table (first table found)
    const parseSummaryTable = (table) => {
      const rows = Array.from(table.querySelectorAll('tr'));
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length < 2) return;
        const key = cells[0].textContent.trim().toLowerCase();
        const value = cells[1].textContent.trim();
        if (key.includes('nombre') || key.includes('name')) data.name = value;
        else if (key.includes('extensión') || key.includes('extension')) data.extension = value;
        else if (key.includes('anchura') || key.includes('width')) data.width = value;
        else if (key.includes('vueltas') || key.includes('laps')) data.laps = value;
        else if (key.includes('localidad') || key.includes('location')) data.location = value;
        else if (key.includes('país') || key.includes('country')) data.country = value;
        else if (key.includes('patrocinador') || key.includes('sponsor')) data.sponsor = value;
        else if (key.includes('fecha') || key.includes('date')) data.date = value;
        else if (key.includes('hora') || key.includes('time')) data.time = value;
      });
    };

    // Obtener secciones por orden de aparición dentro del <main>
    const sections = Array.from(doc.querySelectorAll('main > section'));

    // 1) Resumen (si hay tabla)
    if (sections[0]) {
      const table = sections[0].querySelector('table');
      if (table) parseSummaryTable(table);
    }

    // 2) Referencias (ul li)
    if (sections[1]) {
      const lis = sections[1].querySelectorAll('ul li');
      lis.forEach(li => data.references.push(li.textContent.trim()));
    }

    // 3) Galería de fotos (buscar imgs en la sección)
    if (sections[2]) {
      const imgs = sections[2].querySelectorAll('img');
      imgs.forEach(img => data.photos.push({ src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '' }));
    }

    // 4) Galería de vídeos (links)
    if (sections[3]) {
      const links = sections[3].querySelectorAll('a');
      links.forEach(a => data.videos.push({ src: a.getAttribute('href') || '', text: a.textContent.trim() }));
    }

    // 5) Ganador (primer párrafo disponible)
    if (sections[4]) {
      const p = sections[4].querySelector('p');
      const text = p ? p.textContent.trim() : '';
      const parts = text.split(' — ');
      if (parts.length >= 1) data.winner = parts[0].trim();
      if (parts.length >= 2) data.raceTime = parts[1].trim();
    }

    // 6) Podio (tabla de cuerpo con filas)
    if (sections[5]) {
      const table = sections[5].querySelector('table');
      if (table) {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) data.podium.push({ position: cells[0].textContent.trim(), name: cells[1].textContent.trim(), points: cells[2].textContent.trim() });
        });
      }
    }

    // --- Fallbacks: cuando el HTML no sigue exactamente la estructura esperada
    const isEmptySummary = !data.name && !data.extension && !data.width && !data.laps && !data.location && !data.country && !data.date && !data.time;

    // Si no hay resumen en <main> > section, buscar la primera tabla en el documento
    if (isEmptySummary) {
      const table = doc.querySelector('table');
      if (table) parseSummaryTable(table);
    }

    // Referencias: si no se extrayeron, tomar la primera lista <ul>
    if (data.references.length === 0) {
      const ul = doc.querySelector('ul');
      if (ul) Array.from(ul.querySelectorAll('li')).forEach(li => data.references.push(li.textContent.trim()));
    }

    // Fotos: si no hay fotos, tomar las primeras imágenes del documento
    if (data.photos.length === 0) {
      const imgs = doc.querySelectorAll('img');
      if (imgs.length > 0) {
        Array.from(imgs).slice(0, 6).forEach(img => data.photos.push({ src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '' }));
      }
    }

    // Videos: si no hay videos, buscar iframes o enlaces a YouTube/Vimeo
    if (data.videos.length === 0) {
      const iframes = doc.querySelectorAll('iframe');
      if (iframes.length > 0) {
        Array.from(iframes).slice(0, 4).forEach(f => data.videos.push({ src: f.getAttribute('src') || '', text: f.getAttribute('title') || '' }));
      } else {
        const links = Array.from(doc.querySelectorAll('a[href]')).filter(a => /youtube|vimeo|youtu\.be/.test(a.href));
        links.slice(0, 6).forEach(a => data.videos.push({ src: a.href, text: a.textContent.trim() || a.href }));
      }
    }

    // Ganador: buscar el primer párrafo que mencione 'ganador' o contenga un guion largo
    if (!data.winner) {
      const p = Array.from(doc.querySelectorAll('p')).find(p => /ganador|winner/i.test(p.textContent) || /—/.test(p.textContent));
      if (p) {
        const text = p.textContent.trim();
        const parts = text.split(' — ');
        data.winner = parts[0].trim();
        if (parts[1]) data.raceTime = parts[1].trim();
      }
    }

    // Podio: si no hay podio, buscar la primera tabla con al menos 2 filas
    if (data.podium.length === 0) {
      const tables = Array.from(doc.querySelectorAll('table'));
      for (let t of tables) {
        const rows = t.querySelectorAll('tbody tr, tr');
        if (rows.length >= 2) {
          Array.from(rows).slice(0, 3).forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
              data.podium.push({ position: cells[0].textContent.trim(), name: (cells[1]?.textContent || '').trim(), points: (cells[2]?.textContent || '').trim() });
            }
          });
          break;
        }
      }
    }

    return data;
  }

  // Método privado para renderizar la información extraída
  #renderInfo(data) {
    const container = document.querySelector('section[data-contenido-infocircuito]');
    if (!container) return;

    // Limpiar contenedor
    container.innerHTML = '';

    // Crear estructura HTML con los datos extraídos
    const fragment = document.createDocumentFragment();

    // Crear secciones simples y accesibles con la información extraída
    const mk = (label, inner) => {
      const s = document.createElement('section');
      s.setAttribute('aria-label', label);
      s.innerHTML = inner;
      return s;
    };

    // Mostrar únicamente el resumen básico del circuito (información mínima solicitada)
    const resumen = document.createElement('section');
    resumen.setAttribute('aria-label', 'Resumen del circuito');
    const h3 = document.createElement('h3');
    h3.textContent = 'Resumen del circuito';
    resumen.appendChild(h3);

    // Si no se extrajeron valores, intentar leer directamente la primera tabla disponible
    const needsTableFallback = !data.name && !data.extension && !data.width && !data.laps && !data.location && !data.country && !data.date && !data.time;
    if (needsTableFallback) {
      const table = this._lastDoc ? this._lastDoc.querySelector('table') : null;
      if (table) {
        const rows = Array.from(table.querySelectorAll('tr'));
        rows.forEach(row => {
          const cells = row.querySelectorAll('th, td');
          const key = (cells[0]?.textContent || '').trim();
          const val = (cells[1]?.textContent || '').trim();
          // mapear etiquetas conocidas
          const lk = key.toLowerCase();
          if (/nombre|name/.test(lk)) data.name = data.name || val;
          else if (/extensi|extension/.test(lk)) data.extension = data.extension || val;
          else if (/anchura|ancho|width/.test(lk)) data.width = data.width || val;
          else if (/vuelta|laps/.test(lk)) data.laps = data.laps || val;
          else if (/localidad|location/.test(lk)) data.location = data.location || val;
          else if (/pa[ií]s|country/.test(lk)) data.country = data.country || val;
          else if (/patrocinador|sponsor/.test(lk)) data.sponsor = data.sponsor || val;
          else if (/fecha|date/.test(lk)) data.date = data.date || val;
          else if (/hora|time/.test(lk)) data.time = data.time || val;
        });
      }
    }

    const fields = [
      ['Nombre', data.name],
      ['Extensión', data.extension],
      ['Ancho', data.width],
      ['Vueltas', data.laps],
      ['Localidad', data.location],
      ['País', data.country],
      ['Patrocinador', data.sponsor],
      ['Fecha', data.date],
      ['Hora', data.time]
    ];

    fields.forEach(([label, value]) => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = label + ': ';
      const span = document.createElement('span');
        // Usar textContent para evitar que estilos antiguos oculten el valor y prevenir inyecciones
      span.textContent = value || '—';
      p.appendChild(strong);
      p.appendChild(span);
      resumen.appendChild(p);
    });

    fragment.appendChild(resumen);

    // Insertar contenido en el contenedor
    container.appendChild(fragment);

    // Notificar a otros componentes (p.ej. carrusel) que se ha cargado info del circuito
    // Se envía el nombre del circuito en el detalle del evento para que puedan actualizar búsquedas
    try {
      const evt = new CustomEvent('circuito:loaded', { detail: data });
      window.dispatchEvent(evt);
      // Guardar en localStorage para notificar a otras pestañas que la selección del circuito ha cambiado
      try {
        localStorage.setItem('motogp:selectedCircuit', JSON.stringify({ name: data.name, ts: Date.now() }));
      } catch (err) {
        // No se pudo almacenar selectedCircuit en localStorage
      }
    } catch (e) {
      // Imposible despachar evento circuito:loaded
    }
  }

  // Método privado para sanitizar HTML y evitar inyecciones
  #sanitize(texto) {
    // Usar <template> para evitar crear elementos div en el DOM
    const tpl = document.createElement('template');
    tpl.textContent = texto;
    return tpl.innerHTML;
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
  window.__circuito = new Circuito();
});

// CargadorSVG eliminado: la funcionalidad de carga/visualización SVG fue retirada porque no se usa en la aplicación.


/**
 * Clase CargadorKML
 * - leerArchivoKML(event): carga un archivo .kml desde la máquina cliente (File API)
 * - insertarCapaKML(map): superpone los datos KML convertidos a GeoJSON en un mapa.
 *
 * Nota: esta clase no crea el mapa. El método insertarCapaKML espera recibir una
 * instancia de mapa compatible con Mapbox GL JS (recomendado) o Leaflet.
 */
class CargadorKML {
  constructor(inputSelector) {
    this.inputSelector = inputSelector;
    this.kmlText = null;
    this.geojson = null;
    this.#configureReader();
  }

  #configureReader() {
    const input = document.querySelector(this.inputSelector);
    if (input) {
      input.addEventListener('change', (e) => this.leerArchivoKML(e));
    }
  }

  // Método público: leerArchivoKML(event)
  leerArchivoKML(event) {
    const file = event?.target?.files?.[0];
    if (!file) {
      // CargadorKML: no se seleccionó archivo.
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.kmlText = e.target.result;
      try {
        // Parsear KML y extraer origen y tramos
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.kmlText, 'text/xml');

        this.origin = null; // [lng, lat]
        this.segments = []; // array de arrays [[lng,lat], ...]

        // helper to retrieve elements whether or not KML uses namespaces
        const getElems = (parent, localName) => {
          let elems = Array.from(parent.getElementsByTagName(localName) || []);
          if (elems.length === 0) elems = Array.from(parent.getElementsByTagNameNS('*', localName) || []);
          return elems;
        };

        const placemarks = getElems(doc, 'Placemark');
        if (placemarks.length === 0) {
          // CargadorKML: no se han encontrado <Placemark> en el KML (comprueba namespaces)
        }
        placemarks.forEach(pm => {
          const point = getElems(pm, 'Point')[0];
          const line = getElems(pm, 'LineString')[0];
          const name = getElems(pm, 'name')[0]?.textContent?.trim() || '';

          if (point && !this.origin) {
            const coordsText = getElems(point, 'coordinates')[0]?.textContent?.trim();
            if (coordsText) {
              const parts = coordsText.split(',').map(s => parseFloat(s.trim()));
              const lng = parts[0];
              const lat = parts[1];
              this.origin = [lng, lat];
            }
          }

          if (line) {
            const coordsText = getElems(line, 'coordinates')[0]?.textContent?.trim();
            if (coordsText) {
              const coords = coordsText.split(/\s+/).map(pair => {
                const [lng, lat] = pair.split(',').map(s => parseFloat(s.trim()));
                return [lng, lat];
              }).filter(c => Array.isArray(c) && c.length === 2);
              if (coords.length > 0) {
                this.segments.push({ name, coords });
              }
            }
          }
        });

        // Construir geojson mínimo para compatibilidad con insertarCapaKML
        const features = [];
        if (this.origin) features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: this.origin }, properties: { role: 'origin' } });
        this.segments.forEach(s => { features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: s.coords }, properties: { name: s.name } }); });
        this.geojson = { type: 'FeatureCollection', features };

        console.log('CargadorKML: origen y tramos extraídos', { origin: this.origin, segments: this.segments });

        // Emitir evento para que otras partes de la app sepan que el KML se cargó
        try {
          const evt = new CustomEvent('cargadorKML:loaded', { detail: { origin: this.origin, segments: this.segments, geojson: this.geojson } });
          window.dispatchEvent(evt);
        } catch (e) {
          // CustomEvent puede fallar en entornos muy antiguos
        }

        // Intentar insertar automáticamente si existe una referencia a un mapa global
        if (window.__map) {
          try { this.insertarCapaKML(window.__map); console.log('CargadorKML: insertada capa en window.__map'); } catch (e) { console.error('CargadorKML: fallo al insertar en window.__map', e); }
        } else if (window.__mapboxMap) {
          try { this.insertarCapaKML(window.__mapboxMap); console.log('CargadorKML: insertada capa en window.__mapboxMap'); } catch (e) { console.error('CargadorKML: fallo al insertar en window.__mapboxMap', e); }
        } else {
          console.log('CargadorKML: datos cargados, pero no se encontró mapa global (window.__map o window.__mapboxMap). Llama a insertarCapaKML(map) cuando dispongas de una instancia de mapa.');
        }
      } catch (err) {
        console.error('CargadorKML: error al parsear KML', err);
      }
    };
    reader.onerror = (e) => {
      console.error('CargadorKML: error leyendo archivo', reader.error);
    };
    reader.readAsText(file);
  }

  // Método público: insertarCapaKML(map)
  // map: instancia de Mapbox GL JS map o instancia de Leaflet map.
  insertarCapaKML(map, options = {}) {
    // Asegurarse de que hay datos
    if (!this.origin && (!this.segments || this.segments.length === 0)) {
      // CargadorKML: no hay datos de origen ni tramos para insertar en el mapa
      return;
    }

    // Si es Mapbox GL JS (map.addSource existe)
    if (map && typeof map.addSource === 'function') {
      const originSource = options.originSourceId || 'kml-origin-source';
      const segSource = options.segmentsSourceId || 'kml-segments-source';

      // eliminar capas y fuentes previas (intentar borrar tanto capas con sufijos como las fuentes base)
      const idsToRemove = [originSource + '-circle', segSource + '-line', segSource + '-point', originSource, segSource];
      idsToRemove.forEach(id => {
        try { if (map.getLayer && map.getLayer(id)) map.removeLayer(id); } catch (e) {}
        try { if (map.getSource && map.getSource(id)) map.removeSource(id); } catch (e) {}
      });

      // preparar geojsons y usar setData si la fuente ya existe para evitar el error "already a source with this ID"
      if (this.origin) {
        const originGeo = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: this.origin }, properties: {} }] };
        try {
          if (map.getSource && map.getSource(originSource) && typeof map.getSource(originSource).setData === 'function') {
            map.getSource(originSource).setData(originGeo);
          } else {
            map.addSource(originSource, { type: 'geojson', data: originGeo });
          }
          if (!map.getLayer || !map.getLayer(originSource + '-circle')) {
            map.addLayer({ id: originSource + '-circle', type: 'circle', source: originSource, paint: { 'circle-radius': options.pointRadius || 8, 'circle-color': options.pointColor || '#0066ff', 'circle-stroke-color': options.pointStroke || '#ffffff', 'circle-stroke-width': 2 } });
          }
        } catch (e) {
          console.error('CargadorKML: fallo al añadir/actualizar origen en Mapbox:', e);
        }
      }

      if (this.segments && this.segments.length > 0) {
        const segFeatures = this.segments.map((s, idx) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: s.coords }, properties: { name: s.name || ('segment-' + idx) } }));
        const segGeo = { type: 'FeatureCollection', features: segFeatures };
        try {
          if (map.getSource && map.getSource(segSource) && typeof map.getSource(segSource).setData === 'function') {
            map.getSource(segSource).setData(segGeo);
          } else {
            map.addSource(segSource, { type: 'geojson', data: segGeo });
          }
          if (!map.getLayer || !map.getLayer(segSource + '-line')) {
            map.addLayer({ id: segSource + '-line', type: 'line', source: segSource, paint: { 'line-color': options.lineColor || '#cc0f0f', 'line-width': options.lineWidth || 3 } });
          }
        } catch (e) {
          console.error('CargadorKML: fallo al añadir/actualizar segmentos en Mapbox:', e);
        }
      }

      // Ajustar vista
      if (options.fitBounds !== false) {
        const bounds = this.#computeBounds(this.geojson);
        if (bounds && map.fitBounds) map.fitBounds(bounds, { padding: 40 });
      }
      return;
    }

    // Leaflet fallback
    if (typeof L !== 'undefined' && map && typeof map.addLayer === 'function') {
      // quitar capas previas guardadas
      if (this._leafletLayers) {
        try { this._leafletLayers.forEach(l => map.removeLayer(l)); } catch (e) {}
        this._leafletLayers = [];
      } else this._leafletLayers = [];

      // marcador de origen
      if (this.origin) {
        const marker = L.marker([this.origin[1], this.origin[0]]).addTo(map);
        this._leafletLayers.push(marker);
      }

      // polilíneas para cada tramo
      if (this.segments && this.segments.length > 0) {
        this.segments.forEach(s => {
          const latlngs = s.coords.map(c => [c[1], c[0]]);
          const pl = L.polyline(latlngs, { color: options.lineColor || '#CC0F0F', weight: options.lineWidth || 3 }).addTo(map);
          this._leafletLayers.push(pl);
        });
      }

      // ajustar vista
      try {
        const group = L.featureGroup(this._leafletLayers);
        if (options.fitBounds !== false) map.fitBounds(group.getBounds());
      } catch (e) {}
      return;
    }
  }

  #convertKMLtoGeoJSON(kmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(kmlString, 'text/xml');
    const features = [];
    const placemarks = doc.getElementsByTagName('Placemark');
    for (let i = 0; i < placemarks.length; i++) {
      const pm = placemarks[i];
      const name = pm.getElementsByTagName('name')[0]?.textContent || '';
      const desc = pm.getElementsByTagName('description')[0]?.textContent || '';

      // Point
      const point = pm.getElementsByTagName('Point')[0];
      if (point) {
        const coordsText = point.getElementsByTagName('coordinates')[0]?.textContent.trim();
        if (coordsText) {
          const [lng, lat, alt] = coordsText.split(',').map(s => parseFloat(s.trim()));
          features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: { name, description: desc, altitude: alt || null } });
        }
      }

      // LineString
      const line = pm.getElementsByTagName('LineString')[0];
      if (line) {
        const coordsText = line.getElementsByTagName('coordinates')[0]?.textContent.trim();
        if (coordsText) {
          const coords = coordsText.split(/\s+/).map(pair => {
            const [lng, lat] = pair.split(',').map(s => parseFloat(s.trim()));
            return [lng, lat];
          });
          features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: { name, description: desc } });
        }
      }

      // Polygon (outerBoundaryIs > LinearRing > coordinates)
      const polygon = pm.getElementsByTagName('Polygon')[0];
      if (polygon) {
        const linear = polygon.getElementsByTagName('LinearRing')[0];
        if (linear) {
          const coordsText = linear.getElementsByTagName('coordinates')[0]?.textContent.trim();
          if (coordsText) {
            const ring = coordsText.split(/\s+/).map(pair => {
              const [lng, lat] = pair.split(',').map(s => parseFloat(s.trim()));
              return [lng, lat];
            });
            features.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { name, description: desc } });
          }
        }
      }
    }
    return { type: 'FeatureCollection', features };
  }

  #computeBounds(geojson) {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    geojson.features.forEach(f => {
      const geom = f.geometry;
      if (!geom) return;
      if (geom.type === 'Point') {
        const [lng, lat] = geom.coordinates;
        minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
      } else if (geom.type === 'LineString' || geom.type === 'Polygon') {
        const coordsArray = geom.type === 'Polygon' ? geom.coordinates[0] : geom.coordinates;
        coordsArray.forEach(([lng, lat]) => { minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng); minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat); });
      }
    });
    if (minLng === Infinity) return null;
    return [[minLng, minLat], [maxLng, maxLat]];
  }
}

