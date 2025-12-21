<?php
// Procesa el POST de la prueba de usabilidad y guarda en BD
$DB_HOST = 'localhost';
$DB_USER = 'DBUSER2025';
$DB_PASS = 'DBPSWD2025';
$DB_NAME = 'user_db';

// Intentar usar cronómetro del servidor (si existe)
require_once __DIR__ . '/Cronometro.php';
session_start();
$serverCron = $_SESSION['cronometro'] ?? null;

// Recoger y validar
function render_response($title, $body, $status=200) {
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    echo "<!doctype html>\n<html lang=\"es\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>".htmlspecialchars($title)."</title>\n<link rel=\"stylesheet\" href=\"/estilo/estilo.css\">\n</head>\n<body>\n<main class=\"content\" style=\"max-width:900px;margin:1em auto;\">\n".$body."\n</main>\n</body>\n</html>";
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    render_response('Method Not Allowed', '<h1>Method Not Allowed</h1><p>Este endpoint acepta únicamente peticiones POST.</p>', 405);
}
// Preferir tiempo provisto por el cronómetro del servidor si existe
$time_taken = null;
if ($serverCron) {
    // Asegurarse de que el cron se detiene para obtener tiempo final
    $serverCron->parar();
    $time_taken = intval(round($serverCron->getElapsedSeconds()));
    // actualizar sesión
    $_SESSION['cronometro'] = $serverCron;
} else {
    $time_taken = isset($_POST['time_taken']) ? intval($_POST['time_taken']) : null;
}
// Preparar representación en HH:MM:SS y dejar lista la entrada 'time' para el JSON
$timeSql = '00:00:00';
if ($time_taken !== null) {
    $timeSql = gmdate('H:i:s', max(0,intval($time_taken)));
}
// usuario
$profession = trim($_POST['profession'] ?? '');
$age = isset($_POST['age']) ? intval($_POST['age']) : null;
$gender = $_POST['gender'] ?? '';
$computer_expertise = $_POST['computer_expertise'] ?? '';

// Ajuste a formulario actual: no hay campo "would_use" ni "observer_comments"
$proposals = trim($_POST['proposals'] ?? '');
$observer_comments = ''; // campo no presente en el formulario actual
$completed = isset($_POST['completed']) ? (int)$_POST['completed'] : null;
$assessment = isset($_POST['assessment']) ? intval($_POST['assessment']) : null;
$device = trim($_POST['device'] ?? '');

$responses = ['time' => $timeSql];
if ($device === '') {
    render_response('Petición incorrecta', '<h1>Petición incorrecta</h1><p>Por favor indica el dispositivo utilizado.</p>', 400);
}
$responses['device'] = $device;

// Información adicional solicitada por el profesor: datos de la carrera y preguntas relacionadas
$pilot_name = trim($_POST['pilot_name'] ?? '');
$race_name = trim($_POST['race_name'] ?? '');
$race_location = trim($_POST['race_location'] ?? '');
$race_weather = trim($_POST['race_weather'] ?? '');
$race_time_field = trim($_POST['race_time'] ?? '');

// No hay preguntas de 'site_*' en el formulario actual; mapeamos únicamente las preguntas existentes
// (pero mantenemos compatibilidad con q1..q6 si llegan por otras versiones)
$site_found = isset($_POST['site_found']) ? intval($_POST['site_found']) : (isset($_POST['q1']) ? intval($_POST['q1']) : null);
$site_easy_to_find = isset($_POST['site_easy_to_find']) ? intval($_POST['site_easy_to_find']) : (isset($_POST['q2']) ? intval($_POST['q2']) : null);
$site_content_clear = isset($_POST['site_content_clear']) ? intval($_POST['site_content_clear']) : (isset($_POST['q3']) ? intval($_POST['q3']) : null);
$site_navigation = isset($_POST['site_navigation']) ? intval($_POST['site_navigation']) : (isset($_POST['q4']) ? intval($_POST['q4']) : null);
$site_design = isset($_POST['site_design']) ? intval($_POST['site_design']) : (isset($_POST['q5']) ? intval($_POST['q5']) : null);
$site_improvements = trim($_POST['site_improvements'] ?? (trim($_POST['q6'] ?? '')));
// Nota: si no llegan estos campos, quedarán a null; no son obligatorios en el formulario actual

// Campos del circuito (renombrados en el formulario)
$circuit_desnivel = (isset($_POST['circuit_desnivel']) && $_POST['circuit_desnivel'] !== '') ? intval($_POST['circuit_desnivel']) : null;
$curvas_pronunciadas = (isset($_POST['curvas_pronunciadas']) && $_POST['curvas_pronunciadas'] !== '') ? intval($_POST['curvas_pronunciadas']) : null;
$circuito_urbano = (isset($_POST['circuito_urbano']) && $_POST['circuito_urbano'] !== '') ? intval($_POST['circuito_urbano']) : null;
$largas_rectas = (isset($_POST['largas_rectas']) && $_POST['largas_rectas'] !== '') ? intval($_POST['largas_rectas']) : null;
$patrocinador = (isset($_POST['patrocinador']) && $_POST['patrocinador'] !== '') ? intval($_POST['patrocinador']) : null;
$circuit_improvements = trim($_POST['circuit_improvements'] ?? '');

