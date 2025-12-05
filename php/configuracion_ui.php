<?php
require_once __DIR__ . '/Configuracion.php';

// Configuración de conexión
$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'motogp_db';

$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST'){
    $action = $_POST['action'] ?? null;
    try {
        $cfg = new Configuracion($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
        if ($action === 'reiniciar'){
            $cfg->reiniciarBaseDatos();
            $message = 'La base de datos ha sido reiniciada (tablas truncadas).';
        } elseif ($action === 'eliminar'){
            $ok = $cfg->eliminarBaseDatos();
            $message = $ok ? 'Base de datos eliminada.' : 'Error al eliminar la base de datos.';
        } elseif ($action === 'exportar'){
            $zip = $cfg->exportarCSV();
            if (file_exists($zip)){
                header('Content-Type: application/zip');
                header('Content-disposition: attachment; filename=export_db_' . date('Ymd_His') . '.zip');
                header('Content-Length: ' . filesize($zip));
                readfile($zip);
                unlink($zip);
                exit;
            } else {
                $message = 'No se pudo crear el archivo de exportación.';
            }
        }
        $cfg->close();
    } catch (Exception $e){
        $message = 'Error: ' . $e->getMessage();
    }
}
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Configuración Test - MotoGP</title>
<link rel="stylesheet" href="../estilo/estilo.css">
<link rel="stylesheet" href="../estilo/layout.css">
</head>
<body>
<main style="max-width:900px;margin:1em auto;">
  <h1>Configuración - Pruebas de Usabilidad</h1>
  <?php if ($message): ?>
    <div class="notice"><?=htmlspecialchars($message)?></div>
  <?php endif; ?>

  <form method="post">
    <p>
      <button type="submit" name="action" value="reiniciar">Reiniciar base de datos (vaciar tablas)</button>
    </p>
    <p>
      <button type="submit" name="action" value="eliminar" onclick="return confirm('¿Seguro que deseas eliminar la base de datos completa? Esta acción es irreversible.');">Eliminar base de datos</button>
    </p>
    <p>
      <button type="submit" name="action" value="exportar">Exportar datos (.zip con CSVs)</button>
    </p>
  </form>
  <p style="margin-top:2em;color:#666;font-size:0.9em;">Nota: Esta herramienta no incluye el menú del proyecto. Reutiliza las hojas de estilo del proyecto para la apariencia.</p>
</main>
</body>
</html>
