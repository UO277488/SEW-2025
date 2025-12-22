<?php
// Formulario de prueba de usabilidad
// Reutiliza estilos, no incluye menú del proyecto
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Test de Usabilidad - MotoGP</title>
<link rel="stylesheet" href="../estilo/estilo.css">
<link rel="stylesheet" href="../estilo/layout.css">
</head>
<body>
<?php
require_once __DIR__ . '/Cronometro.php';
session_start();
$cron = $_SESSION['cronometro'] ?? null;
if ($cron && !($cron instanceof Cronometro)) {
    // La sesión contenía un objeto incompleto (la clase no estaba cargada antes de unserialize)
    // Limpia la sesión para evitar errores y forzamos reinicio si procede
    $cron = null;
    unset($_SESSION['cronometro']);
}
$running = ($cron && $cron->isRunning());
?>
<main style="max-width:900px;margin:1em auto;">
  <h1>Prueba de Usabilidad</h1>
  <p>Pulse <strong>Iniciar prueba</strong> para comenzar. El cronómetro se ejecutará en segundo plano en el servidor y el tiempo no será mostrado al usuario.</p>

  <?php if (!$running): ?>
    <form method="post" action="cronometro_action.php">
      <input type="hidden" name="action" value="arrancar">
      <button type="submit">Iniciar prueba</button>
    </form>
  <?php endif; ?>

  <form method="post" action="process_test.php" style="margin-top:1em; <?php echo $running ? '' : 'display:none;'; ?>">
    <fieldset>
      <legend>Datos del usuario</legend>
      <p><label>¿Cuál es tu profesión? <input type="text" name="profession" required></label></p>
      <p><label>¿Cuál es tu edad? <input type="number" name="age" min="0" max="120" required></label></p>
      <p><label>¿Cuál es tu género? 
        <select name="gender" required> 
          <option value="">--Selecciona--</option>
          <option value="male">Masculino</option>
          <option value="female">Femenino</option>
          <option value="non-binary">No binario</option>
          <option value="other">Otra</option>
        </select>
      </label></p>
      <p><label>¿Cuál es tu nivel de pericia informática? 
        <select name="computer_expertise" required> 
          <option value="">--Selecciona--</option>
          <option value="low">Bajo</option>
          <option value="mid">Medio</option>
          <option value="high">Alto</option>
          <option value="expert">Experto</option>
        </select>
      </label></p>
      <p>
        <label>¿Qué dispositivo utilizaste para realizar la prueba?<br>
        <select name="device" required>
          <option value="">--Selecciona--</option>
          <option value="desktop">Ordenador de sobremesa</option>
          <option value="laptop">Portátil</option>
          <option value="tablet">Tablet</option>
          <option value="mobile">Móvil</option>
          <option value="other">Otro</option>
        </select>
        </label>
      </p>
    </fieldset>

    <fieldset>
      <legend>Información de la carrera</legend>
      <p><label>¿Quién es el piloto de la carrera? <input type="text" name="pilot_name" style="width:100%"></label></p>
      <p><label>¿Qué carrera es? <input type="text" name="race_name" style="width:100%"></label></p>
      <p><label>¿Dónde es? (país y ciudad más cercana) <input type="text" name="race_location" style="width:100%"></label></p>
      <p><label>¿Qué tiempo hizo el día de la carrera? <input type="text" name="race_weather" style="width:100%"></label></p>
      <p><label>¿Qué hora/señal del tiempo tuvo la carrera? <input type="text" name="race_time"></label></p>
      <p><label>¿Hay desnivel en la carrera?
        <select name="circuit_desnivel">
          <option value="">--Selecciona--</option>
          <option value="1">Sí</option>
          <option value="0">No</option>
        </select>
      </label></p>
      <p><label>¿La carrera tiene curvas pronunciadas?
        <select name="curvas_pronunciadas">
          <option value="">--Selecciona--</option>
          <option value="1">Sí</option>
          <option value="0">No</option>
        </select>
      </label></p>
      <p><label>¿El circuito es urbano?
        <select name="circuito_urbano">
          <option value="">--Selecciona--</option>
          <option value="1">Sí</option>
          <option value="0">No</option>
        </select>
      </label></p>
      <p><label>¿El circuito tiene largas rectas?
        <select name="largas_rectas">
          <option value="">--Selecciona--</option>
          <option value="1">Sí</option>
          <option value="0">No</option>
        </select>
      </label></p>
      <p><label>¿Quien es el patrocinador principal de la carrera?
        <select name="patrocinador">
          <option value="">--Selecciona--</option>
          <option value="3">Ducati</option>
          <option value="2">Red Bull</option>
          <option value="1">Lenovo</option>
          <option value="0">Yamaha</option>
        </select>
      </label></p>
      <p><label>¿Qué mejorarías del circuito? <input type="text" name="circuit_improvements" style="width:100%"></label></p>
    </fieldset>
    <p>
      <label>¿Qué mejoras propondrías para la aplicación?<br>
      <input type="text" name="proposals" style="width:100%">
      </label>
    </p>
    <fieldset>
      <legend>Resultado</legend>
      <p>¿Lograste completar la tarea propuesta? 
        <label><input type="radio" name="completed" value="1" required> Sí</label>
        <label><input type="radio" name="completed" value="0"> No</label>
      </p>
      <p><label>¿Cómo valorarías la aplicación en general? (0–10)
        <input type="number" name="assessment" min="0" max="10" required>
      </label></p>
    </fieldset>
    <p>
      <button type="submit">Terminar prueba</button>
    </p>
  </form>

<script>
// Pequeño comportamiento: enfocar primer campo si el formulario está visible
document.addEventListener('DOMContentLoaded', function(){
  const form = document.querySelector('form[action="process_test.php"]');
  if (form && getComputedStyle(form).display !== 'none') {
    const first = form.querySelector('input, select, textarea');
    if (first) first.focus();
  }
});
</script>
</main>
</body>
</html>
