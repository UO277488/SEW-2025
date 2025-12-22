/* noticias.js
 * Clase Noticias para consultar TheNewsApi (https://www.thenewsapi.com/)
 * - Constructor: (busqueda, apiKey)
 * - buscar(): realiza fetch() y devuelve promesa con JSON
 * - procesarInformacion(json): extrae un array de noticias (titular, summary, url, source)
 * - mostrarNoticias(container, articles): añade las 3 noticias al DOM
 */

'use strict';

class Noticias {
  constructor(busqueda = 'MotoGP', apiKey = null) {
    this.busqueda = String(busqueda);
    this.apiKey = apiKey || window.THENEWSAPI_KEY || null;
    // Base URL (v1) - el parámetro exacto depende de la API; se usa 'api_token' si procede
    this.base = 'https://api.thenewsapi.com/v1/';
  }

  buscar(limit = 3) {
    if (!this.apiKey) {
      return Promise.resolve({ _mock: true, articles: this._mockArticles(limit) });
    }

    const url = `${this.base}news/all?api_token=${encodeURIComponent(this.apiKey)}&search=${encodeURIComponent(this.busqueda)}&language=es&limit=${limit}`;

    // Intentar obtener noticias; ante cualquier fallo (error HTTP, CORS, JSON inválido) devolvemos artículos de prueba
    return fetch(url)
      .then(resp => {
        if (!resp.ok) {
          return { _mock: true, articles: this._mockArticles(limit) };
        }
        return resp.json().catch(() => ({ _mock: true, articles: this._mockArticles(limit) }));
      })
      .catch(() => ({ _mock: true, articles: this._mockArticles(limit) }));
  }

  procesarInformacion(json, limit = 3) {
    if (!json) return [];

    // La API puede devolver campos con nombres distintos; intentar localizar array de noticias
    let list = [];
    if (Array.isArray(json.data)) list = json.data;
    else if (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) {
      // Casos como: data: { general: [...], sports: [...] } => aplanar
      Object.values(json.data).forEach(v => { if (Array.isArray(v)) list = list.concat(v); });
    }
    else if (Array.isArray(json.articles)) list = json.articles;
    else if (Array.isArray(json.results)) list = json.results;
    else if (Array.isArray(json.news)) list = json.news;
    else if (json._mock && Array.isArray(json.articles)) list = json.articles;

    // Mapear a un formato uniforme: title, description, url, source
    const mapped = list.slice(0, limit).map(item => {
      const title = item.title || item.headline || item.name || '';
      const description = item.description || item.summary || item.snippet || item.excerpt || '';
      const url = item.url || item.link || item.source_url || item.canonical_url || '';

      // Normalizar la fuente: preferir dominio simple (ej. cbsnews.com)
      let source = '';
      if (item.source) {
        if (typeof item.source === 'string') source = item.source;
        else if (typeof item.source === 'object') source = item.source.name || item.source.title || '';
      }
      if (!source && item.source_name) source = item.source_name;
      if (!source && item.publisher) source = item.publisher;

      if (!source && url) {
        try {
          const u = new URL(url);
          source = u.hostname.replace(/^www\./i, '');
        } catch (e) {
          const m = String(url).match(/https?:\/\/([^\/]+)/i);
          source = m ? m[1].replace(/^www\./i, '') : '';
        }
      }

      // Si source tiene espacios (nombre largo), intentar sustituir por dominio si hay URL
      if (source && /\s/.test(source) && url) {
        try { source = (new URL(url)).hostname.replace(/^www\./i, ''); } catch (e) {}
      }

      source = source || '';

      return { title, description, url, source };
    });

    return mapped;
  }

  mostrarNoticias(containerSelector = 'section[data-noticias-motogp]', articles = []) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = '';
    const sec = document.createElement('section');
    sec.setAttribute('aria-label', 'Noticias relacionadas con MotoGP');
    sec.innerHTML = '<h2>Noticias de MotoGP</h2>';

    // Si no hay artículos (por fallo de la API), mostrarmos artículos de mock como respaldo
    if (!articles || articles.length === 0) articles = this._mockArticles(3);

    articles.forEach(a => {
      const art = document.createElement('article');
      art.innerHTML = `
        <h3>${this._esc(a.title)}</h3>
        <p>${this._esc(a.description)}</p>
        <p><a href="${this._esc(a.url)}" target="_blank" rel="noopener">Leer más</a></p>
        <p class="news-source">Fuente: <strong>${this._esc(a.source || 'Fuente desconocida')}</strong></p>
      `;
      sec.appendChild(art);
    });

    container.appendChild(sec);
  }

  // Método auxiliar: artículos de muestra cuando no hay apiKey
  _mockArticles(n) {
    const samples = [
      { title: 'MotoGP: Gran Premio de ejemplo', description: 'Resumen de la carrera y resultados destacados.', url: '#', source: 'Demo News' },
      { title: 'Entrevista a piloto top', description: 'Declaraciones del piloto antes de la carrera.', url: '#', source: 'Demo Sports' },
      { title: 'Cambios en el reglamento', description: 'Novedades que afectan a la próxima temporada.', url: '#', source: 'MotoNews' }
    ];
    return samples.slice(0, n);
  }

  _esc(s) { return String(s || '').replace(/[&"'<>]/g, function (c) { return {'&':'&amp;','"':'&quot;','\'':'&#39;','<':'&lt;','>':'&gt;'}[c]; }); }
}

window.Noticias = Noticias;