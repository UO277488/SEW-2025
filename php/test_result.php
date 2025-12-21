<?php
// Muestra el resultado guardado (JSON de "responses") y permite descargarlo
require_once __DIR__ . '/Configuracion.php'; // no estrictamente necesario pero dejamos para el include path
$DB_HOST = 'localhost';
$DB_USER = 'DBUSER2025';
$DB_PASS = 'DBPSWD2025';
$DB_NAME = 'user_db';

$resultId = isset($_GET['result_id']) ? intval($_GET['result_id']) : 0;
if (!$resultId) {
    http_response_code(400);
    echo "<h1>Petición incorrecta</h1><p>Se requiere result_id</p>";
    exit;
}
$mysqli = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($mysqli->connect_errno) {
    echo "<h1>Error conexión BD</h1><p>No se puede conectar con la base de datos. Comprueba que has ejecutado los scripts SQL.</p>";
    exit;
}
$mysqli->set_charset('utf8mb4');

$stmt = $mysqli->prepare('SELECT r.result_id, r.time, r.completed, r.comments, r.proposals, r.assessment, r.responses, u.profession, u.age, u.gender FROM `result` r LEFT JOIN `user` u ON r.user_id = u.user_id WHERE r.result_id = ?');
$stmt->bind_param('i', $resultId);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$stmt->close();
$mysqli->close();

if (!$row) {
    http_response_code(404);
    echo "<h1>No encontrado</h1><p>No se encontró la prueba solicitada.</p>";
    exit;
}

$responses = json_decode($row['responses'], true) ?: [];
// No exponer 'time' al usuario: usar una copia para mostrar/descargar sin la clave 'time'
$displayResponses = $responses;
if (isset($displayResponses['time'])) {
    unset($displayResponses['time']);
}

// Gestión de descarga (debe realizarse antes de enviar HTML)
if (isset($_GET['download'])) {
    $d = $_GET['download'];
    if ($d === 'json') {
        header('Content-Type: application/json; charset=utf-8');
        header('Content-disposition: attachment; filename=result_' . $resultId . '.json');
        echo json_encode($displayResponses, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
        exit;
    } elseif ($d === 'csv') {
        // Convertir respuestas a CSV plano (clave,valor)
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-disposition: attachment; filename=result_' . $resultId . '.csv');
        $out = fopen('php://output', 'w');
        fputcsv($out, ['clave','valor']);
        foreach ($displayResponses as $k => $v) {
            if (is_array($v)) $v = json_encode($v, JSON_UNESCAPED_UNICODE);
            fputcsv($out, [$k, $v]);
        }
        fclose($out);
        exit;
    }
}

?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Resultado prueba #<?=htmlspecialchars($resultId)?></title>
<link rel="stylesheet" href="../estilo/estilo.css">
</head>
<body>
<main class="content" style="max-width:900px;margin:1em auto;">
  <h1>Resultado de la prueba (#<?=htmlspecialchars($resultId)?>)</h1>
  <p><strong>Usuario:</strong> <?=htmlspecialchars($row['profession'] ?? '')?> — <?=htmlspecialchars($row['gender'] ?? '')?> — <?=htmlspecialchars($row['age'] ?? '')?></p>

  <h2>Resumen</h2>
  <dl>
    <dt>Piloto</dt><dd><?=htmlspecialchars($responses['pilot'] ?? ($responses['pilot_name'] ?? ''))?></dd>
    <dt>Carrera</dt><dd><?=htmlspecialchars($responses['race'] ?? ($responses['race_name'] ?? ''))?></dd>
    <dt>Ganador</dt><dd><?=htmlspecialchars($responses['winner_name'] ?? '')?> (<?=htmlspecialchars($responses['winner_nationality'] ?? '')?>)</dd>
    <dt>Patrocinador</dt><dd><?php
      $map = [ '3'=>'Ducati','2'=>'Red Bull','1'=>'Lenovo','0'=>'Yamaha' ];
      $key = isset($responses['main_sponsor']) ? (string)$responses['main_sponsor'] : (isset($responses['patrocinador']) ? (string)$responses['patrocinador'] : '');
      echo htmlspecialchars($map[$key] ?? $key);
    ?></dd>
  </dl>

  <h2>Resumen rápido</h2>
  <dl>
    <dt>Volvería a usar</dt><dd><?=htmlspecialchars(isset($responses['would_use']) ? $responses['would_use'] : '')?></dd>
    <dt>Encontró información</dt><dd><?=htmlspecialchars(isset($responses['site_found']) ? ($responses['site_found'] ? 'Sí' : 'No') : '')?></dd>
    <dt>Fácil de encontrar</dt><dd><?=htmlspecialchars(isset($responses['site_easy_to_find']) ? ($responses['site_easy_to_find'] ? 'Sí' : 'No') : '')?></dd>
    <dt>Diseño apreciado</dt><dd><?=htmlspecialchars(isset($responses['site_design']) ? ($responses['site_design'] ? 'Sí' : 'No') : '')?></dd>
  </dl>

  <h2>Respuestas (JSON)</h2>
  <pre style="white-space:pre-wrap;background:#f7f7f7;padding:1em;border:1px solid #ddd;"><?=htmlspecialchars(json_encode($displayResponses, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE))?></pre>

  <p>
    <a href="test_result.php?result_id=<?=intval($resultId)?>&download=json">Descargar JSON</a> |
    <a href="test_result.php?result_id=<?=intval($resultId)?>&download=csv">Descargar CSV</a> |
    <a href="/">Volver al inicio</a>
  </p>
</main>
</body>
</html>