// Nuevas preguntas sobre la clasificación y el ganador
$winner_name = trim($_POST['winner_name'] ?? '');
$winner_nationality = trim($_POST['winner_nationality'] ?? '');
$q_podio_clear = isset($_POST['q_podio_clear']) ? intval($_POST['q_podio_clear']) : null;
$q_points_ok = isset($_POST['q_points_ok']) ? intval($_POST['q_points_ok']) : null;
$q_winner_info = isset($_POST['q_winner_info']) ? intval($_POST['q_winner_info']) : null;
$q_winner_add = trim($_POST['q_winner_add'] ?? '');

// Añadir al conjunto de respuestas que se almacenará en la columna JSON/text
// Nombres lógicos y cortos para el JSON
$responses['profession'] = $profession;
$responses['age'] = $age;
$responses['gender'] = $gender;
$responses['computer_expertise'] = $computer_expertise;

$responses['pilot'] = $pilot_name;
$responses['race'] = $race_name;
$responses['location'] = $race_location;
$responses['weather'] = $race_weather;
$responses['race_time'] = $race_time_field;

// Circuito: claves lógicas en inglés (más legibles)
$responses['circuit_elevation'] = $circuit_desnivel;
$responses['circuit_sharp_turns'] = $curvas_pronunciadas;
$responses['circuit_urban'] = $circuito_urbano;
$responses['circuit_long_straights'] = $largas_rectas;
$responses['main_sponsor'] = $patrocinador;
$responses['circuit_improvements'] = $circuit_improvements;

// Observaciones y propuestas
$responses['proposals'] = $proposals;

// Clasificación y ganador: si el formulario no las incluye quedarán vacías (compatibilidad con versiones anteriores)
$responses['winner_name'] = $winner_name;
$responses['winner_nationality'] = $winner_nationality;
$responses['podio_clear'] = isset($podio_clear) ? $podio_clear : null;
$responses['points_ok'] = isset($points_ok) ? $points_ok : null;
$responses['winner_info'] = isset($winner_info) ? $winner_info : null;
$responses['winner_add'] = isset($winner_add) ? $winner_add : '';

// Guardar en BD
$mysqli = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($mysqli->connect_errno) {
    // Mensaje más útil para el desarrollador / alumno
    $hint = "Comprueba que has creado el usuario 'DBUSER2025' con la contraseña 'DBPSWD2025' y que la base 'user_db' existe. Ejecuta 'php/create_db_user.sql' y 'php/database.sql' desde phpMyAdmin o mysql CLI si es necesario.";
    render_response('Error conexión BD', '<h1>Error conexión BD</h1><p>Access denied para el usuario especificado o la base de datos no existe.</p><p>' . htmlspecialchars($hint) . '</p>', 500);
}
$mysqli->set_charset('utf8mb4');

$mysqli->set_charset('utf8mb4');
// Comprobar si la columna `responses` existe en la tabla `result`. Si no existe, crearla.
$colCheck = $mysqli->query("SHOW COLUMNS FROM `result` LIKE 'responses'");
if ($colCheck && $colCheck->num_rows === 0) {
    // Añadir columna TEXT para almacenar las respuestas (compatibilidad máxima)
    $alter = "ALTER TABLE `result` ADD COLUMN `responses` TEXT NULL AFTER `user_id`";
    if (!$mysqli->query($alter)) {
        // Si no se puede añadir la columna JSON, fallamos y avisamos
        echo 'Error: no existe la columna responses y no pudo ser creada automáticamente. Ejecuta el SQL necesario o contacta con el administrador.';
        exit;
    }
}

// Insertar usuario (asumimos que la tabla `user` con columna `user_id` existe según tu script SQL)
$stmtUser = $mysqli->prepare('INSERT INTO `user` (`profession`,`age`,`gender`,`computer_expertise`) VALUES (?,?,?,?)');
$stmtUser->bind_param('siss', $profession, $age, $gender, $computer_expertise);
$okUser = $stmtUser->execute();
$userId = $stmtUser->insert_id;
$stmtUser->close();

// preparar y guardar resultado
$jsonRes = json_encode($responses, JSON_UNESCAPED_UNICODE);

$completedInt = $completed ? 1 : 0;
$assessmentVal = $assessment !== null ? intval($assessment) : null;

$stmtRes = $mysqli->prepare('INSERT INTO `result` (`user_id`,`responses`,`time`,`completed`,`comments`,`proposals`,`assessment`) VALUES (?,?,?,?,?,?,?)');
$stmtRes->bind_param('ississi', $userId, $jsonRes, $timeSql, $completedInt, $observer_comments, $proposals, $assessmentVal);
$ok = $stmtRes->execute();
$resultId = $mysqli->insert_id;
$stmtRes->close();

$mysqli->close();

if ($ok) {
    // Redirigir a una página de resumen que muestra el contenido guardado
    header('Location: test_result.php?result_id=' . intval($resultId));
    exit;
} else {
    render_response('Error al guardar la prueba', '<h1>Error</h1><p>Error al guardar la prueba: '.htmlspecialchars($mysqli->error).'</p>', 500);
}
