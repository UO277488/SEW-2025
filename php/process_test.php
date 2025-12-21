<?php
// Procesa el POST de la prueba de usabilidad y guarda en BD
$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'user_db';

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
$time_taken = isset($_POST['time_taken']) ? intval($_POST['time_taken']) : null;
// usuario
$profession = trim($_POST['profession'] ?? '');
$age = isset($_POST['age']) ? intval($_POST['age']) : null;
$gender = $_POST['gender'] ?? '';
$computer_expertise = $_POST['computer_expertise'] ?? '';

$observer_comments = trim($_POST['observer_comments'] ?? '');
$proposals = trim($_POST['proposals'] ?? '');
$completed = isset($_POST['completed']) ? (int)$_POST['completed'] : null;
$assessment = isset($_POST['assessment']) ? intval($_POST['assessment']) : null;
$device = trim($_POST['device'] ?? '');
$would_use = isset($_POST['would_use']) ? (int)$_POST['would_use'] : null;

$responses = [];
if ($device === '') {
    render_response('Petición incorrecta', '<h1>Petición incorrecta</h1><p>Por favor indica el dispositivo utilizado.</p>', 400);
}
if ($would_use === null) {
    render_response('Petición incorrecta', '<h1>Petición incorrecta</h1><p>Por favor indica si volverías a usar la aplicación.</p>', 400);
}
$responses['device'] = $device;
$responses['would_use'] = $would_use ? 'yes' : 'no';

// Guardar en BD
$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($mysqli->connect_errno) die('Error conexión BD: ' . $mysqli->connect_error);
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
$timeSql = '00:00:00';
if ($time_taken !== null) {
    // convertir segundos a HH:MM:SS
    $timeSql = gmdate('H:i:s', max(0,intval($time_taken)));
}

$completedInt = $completed ? 1 : 0;
$assessmentVal = $assessment !== null ? intval($assessment) : null;

$stmtRes = $mysqli->prepare('INSERT INTO `result` (`user_id`,`responses`,`time`,`completed`,`comments`,`proposals`,`assessment`) VALUES (?,?,?,?,?,?,?)');
$stmtRes->bind_param('ississi', $userId, $jsonRes, $timeSql, $completedInt, $observer_comments, $proposals, $assessmentVal);
$ok = $stmtRes->execute();
$stmtRes->close();

$mysqli->close();

if ($ok) {
    $body = '<h1>Prueba registrada</h1><p>La prueba se ha guardado correctamente.</p><p>Tiempo empleado: <strong>'.htmlspecialchars($timeSql).'</strong></p><p><a href="/">Volver</a></p>';
    render_response('Prueba guardada', $body, 200);
} else {
    render_response('Error al guardar la prueba', '<h1>Error</h1><p>Error al guardar la prueba: '.htmlspecialchars($mysqli->error).'</p>', 500);
}
