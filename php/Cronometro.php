<?php
class Cronometro{
    private $tiempo;
    private $inicio;
    private $enMarcha;

    public function __construct(){
        $this->inicio = 0.0;
        $this->tiempo = 0.0;
        $this->enMarcha = false;
    }

    public function arrancar(){
        if (!$this->enMarcha) {
            $this->inicio = microtime(true);
            $this->enMarcha = true;
        }
    }

    public function parar(){
        if ($this->enMarcha) {
            $this->tiempo = microtime(true) - $this->inicio;
            $this->enMarcha = false;
        }
    }

    // Devuelve segundos transcurridos (float)
    public function getElapsedSeconds(){
        if ($this->enMarcha) return microtime(true) - $this->inicio;
        return $this->tiempo;
    }

    // Indica si el cronómetro está activo
    public function isRunning(){
        return (bool)$this->enMarcha;
    }

    // Devuelve tiempo formateado mm:ss.s o HH:MM:SS cuando sea mayor
    public function getFormattedTime(){
        $elapsed = $this->getElapsedSeconds();
        $hours = floor($elapsed / 3600);
        if ($hours > 0) {
            return gmdate('H:i:s', intval($elapsed));
        }
        $minutes = floor($elapsed / 60);
        $seconds = $elapsed - ($minutes * 60);
        return sprintf('%02d:%04.1f', $minutes, $seconds);
    }

    // Método existente, dejar por compatibilidad pero NO imprime ahora
    public function mostrar(){
        return $this->getFormattedTime();
    }

    public function pulsarBoton($boton){
        switch ($boton) {
            case 'arrancar': $this->arrancar(); break;
            case 'parar': $this->parar(); break;
            case 'mostrar': /* legacy: return formatted string */ return $this->mostrar(); break;
        }
        return null;
    }
}
