<!DOCTYPE HTML>

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
        <p>Estás en: <a href="index.html">Inicio</a> &gt;&gt; <strong>Clasificaciones</strong></p>

        <section aria-label="Ganador de la carrera">
          <h2>Ganador</h2>
          <article id="ganador">
            <!-- Se rellenará desde XML en el servidor -->
            <?php
              try {
                $xmlPath = __DIR__ . '/xml/circuitoEsquema.xml';
                if (!file_exists($xmlPath)) throw new Exception('Fichero XML no encontrado');
                $doc = new DOMDocument();
                $doc->load($xmlPath);
                $xpath = new DOMXPath($doc);
                $xpath->registerNamespace('u','http://www.uniovi.es');

                // Nombre ganador
                $nombreNode = $xpath->query('//u:ganador/u:nombreGanador')->item(0);
                $tiempoNode = $xpath->query('//u:ganador/u:tiempo')->item(0);
                if ($nombreNode && $tiempoNode) {
                  $nombre = htmlspecialchars(trim($nombreNode->textContent));
                  $tiempo = htmlspecialchars(trim($tiempoNode->textContent));
                  echo "<p><strong>" . $nombre . "</strong> — Tiempo: <time datetime=\"" . $tiempo . "\">" . $tiempo . "</time></p>";
                } else {
                  echo "<p>No se ha encontrado información del ganador en el fichero XML.</p>";
                }

                // Podio (se incluye aquí dentro del mismo try para garantizar que $xpath está definido)
                $corredores = $xpath->query('//u:podio/u:corredor');
                // almacenamos el resultado en una variable para que el bloque de podio en el HTML pueda usarla
                $GLOBALS['__clasificaciones_podio'] = $corredores;

              } catch (Exception $e) {
                echo '<p>Error leyendo XML: ' . htmlspecialchars($e->getMessage()) . '</p>';
                $GLOBALS['__clasificaciones_podio'] = null;
              }
            ?>
          </article>
        </section>

        <section aria-label="Podio de la carrera">
          <h2>Podio</h2>
          <ol>
            <?php
              $corredores = $GLOBALS['__clasificaciones_podio'] ?? null;
              if ($corredores && $corredores->length>0) {
                foreach ($corredores as $c) {
                  // Si el nodo viene de DOMNode, usamos XPath para extraer los campos
                  $pos = '';
                  $nombre = '';
                  $puntos = '';
                  try {
                    $pos = $c->getElementsByTagName('posicion')->item(0) ? $c->getElementsByTagName('posicion')->item(0)->textContent : '';
                    $nombre = $c->getElementsByTagName('nombreCorredorPodio')->item(0) ? $c->getElementsByTagName('nombreCorredorPodio')->item(0)->textContent : '';
                    $puntos = $c->getElementsByTagName('puntos')->item(0) ? $c->getElementsByTagName('puntos')->item(0)->textContent : '';
                  } catch (Exception $e) { /* ignore */ }
                  echo '<li><strong>' . htmlspecialchars(trim($nombre)) . '</strong> — Puntos: ' . htmlspecialchars(trim($puntos)) . '</li>';
                }
              } else {
                echo '<li>No hay información de podio.</li>';
              }
            ?>
          </ol>
        </section>

    </main>

    
</body>
</html>