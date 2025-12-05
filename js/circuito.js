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
    // Usar jQuery si está disponible
    if (window.jQuery) {
      const $container = window.jQuery(this.containerSelector);
      $container.empty();
      // Parsear SVG y añadirlo
      const $svg = window.jQuery(this.svgContent);
      $container.append($svg);
    } else {
      // DOM nativo
      const parser = new DOMParser();
      const doc = parser.parseFromString(this.svgContent, 'image/svg+xml');
      container.innerHTML = '';
      container.appendChild(doc.documentElement);
    }
  }
}

// Inicialización automática de Mapbox si existe token global
document.addEventListener('DOMContentLoaded', function () {
  const token = window.MAPBOX_ACCESS_TOKEN || window.MAPBOX_TOKEN || null;
  if (!token) return; // no hay token, no inicializamos Mapbox automáticamente

  if (typeof mapboxgl === 'undefined') {
    console.warn('Mapbox GL JS no está cargado en la página. Asegúrate de incluir el script de Mapbox en el HTML.');
    return;
  }

  try {
    mapboxgl.accessToken = token;
    // crear el mapa en el contenedor existente
    const mapaCont = document.getElementById('mapa-circuito');
    if (!mapaCont) {
      console.warn('Contenedor #mapa-circuito no encontrado para inicializar Mapbox');
      return;
    }

    // crear mapa con vista por defecto (se ajustará cuando se cargue el KML)
    const map = new mapboxgl.Map({ container: 'mapa-circuito', style: 'mapbox://styles/mapbox/streets-v11', center: [0,0], zoom: 2 });
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
  const kmlInput = document.querySelector('#file-circuito-kml');
  if (kmlInput) {
    window.__cargadorKML = new CargadorKML('#file-circuito-kml');
  }
});

// Inicializar CargadorAltimetriaSVG cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
  const altInput = document.querySelector('#file-altimetria-svg');
  const altContainer = document.querySelector('#contenido-altimetria-svg');
  if (altInput && altContainer) {
    window.__cargadorAltimetriaSVG = new CargadorAltimetriaSVG('#file-altimetria-svg', '#contenido-altimetria-svg');
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
      // Crear un mensaje accesible en la página
      const main = document.querySelector('main') || document.body;
      const msg = document.createElement('div');
      msg.setAttribute('role', 'alert');
      msg.className = 'file-support-warning';
      msg.textContent = 'Atención: tu navegador no soporta la API File. Algunas funcionalidades de carga/lectura de ficheros no estarán disponibles.';
      main.insertBefore(msg, main.firstChild);
    }
    return support;
  }

  // Método privado para configurar el listener del input file
  #configReader() {
    const inputFile = document.getElementById('file-infocircuito');
    if (inputFile) {
      inputFile.addEventListener('change', (e) => {
        this.leerArchivoHTML(e);
      });
    }
  }

  leerArchivoHTML(event) {
    const file = event.target.files[0];
    if (!file) {
      console.warn('No se seleccionó archivo');
      return;
    }

    const allowedTypes = ['text/html', 'text/plain'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.html')) {
      alert('Por favor, selecciona un archivo HTML o de texto.');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      this.htmlContent = e.target.result;
      console.log('File read successfully:', file.name);
      this.#showReadContent();
    };

    reader.onerror = (e) => {
      console.error('Error reading file:', reader.error);
      alert('Error reading file: ' + reader.error);
    };

    reader.readAsText(file);
  }

  // Método privado para mostrar el contenido leído en la página
  #showReadContent() {
    const container = document.getElementById('contenido-infocircuito');
    if (container && this.htmlContent) {
      // Procesar el HTML para extraer y renderizar información
      this.procesarInfoCircuito();
      console.log('Contenido del archivo procesado e insertado en la página');
    }
  }

  // Método para procesar el HTML leído usando DOMParser
  procesarInfoCircuito() {
    if (!this.htmlContent) {
      console.warn('No hay contenido HTML para procesar');
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

    // Extraer información del documento parseado
    const data = this.#extractData(doc);

    // Renderizar la información en el contenedor
    this.#renderInfo(data);
  }

  // Método privado para extraer datos del documento parseado
  #extractData(doc) {
    const data = {
      name: '',
      extension: '',
      width: '',
      laps: '',
      location: '',
      country: '',
      sponsor: '',
      date: '',
      time: '',
      references: [],
      photos: [],
      videos: [],
      winner: '',
      raceTime: '',
      podium: []
    };

    // Extract data from table (if exists)
    const table = doc.querySelector('table');
    if (table) {
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length === 2) {
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
        }
      });
    }
    //Extraer referencias
    const refs = doc.querySelectorAll('section:has(#refs) ul li');
    refs.forEach(ref => {
      data.references.push(ref.textContent.trim());
    });

    // Extraer fotos
    const photos = doc.querySelectorAll('section:has(#galeria-fotos) figure img');
    photos.forEach(img => {
      data.photos.push({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt')
      });
    });

    // Extraer videos
    const videos = doc.querySelectorAll('section:has(#galeria-videos) a');
    videos.forEach(video => {
      data.videos.push({
        src: video.getAttribute('href'),
        text: video.textContent.trim()
      });
    });

    // Extraer ganador y tiempo
    const winnerSection = doc.querySelector('section:has(#ganador) p:not(:first-child)');
    if (winnerSection) {
      const text = winnerSection.textContent.trim();
      const parts = text.split(' — ');
      if (parts.length === 2) {
        data.winner = parts[0].trim();
        data.raceTime = parts[1].trim();
      }
    }

    // Extraer podio
    const podiumTable = doc.querySelector('section:has(#podio) table');
    if (podiumTable) {
      const rows = podiumTable.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 3) {
          data.podium.push({
            position: cells[0].textContent.trim(),
            name: cells[1].textContent.trim(),
            points: cells[2].textContent.trim()
          });
        }
      });
    }

    return data;
  }

  // Método privado para renderizar la información extraída
  #renderInfo(data) {
    const container = document.getElementById('contenido-infocircuito');
    if (!container) return;

    // Limpiar contenedor
    container.innerHTML = '';

    // Crear estructura HTML con los datos extraídos
    const fragment = document.createDocumentFragment();

    // Resumen del circuito
    const summary = document.createElement('section');
    summary.setAttribute('aria-labelledby', 'circuit-summary');
    summary.innerHTML = `
      <h3 id="circuit-summary">Resumen del circuito</h3>
      <dl>
        <dt>Nombre</dt><dd>${this.#sanitize(data.name)}</dd>
        <dt>Extensión</dt><dd>${this.#sanitize(data.extension)}</dd>
        <dt>Ancho</dt><dd>${this.#sanitize(data.width)}</dd>
        <dt>Vueltas</dt><dd>${this.#sanitize(data.laps)}</dd>
        <dt>Localidad</dt><dd>${this.#sanitize(data.location)}</dd>
        <dt>País</dt><dd>${this.#sanitize(data.country)}</dd>
        <dt>Patrocinador</dt><dd>${this.#sanitize(data.sponsor)}</dd>
        <dt>Fecha</dt><dd>${this.#sanitize(data.date)}</dd>
        <dt>Hora</dt><dd>${this.#sanitize(data.time)}</dd>
      </dl>
    `;
    fragment.appendChild(summary);

    // Referencias
    if (data.references.length > 0) {
      const refs = document.createElement('section');
      refs.setAttribute('aria-labelledby', 'references');
      let refsHTML = '<h3 id="references">Referencias</h3><ul>';
      data.references.forEach(ref => {
        refsHTML += `<li>${this.#sanitize(ref)}</li>`;
      });
      refsHTML += '</ul>';
      refs.innerHTML = refsHTML;
      fragment.appendChild(refs);
    }

    // Fotos
    if (data.photos.length > 0) {
      const photos = document.createElement('section');
      photos.setAttribute('aria-labelledby', 'photos');
      let photosHTML = '<h3 id="photos">Galería de Fotos</h3><div class="gallery" style="display: flex; flex-wrap: wrap; gap: 10px;">';
      data.photos.forEach(photo => {
        photosHTML += `<figure><img src="${this.#sanitize(photo.src)}" alt="${this.#sanitize(photo.alt)}" style="max-width: 200px;"/></figure>`;
      });
      photosHTML += '</div>';
      photos.innerHTML = photosHTML;
      fragment.appendChild(photos);
    }

    // Videos
    if (data.videos.length > 0) {
      const videos = document.createElement('section');
      videos.setAttribute('aria-labelledby', 'videos');
      let videosHTML = '<h3 id="videos">Galería de Videos</h3><ul>';
      data.videos.forEach(video => {
        videosHTML += `<li><a href="${this.#sanitize(video.src)}">${this.#sanitize(video.text)}</a></li>`;
      });
      videosHTML += '</ul>';
      videos.innerHTML = videosHTML;
      fragment.appendChild(videos);
    }

    // Ganador
    if (data.winner || data.raceTime) {
      const winner = document.createElement('section');
      winner.setAttribute('aria-labelledby', 'winner');
      winner.innerHTML = `
        <h3 id="winner">Ganador</h3>
        <p>${this.#sanitize(data.winner)} — ${this.#sanitize(data.raceTime)}</p>
      `;
      fragment.appendChild(winner);
    }

    // Podio
    if (data.podium.length > 0) {
      const podium = document.createElement('section');
      podium.setAttribute('aria-labelledby', 'podium');
      let podiumHTML = '<h3 id="podium">Podio</h3><table><thead><tr><th>Posición</th><th>Nombre</th><th>Puntos</th></tr></thead><tbody>';
      data.podium.forEach(racer => {
        podiumHTML += `<tr><td>${this.#sanitize(racer.position)}</td><td>${this.#sanitize(racer.name)}</td><td>${this.#sanitize(racer.points)}</td></tr>`;
      });
      podiumHTML += '</tbody></table>';
      podium.innerHTML = podiumHTML;
      fragment.appendChild(podium);
    }

    // Insertar contenido en el contenedor
    container.appendChild(fragment);
  }

  // Método privado para sanitizar HTML y evitar inyecciones
  #sanitize(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
  window.__circuito = new Circuito();
});

