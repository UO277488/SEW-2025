class Ciudad{
    #pais
    #gentilicio
    #nombre 
    #poblacion
    #coordenadas
    constructor(nombre, pais, gentilicio){
        this.#nombre = nombre;
        this.#pais = pais;
        this.#gentilicio = gentilicio;
    }

    rellenarAtributos(poblacion, coordenadas){
        this.#poblacion = poblacion;
        this.#coordenadas = coordenadas;
    }

    obtenerNombre(){
        return this.#nombre;
    }
    obtenerPais(){
        return this.#pais;
    }
    obtenerGentilicioPoblacion(){
        const gentilicio = this.#gentilicio ?? 'Desconocido';
        const poblacion = (this.#poblacion !== undefined && this.#poblacion !== null) ? this.#poblacion : 'Desconocida';
        return `<ul><li>Gentilicio: ${this.#gentilicio}</li><li>Población: ${this.#poblacion}</li></ul>`;
    }

    obtenerDescripcion(){
        return `${this.#nombre} es una ciudad de ${this.#pais} y su gentilicio es ${this.#gentilicio}.`;
    }

    mostrarCoordenadas(){
        const coordenadas = this.#coordenadas ?? 'Desconocidas';
        //document.write(`<p>Coordenadas: ${coordenadas}</p>`);
        const mensaje = document.createElement('p');
        mensaje.textContent = `Coordenadas: ${coordenadas}`;
        document.body.appendChild(mensaje);
    }

    /* ---------------- METEOROLOGÍA (Open‑Meteo) ---------------- */
    // Helper: convierte coordenadas en DMS o 'lat lon' a decimal {lat, lon}
    #parseCoordenadas() {
        if (!this.#coordenadas) return null;
        const s = String(this.#coordenadas).trim();
        // Detectar formato DMS: '30°18′00"N 97°44′00"O' o '30°18′00"N, 97°44′00"W'
        const dmsRegex = /([0-9]{1,3})°\s*([0-9]{1,2})['′]\s*([0-9]{1,2})(?:["″])?\s*([NnSs])\s*[ ,]?\s*([0-9]{1,3})°\s*([0-9]{1,2})['′]\s*([0-9]{1,2})(?:["″])?\s*([EeWwOo])/;
        const match = s.match(dmsRegex);
        if (match) {
            const latDeg = Number(match[1]);
            const latMin = Number(match[2]);
            const latSec = Number(match[3]);
            const latDir = match[4].toUpperCase();
            const lonDeg = Number(match[5]);
            const lonMin = Number(match[6]);
            const lonSec = Number(match[7]);
            const lonDir = match[8].toUpperCase();
            const lat = latDeg + latMin/60 + latSec/3600;
            const lon = lonDeg + lonMin/60 + lonSec/3600;
            return { lat: (latDir === 'S' ? -lat : lat), lon: (lonDir === 'W' || lonDir === 'O' ? -lon : lon) };
        }
        // Formato decimal 'lat, lon' o 'lat lon'
        const parts = s.split(/[ ,]+/).map(p => p.replace(/[°]/g, ''));
        if (parts.length >= 2) {
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            if (!Number.isNaN(lat) && !Number.isNaN(lon)) return { lat, lon };
        }
        return null;
    }

    // Tarea 3: obtener meteorología del día de la carrera
    getMeteorologiaCarrera(fecha) {
        const coords = this.#parseCoordenadas();
        if (!coords) {
            console.error('Coordenadas no válidas para obtener meteorología');
            console.warn('Coordenadas no validas. Comprueba los datos de la ciudad.');
            return;
        }

        // Parámetros para la llamada Open‑Meteo (dia completo + franjas horarias)
        const hourly = 'temperature_2m,apparent_temperature,precipitation,relativehumidity_2m,windspeed_10m,winddirection_10m';
        const daily = 'sunrise,sunset';
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lon}&start_date=${fecha}&end_date=${fecha}&hourly=${hourly}&daily=${daily}&timezone=auto`;

        // Usamos jQuery (requerido por la práctica) para la petición
        $.getJSON(url)
         .done((json) => this.procesarJSONCarrera(json, fecha))
         .fail((err) => {
            console.error('Error al obtener meteorología de la carrera', err);
            console.warn('Error al obtener datos meteorológicos. Comprueba la consola para más detalles.');
         });
    }

    // Procesar resultado del día de la carrera: extrae los campos solicitados y renderiza
    procesarJSONCarrera(json, fecha) {
        if (!json) {
            console.warn('JSON inválido en procesarJSONCarrera');
            return;
        }
        const out = {
            date: fecha,
            hourly: {},
            daily: {}
        };
        const hourlyVars = ['temperature_2m','apparent_temperature','precipitation','relativehumidity_2m','windspeed_10m','winddirection_10m'];
        hourlyVars.forEach(k => {
            if (json.hourly && Array.isArray(json.hourly[k])) out.hourly[k] = json.hourly[k];
        });
        if (json.daily) {
            out.daily.sunrise = (json.daily.sunrise && json.daily.sunrise[0]) ? json.daily.sunrise[0] : null;
            out.daily.sunset = (json.daily.sunset && json.daily.sunset[0]) ? json.daily.sunset[0] : null;
        }

        // Renderizar en la sección correspondiente: reemplazamos contenido previo
        const cont = document.querySelector('[data-meteorologia-carrera]');
        if (!cont) return;
        cont.innerHTML = '';
        const article = document.createElement('article');
        article.setAttribute('aria-label', `Meteorología de la carrera ${fecha}`);
        article.innerHTML = `<h3>Meteorología del día de la carrera: ${fecha}</h3>`;

        // Resumen diario
        const dl = document.createElement('dl');
        const addDtDd = (dt, dd) => { const dtEl = document.createElement('dt'); dtEl.textContent = dt; const ddEl = document.createElement('dd'); ddEl.textContent = dd; dl.appendChild(dtEl); dl.appendChild(ddEl); };
        addDtDd('Salida del sol', out.daily.sunrise || 'N/D');
        addDtDd('Puesta del sol', out.daily.sunset || 'N/D');
        article.appendChild(dl);

        // Tabla/hora por hora: creamos una tabla semántica
        const table = document.createElement('table');
        table.innerHTML = '<caption>Datos por hora</caption>';
        const thead = document.createElement('thead');
        thead.innerHTML = '<tr><th>Hora</th><th>Temp (°C)</th><th>Sensación (°C)</th><th>Lluvia (mm)</th><th>Humedad (%)</th><th>Vel. Viento (m/s)</th><th>Dirección (°)</th></tr>';
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        const times = json.hourly && json.hourly.time ? json.hourly.time : [];
        for (let i=0;i<times.length;i++){
            const tr = document.createElement('tr');
            const t = (times[i] || '').replace('T',' ');
            const temp = (out.hourly.temperature_2m && out.hourly.temperature_2m[i] !== undefined) ? out.hourly.temperature_2m[i] : '';
            const app = (out.hourly.apparent_temperature && out.hourly.apparent_temperature[i] !== undefined) ? out.hourly.apparent_temperature[i] : '';
            const prec = (out.hourly.precipitation && out.hourly.precipitation[i] !== undefined) ? out.hourly.precipitation[i] : '';
            const hum = (out.hourly.relativehumidity_2m && out.hourly.relativehumidity_2m[i] !== undefined) ? out.hourly.relativehumidity_2m[i] : '';
            const ws = (out.hourly.windspeed_10m && out.hourly.windspeed_10m[i] !== undefined) ? out.hourly.windspeed_10m[i] : '';
            const wd = (out.hourly.winddirection_10m && out.hourly.winddirection_10m[i] !== undefined) ? out.hourly.winddirection_10m[i] : '';
            tr.innerHTML = `<td>${t}</td><td>${temp}</td><td>${app}</td><td>${prec}</td><td>${hum}</td><td>${ws}</td><td>${wd}</td>`;
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        article.appendChild(table);
        cont.appendChild(article);
    }

    // Tarea 6: obtener meteorología de los 3 días de entrenamientos previos al diaFinal (incluye diaFinal y 2 previos)
    getMeteorologiaEntrenos(fechaFinal) {
        const coords = this.#parseCoordenadas();
        if (!coords) {
            console.error('Coordenadas no válidas para obtener meteorología');
            console.warn('Coordenadas no validas. Comprueba los datos de la ciudad.');
            return;
        }
        // Calcular rango: fechaFinal y los 2 días anteriores
        const end = new Date(fechaFinal);
        const start = new Date(end);
        start.setDate(end.getDate() - 2);
        const yyyy = (d) => d.toISOString().slice(0,10);
        const start_date = yyyy(start);
        const end_date = yyyy(end);

        const hourly = 'temperature_2m,precipitation,windspeed_10m,relativehumidity_2m';
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lon}&start_date=${start_date}&end_date=${end_date}&hourly=${hourly}&timezone=auto`;

        $.getJSON(url)
         .done((json) => this.procesarJSONEntrenos(json, start_date, end_date))
         .fail(err => {
            console.error('Error al obtener meteorología de entrenos', err);
            console.warn('Error al obtener datos meteorológicos de entrenos. Comprueba la consola para más detalles.');
         });
    }

    // Procesar entrenamientos: calcular media diaria para cada día y mostrar (dos decimales)
    procesarJSONEntrenos(json, start_date, end_date) {
        if (!json || !json.hourly) { console.warn('JSON inválido en procesarJSONEntrenos'); return; }
        const times = json.hourly.time || [];
        const temps = json.hourly.temperature_2m || [];
        const prec = json.hourly.precipitation || [];
        const wind = json.hourly.windspeed_10m || [];
        const hum = json.hourly.relativehumidity_2m || [];

        // Agrupar por fecha
        const groups = {}; // date => {count, tempSum, precSum, windSum, humSum}
        for (let i=0;i<times.length;i++){
            const date = times[i].slice(0,10);
            if (!groups[date]) groups[date] = {count:0, temp:0, prec:0, wind:0, hum:0};
            groups[date].count++;
            groups[date].temp += (temps[i] || 0);
            groups[date].prec += (prec[i] || 0);
            groups[date].wind += (wind[i] || 0);
            groups[date].hum += (hum[i] || 0);
        }

        const results = [];
        Object.keys(groups).sort().forEach(date => {
            const g = groups[date];
            const avg = (v) => (g.count ? (v/g.count) : 0);
            results.push({
                date,
                temp: Number(avg(g.temp).toFixed(2)),
                prec: Number(avg(g.prec).toFixed(2)),
                wind: Number(avg(g.wind).toFixed(2)),
                hum: Number(avg(g.hum).toFixed(2))
            });
        });

        // Renderizar
        const cont = document.querySelector('[data-meteorologia-entrenos]');
        if (!cont) return;
        cont.innerHTML = '';
        const article = document.createElement('article');
        article.setAttribute('aria-label', `Meteorología entrenos ${start_date} - ${end_date}`);
        article.innerHTML = `<h3>Meteorología entrenamientos (${start_date} → ${end_date})</h3>`;

        const table = document.createElement('table');
        table.innerHTML = '<caption>Medias diarias de entrenos</caption>';
        const thead = document.createElement('thead');
        thead.innerHTML = '<tr><th>Fecha</th><th>Temp media (°C)</th><th>Lluvia media (mm)</th><th>Vel. Viento media (m/s)</th><th>Humedad media (%)</th></tr>';
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        results.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${r.date}</td><td>${r.temp}</td><td>${r.prec}</td><td>${r.wind}</td><td>${r.hum}</td>`;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        article.appendChild(table);
        cont.appendChild(article);
    }
}