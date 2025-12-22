/* Carrusel mínimo: solo 5 imágenes en bucle, comportamiento simple y sin mensajes */
'use strict';

class Carrusel {
  constructor(busqueda = 'Circuit Of Americas', maximo = 5, options = {}) {
    this.busqueda = String(busqueda);
    this.maximo = Number(maximo) || 5;
    this.actual = 0;
    this.fotos = [];
    this.timerId = null;
    this.apiKey = options.apiKey || window.FLICKR_API_KEY || null; // opcional
  }

  updateBusqueda(nueva) {
    this.busqueda = String(nueva);
    this.actual = 0;
    this.start();
  }

  getFotografias() {
    const motoKeywords = ['moto','motogp','motorcycle','racing','yamaha','ducati','honda','ktm'];
    const circuitKeywords = ['Circuit of Americas', 'MotoGP','circuit','track','race','racetrack','gp','grand','prix','circuit of the americas','austin'];
    const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];

    const candidates = [];
    const target = Math.max(this.maximo * 8, 30);
    while (candidates.length < target) {
      const t = `${pick(motoKeywords)},${pick(circuitKeywords)}`;
      if (!candidates.includes(t)) candidates.push(t);
    }

    return this._getFotosFromTerms(candidates);
  }

  _getFotosFromTerms(terms) {
    return new Promise((resolve) => {
      if (typeof $ === 'undefined') { resolve([]); return; }
      const results = [];
      let i = 0;
      const next = () => {
        if (results.length >= this.maximo || i >= terms.length) { resolve(results.slice(0,this.maximo)); return; }
        const term = terms[i++];
        this._fetchFirstForTerm(term).then(item => {
          if (item && item.url && !results.some(r => r.url === item.url)) results.push(item);
          next();
        }).catch(() => next());
      };
      next();
    });
  }

  _fetchFirstForTerm(term) {
    return new Promise((resolve) => {
      const t = encodeURIComponent(term);
      if (this.apiKey) {
        const url = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${encodeURIComponent(this.apiKey)}&tags=${t}&per_page=3&extras=url_z,url_c,url_b&format=json&jsoncallback=?`;
        $.getJSON(url).done((data) => {
          if (data && data.photos && Array.isArray(data.photos.photo) && data.photos.photo.length>0) {
            const p = data.photos.photo[0];
            const src = p.url_z || p.url_c || p.url_b || (`https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_z.jpg`);
            resolve({url: src, title: p.title || term});
          } else resolve(null);
        }).fail(() => resolve(null));
      } else {
        const url = `https://www.flickr.com/services/feeds/photos_public.gne?format=json&jsoncallback=?&tags=${t}`;
        $.getJSON(url).done((data) => {
          if (data && Array.isArray(data.items) && data.items.length>0) {
            const item = data.items[0];
            let src = item.media && item.media.m ? item.media.m : null;
            if (src) src = src.replace(/_m\.(jpg|png)$/i, '_z.$1');
            resolve({url: src, title: item.title || term});
          } else resolve(null);
        }).fail(() => resolve(null));
      }
    });
  }

  mostrarFotografias() {
    const container = document.querySelector('section[data-fotos-motogp]') || document.querySelector('main') || document.body;
    const existing = container.querySelector('article[data-carrusel]');
    if (existing) existing.remove();
    if (!this.fotos || this.fotos.length === 0) return;

    const article = document.createElement('article');
    article.setAttribute('data-carrusel', '');

    const img = document.createElement('img');
    img.alt = this.fotos[0].title || 'Imagen del carrusel';
    img.src = this.fotos[0].url || '';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.setAttribute('loading', 'lazy');
    article.appendChild(img);

    const controls = document.createElement('nav');
    const prev = document.createElement('button'); prev.type = 'button'; prev.textContent = 'Anterior'; prev.addEventListener('click', () => { this.actual = (this.actual - 1 + this.fotos.length) % this.fotos.length; this._renderImagen(article); });
    const next = document.createElement('button'); next.type = 'button'; next.textContent = 'Siguiente'; next.addEventListener('click', () => { this.actual = (this.actual + 1) % this.fotos.length; this._renderImagen(article); });
    controls.appendChild(prev); controls.appendChild(next);
    article.appendChild(controls);

    container.appendChild(article);
  }

  _renderImagen(article) {
    const img = article.querySelector('img');
    if (!img || !this.fotos || this.fotos.length === 0) return;
    const foto = this.fotos[this.actual];
    img.src = foto.url || '';
    img.alt = foto.title || 'Imagen';
  }

  cambiarFotografia() {
    if (!this.fotos || this.fotos.length === 0) return;
    this.actual = (this.actual + 1) % this.fotos.length;
    const article = document.querySelector('article[data-carrusel]');
    if (article) this._renderImagen(article);
  }

  start() {
    return this.getFotografias().then(arr => {
      this.fotos = (arr || []).slice(0,this.maximo);
      if (!this.fotos || this.fotos.length === 0) return;
      this.mostrarFotografias();
      this.stop();
      this.timerId = setInterval(this.cambiarFotografia.bind(this), 3000);
    }).catch(()=>{});
  }

  stop() { if (this.timerId) { clearInterval(this.timerId); this.timerId = null; } }
}

window.Carrusel = Carrusel;
