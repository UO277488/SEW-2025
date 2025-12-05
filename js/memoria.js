class Memoria {

    #tablero_bloqueado;
    #primera_carta;
    #segunda_carta;
    #cronometro

    constructor(elementoCronometro = null) {
        tablero_bloqueado = true;
        primera_carta = null;
        segunda_carta = null;

        cronometro = new Cronometro(elementoCronometro);

        barajarCartas();
        tablero_bloqueado = false;

        cronometro.arrancar();
    }

    voltearCarta(carta) {
        if (tablero_bloqueado) return;
        if (!carta) return;
        if (carta.dataset.estado === 'revelada') return;
        if (carta.dataset.estado === 'volteada') return;

        carta.dataset.estado = 'volteada';

        if (!primera_carta) {
            primera_carta = carta;
            return;
        }

        if (primera_carta === carta) return;

        segunda_carta = carta;
        comprobarPareja();
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
        tablero_bloqueado = false;  
        primera_carta = null;
        segunda_carta = null;
    }

    #comprobarJuego() {
        const cartas = document.querySelectorAll('main article');
        if (!cartas || cartas.length === 0) return false;

        for (const c of cartas) {
            if (c.dataset.estado !== 'revelada') {
                return false;
            }
        }


        if (cronometro) {
            cronometro.parar();
        }

        return true;
    }

    
    #cubrirCartas() {
        tablero_bloqueado = true;

        const primera = primera_carta;
        const segunda = segunda_carta;

        
        setTimeout(() => {
            if (primera) primera.removeAttribute('data-estado');
            if (segunda) segunda.removeAttribute('data-estado');
            reiniciarAtributos();
        }, 1500);
    }

    
    #deshabilitarCartas() {
        if (primera_carta) primera_carta.dataset.estado = 'revelada';
        if (segunda_carta) segunda_carta.dataset.estado = 'revelada';

        comprobarJuego();
        reiniciarAtributos();
    }

    #comprobarPareja() { //Por imagen
        if (!primera_carta || !segunda_carta) return;

        const img1 = primera_carta.querySelector('img');
        const img2 = segunda_carta.querySelector('img');

        const src1 = img1 ? img1.getAttribute('src') : '';
        const src2 = img2 ? img2.getAttribute('src') : '';

        (src1 === src2) ? deshabilitarCartas() : cubrirCartas();
    }
}