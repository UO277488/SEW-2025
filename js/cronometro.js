class Cronometro {
    #tiempo

    #inicio
    #actual

    #stop

    #elementoMostrar
    
    #corriendo

    constructor(elementoMostrar = null) {
        this.#tiempo = 0;
        this.#stop = true;
        this.#elementoMostrar = elementoMostrar;
        this.#mostrar();
    }

    arrancar() {
        if (!this.#stop) return;
        try {
            this.#inicio = Temporal.Now.instant();
        } catch(err) {
            this.#inicio = Date.now();
        }
        this.#corriendo = setInterval(this.#actualizar.bind(this), 100);
        this.#stop = false;
        this.#mostrar();
    }

    #actualizar() {
        try {
            this.#actual = Temporal.Now.instant();
        } catch(err) {
            this.#actual = Date.now();
        }
        this.#mostrar();
    }

    parar() {
        if (this.#stop) return;
        if (this.#corriendo) {
            clearInterval(this.#corriendo);
            this.#corriendo = null;
        }
        this.#stop = true;
        this.#mostrar();
    }

    reiniciar() {
        if (this.#corriendo) {
            clearInterval(this.#corriendo);
            this.#corriendo = null;
        }
        this.#stop = true;
        this.#tiempo = 0;
        this.#actual = undefined;  // Limpiar el tiempo actual
        this.#inicio = undefined;  // Limpiar el tiempo inicial
        this.#mostrar();
    }

    #mostrar() {
        if (this.#actual && this.#inicio) {
            try {
                this.#tiempo = this.#actual.since(this.#inicio).total('milliseconds');
            } catch(err) {
                this.#tiempo = this.#actual - this.#inicio;
            }
        }
        var ms = this.#tiempo;

        // calcular minutos, segundos y décimas
        var minutos = parseInt(ms / (1000 * 60));
        var segundos = parseInt((ms % (1000 * 60)) / 1000);
        var decimas = parseInt((ms % 1000) / 100);

        // formatear con ceros delante según especificación mm:ss.s
        var mm = String(minutos).padStart(2, '0');
        var ss = String(segundos).padStart(2, '0');
        var d = String(decimas);

        var texto = mm + ":" + ss + "." + d;

        // Actualizar el elemento si se proporcionó uno
        if (this.#elementoMostrar) {
            this.#elementoMostrar.textContent = texto;
        }

        return texto;
    }
}