class CargadorSVG {
  constructor(inputSelector, containerSelector) {
    this.inputSelector = inputSelector;
    this.containerSelector = containerSelector;
    this.svgContent = null;
    this.comprobarApiFile();
    this.#configSvgReader();
  }

  comprobarApiFile() {
    const support = (window.File && window.FileReader && window.FileList && window.Blob);
    if (!support) {
      const main = document.querySelector('main') || document.body;
      const msg = document.createElement('div');
      msg.setAttribute('role', 'alert');
      msg.className = 'file-support-warning';
      msg.textContent = 'Atención: tu navegador no soporta la API File. La carga de archivos SVG no estará disponible.';
      main.insertBefore(msg, main.firstChild);
    }
    return support;
  }

  // Método privado para configurar el listener del input file SVG
  #configSvgReader() {
    const inputFile = document.querySelector(this.inputSelector);
    if (inputFile) {
      inputFile.addEventListener('change', (e) => {
        this.leerArchivoSVG(e);
      });
    }
  }

  // Método público para leer el archivo SVG desde la máquina cliente
  leerArchivoSVG(event) {
    const file = event.target.files[0];
    if (!file) {
      console.warn('No se seleccionó archivo SVG');
      return;
    }
    const reader = new FileReader();

    reader.onload = (e) => {
      this.svgContent = e.target.result;
      console.log('Archivo SVG cargado exitosamente:', file.name);
      this.#showSvgContent();
    };

    reader.readAsText(file);
  }

  // Método privado para mostrar el SVG cargado
  #showSvgContent() {
    const container = document.querySelector(this.containerSelector);
    if (container && this.svgContent) {
      this.insertarSVG();
      console.log('Contenido SVG procesado e insertado en la página');
    }
  }

  // Método público para insertar y mostrar el contenido SVG en un elemento HTML
  insertarSVG() {
    const container = document.querySelector(this.containerSelector);
    if (!container || !this.svgContent) {
      console.warn('Contenedor o contenido SVG no disponible');
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(this.svgContent, 'image/svg+xml');
    // Limpiar el contenedor
    container.innerHTML = '';

    // Insertar el SVG en el contenedor
    container.appendChild(doc.documentElement);
  }
}

