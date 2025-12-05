class Ciudad{
    #pais
    #gentilicio
    #nombre 
    #poblacion
    #coordenadas
    constructor(nombre, pais, gentilicio){
        nombre = nombre;
        pais = pais;
        gentilicio = gentilicio;
    }

    rellenarAtributos(poblacion, coordenadas){
        poblacion = poblacion;
        coordenadas = coordenadas;
    }

    obtenerNombre(){
        return nombre;
    }
    obtenerPais(){
        return pais;
    }
    obtenerGentilicioPoblacion(){
        const gentilicio = this.gentilicio ?? 'Desconocido';
        const poblacion = (this.poblacion !== undefined && this.poblacion !== null) ? this.poblacion : 'Desconocida';
        return `<ul><li>Gentilicio: ${gentilicio}</li><li>Población: ${poblacion}</li></ul>`;
    }

    obtenerDescripcion(){
        return `${nombre} es una ciudad de ${pais} y su gentilicio es ${gentilicio}.`;
    }

    mostrarCoordenadas(){
        const coordenadas = this.coordenadas ?? 'Desconocidas';
        //document.write(`<p>Coordenadas: ${coordenadas}</p>`);
        const mensaje = document.createElement('p');
        mensaje.textContent = `Coordenadas: ${coordenadas}`;
        document.body.appendChild(mensaje);
    }
}