<?php
require_once __DIR__ . '/php/Cronometro.php';
session_start();
?>
<!doctype html>
<html lang="es">
    <head>
        <!-- Datos que describen el documento -->
        <meta name ="author" content ="Luis Sánchez de Posada Orihuela, UO277488" />
        <meta name ="description" content ="documento a utilizar en otros módulos de la asignatura a fecha de creación del proyecto" />
        <meta name ="keywords" content ="aquí cada documento debe tener la lista
    de las palabras clave del mismo separadas por comas" />
        <meta name ="viewport" content ="width=device-width, initial-scale=1.0" />
        <meta charset="UTF-8" />
        <link rel="icon" href="multimedia/favicon.ico" type="image/x-icon">
        <link rel="stylesheet" href="estilo/estilo.css">
        <link rel="stylesheet" href="estilo/layout.css">
        <title>MotoGP-Clasificación</title>
    </head>

    <body>
    <header>
    <!-- Datos con el contenidos que aparece en el navegador -->
        <h1>
            <a href="index.html" title="Ir a la página principal">MotoGP Desktop</a>
        </h1>
        <nav>
            <a href="index.html" title="Página principal">Inicio</a>
            <a href="piloto.html" title="Información del piloto">Piloto</a>
            <a href="circuito.html" title="Información del circuito">Circuito</a>
            <a href="meteorología.html" title="Información de la meteorología">Meteorología</a>
            <a href="clasificaciones.php" class ="active" title="Información sobre las clasificaciones">Clasificaciones</a>
            <a href="juegos.html" title="Información a cerca de los juegos">Juegos</a>
            <a href="ayuda.html" title="Accede a la ayuda">Ayuda</a>
        </nav>
    </header>

    <main>
        <p>Estás en: <a href="index.html">Inicio</a> &gt;&gt; <strong>Cronómetro</strong></p>

        <h2>Cronómetro</h2>

        <h3> Pulse un botón para controlar el cronómetro: </h3>

        <form action='#' method='post' name='botones'>
            <input type='submit' class='button' name='arrancar' value='Arrancar' />
            <input type='submit' class='button' name='parar' value='Parar' />
            <input type='submit' class='button' name='mostrar' value='Mostrar' /> 
        </form>
            <?php
                $cronometro = $_SESSION['cronometro'] ?? new Cronometro();

                if (count($_POST)>0) 
                {   
                    if (isset($_POST['arrancar'])) {
                      $cronometro->pulsarBoton('arrancar');
                    } elseif (isset($_POST['parar'])) {
                      $cronometro->pulsarBoton('parar');
                    } elseif (isset($_POST['mostrar'])) {
                      $res = $cronometro->pulsarBoton('mostrar');
                      if ($res) echo '<p>Tiempo: <strong>' . htmlspecialchars($res) . '</strong></p>';
                    }

                    // actualiza la sesión manteniendo el estado del cronómetro
                    $_SESSION['cronometro'] = $cronometro;
                }
            ?>
    </main>

    
</body>
</html>