// Inicializar CargadorSVG cuando el DOM esté listo (si existen los elementos)
document.addEventListener('DOMContentLoaded', function () {
  const svgInput = document.querySelector('#file-circuito-svg');
  const svgContainer = document.querySelector('#contenido-circuito-svg');
  if (svgInput && svgContainer) {
    window.__cargadorSVG = new CargadorSVG('#file-circuito-svg', '#contenido-circuito-svg');
  }
});

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
      console.warn('CargadorKML: no se seleccionó archivo.');
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
        if (placemarks.length === 0) console.warn('CargadorKML: no se han encontrado <Placemark> en el KML (comprueba namespaces)');
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
          try { this.insertarCapaKML(window.__map); console.log('CargadorKML: insertada capa en window.__map'); } catch (e) { console.warn('CargadorKML: fallo al insertar en window.__map', e); }
        } else if (window.__mapboxMap) {
          try { this.insertarCapaKML(window.__mapboxMap); console.log('CargadorKML: insertada capa en window.__mapboxMap'); } catch (e) { console.warn('CargadorKML: fallo al insertar en window.__mapboxMap', e); }
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
      console.warn('CargadorKML: no hay datos de origen ni tramos para insertar en el mapa');
      return;
    }

    // Si es Mapbox GL JS (map.addSource existe)
    if (map && typeof map.addSource === 'function') {
      const originSource = options.originSourceId || 'kml-origin-source';
      const segSource = options.segmentsSourceId || 'kml-segments-source';

      // eliminar fuentes/capas previas si existen
      const safeRemove = (id) => { try { if (map.getLayer && map.getLayer(id)) map.removeLayer(id); } catch (e) {} try { if (map.getSource && map.getSource(id)) map.removeSource(id); } catch (e) {} };
      safeRemove(originSource + '-circle'); safeRemove(segSource + '-line'); safeRemove(segSource + '-point');

      // preparar geojsons
      if (this.origin) {
        const originGeo = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: this.origin }, properties: {} }] };
        map.addSource(originSource, { type: 'geojson', data: originGeo });
        map.addLayer({ id: originSource + '-circle', type: 'circle', source: originSource, paint: { 'circle-radius': options.pointRadius || 8, 'circle-color': options.pointColor || '#0066ff', 'circle-stroke-color': options.pointStroke || '#ffffff', 'circle-stroke-width': 2 } });
      }

      if (this.segments && this.segments.length > 0) {
        const segFeatures = this.segments.map((s, idx) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: s.coords }, properties: { name: s.name || ('segment-' + idx) } }));
        const segGeo = { type: 'FeatureCollection', features: segFeatures };
        map.addSource(segSource, { type: 'geojson', data: segGeo });
        map.addLayer({ id: segSource + '-line', type: 'line', source: segSource, paint: { 'line-color': options.lineColor || '#cc0f0f', 'line-width': options.lineWidth || 3 } });
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

