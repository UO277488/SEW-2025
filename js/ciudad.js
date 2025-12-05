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
}