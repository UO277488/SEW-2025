class Memoria {

    #tablero_bloqueado;
    #primera_carta;
    #segunda_carta;
    #cronometro

    constructor(elementoCronometro = null) {
        this.#tablero_bloqueado = true;
        this.#primera_carta = null;
        this.#segunda_carta = null;

        this.#cronometro = new Cronometro(elementoCronometro);

        this.#barajarCartas();
        this.#tablero_bloqueado = false;

        this.#cronometro.arrancar();
    }

    voltearCarta(carta) {
        if (this.#tablero_bloqueado) return;
        if (!carta) return;
        if (carta.dataset.estado === 'revelada') return;
        if (carta.dataset.estado === 'volteada') return;

        carta.dataset.estado = 'volteada';

        if (!this.#primera_carta) {
            this.#primera_carta = carta;
            return;
        }

        if (this.#primera_carta === carta) return;

        this.#segunda_carta = carta;
        this.#comprobarPareja();
    }

    #barajarCartas() {
        const cont = document.querySelector('main');
        if (!cont) return;

        // Obtener todas las cartas después del script
        const script = document.querySelector('main script');
        if (!script) return;

        // Recolectar todas las cartas
        const cartas = Array.from(document.querySelectorAll('main article'));
        
        // Algoritmo de Fisher-Yates para barajar
        for (let i = cartas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
        }

        // Reinsertar las cartas barajadas después del script
        cartas.forEach(c => cont.appendChild(c));
    }

    #reiniciarAtributos() {
        this.#tablero_bloqueado = false;  
        this.#primera_carta = null;
        this.#segunda_carta = null;
    }

    #comprobarJuego() {
        const cartas = document.querySelectorAll('main article');
        if (!cartas || cartas.length === 0) return false;

        for (const c of cartas) {
            if (c.dataset.estado !== 'revelada') {
                return false;
            }
        }


        if (this.#cronometro) {
            this.#cronometro.parar();
        }

        return true;
    }

    
    #cubrirCartas() {
        this.#tablero_bloqueado = true;

        const primera = this.#primera_carta;
        const segunda = this.#segunda_carta;

        
        setTimeout(() => {
            if (primera) primera.removeAttribute('data-estado');
            if (segunda) segunda.removeAttribute('data-estado');
            this.#reiniciarAtributos();
        }, 1500);
    }

    
    #deshabilitarCartas() {
        if (this.#primera_carta) this.#primera_carta.dataset.estado = 'revelada';
        if (this.#segunda_carta) this.#segunda_carta.dataset.estado = 'revelada';

        this.#comprobarJuego();
        this.#reiniciarAtributos();
    }

    #comprobarPareja() { //Por imagen
        if (!this.#primera_carta || !this.#segunda_carta) return;

        const img1 = this.#primera_carta.querySelector('img');
        const img2 = this.#segunda_carta.querySelector('img');

        const src1 = img1 ? img1.getAttribute('src') : '';
        const src2 = img2 ? img2.getAttribute('src') : '';

        (src1 === src2) ? this.#deshabilitarCartas() : this.#cubrirCartas();
    }
}