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
<main style="max-width:900px;margin:1em auto;">
  <h1>Prueba de Usabilidad</h1>
  <p>Pulse <strong>Iniciar prueba</strong> para comenzar. El cronómetro se ejecutará en segundo plano y el tiempo no será mostrado al usuario.</p>

  <button id="startBtn">Iniciar prueba</button>
  <form id="testForm" method="post" action="process_test.php" style="display:none;margin-top:1em;">
    <input type="hidden" name="time_taken" id="time_taken" value="0">
    <fieldset>
      <legend>Datos del usuario</legend>
      <p><label>¿Cuál es tu profesión? <input type="text" name="profession" id="profession" required></label></p>
      <p><label>¿Cuál es tu edad? <input type="number" name="age" id="age" min="0" max="120" required></label></p>
      <p><label>¿Cuál es tu género? 
        <select name="gender" id="gender" required>
          <option value="">--Selecciona--</option>
          <option value="male">Masculino</option>
          <option value="female">Femenino</option>
          <option value="non-binary">No binario</option>
          <option value="other">Otra</option>
        </select>
      </label></p>
      <p><label>¿Cuál es tu nivel de pericia informática? 
        <select name="computer_expertise" id="computer_expertise" required>
          <option value="">--Selecciona--</option>
          <option value="low">Bajo</option>
          <option value="mid">Medio</option>
          <option value="high">Alto</option>
          <option value="expert">Experto</option>
        </select>
      </label></p>
    </fieldset>
    <fieldset>
      <legend>Preguntas</legend>
      <p>
        <label for="device">¿Qué dispositivo utilizaste para realizar la prueba?</label><br>
        <select name="device" id="device" required>
          <option value="">--Selecciona--</option>
          <option value="desktop">Ordenador de sobremesa</option>
          <option value="laptop">Portátil</option>
          <option value="tablet">Tablet</option>
          <option value="mobile">Móvil</option>
          <option value="other">Otro</option>
        </select>
      </p>
      <p>
        <label>¿Volverías a usar esta aplicación?</label><br>
        <label><input type="radio" name="would_use" value="1" required> Sí</label>
        <label><input type="radio" name="would_use" value="0"> No</label>
      </p>
    </fieldset>
    <p>
      <label for="observer_comments">¿Qué problemas encontraste al usar la aplicación?</label><br>
      <textarea name="observer_comments" id="observer_comments" rows="4" style="width:100%"></textarea>
    </p>
    <p>
      <label for="proposals">¿Qué mejoras propondrías para la aplicación?</label><br>
      <input type="text" name="proposals" id="proposals" style="width:100%">
    </p>
    <fieldset>
      <legend>Resultado</legend>
      <p>¿Lograste completar la tarea propuesta? 
        <label><input type="radio" name="completed" value="1" required> Sí</label>
        <label><input type="radio" name="completed" value="0"> No</label>
      </p>
      <p><label for="assessment">¿Cómo valorarías la aplicación en general? (0–10)
        <input type="number" id="assessment" name="assessment" min="0" max="10" required>
      </label></p>
    </fieldset>
    <p>
      <button type="submit">Terminar prueba</button>
    </p>
  </form>

<script>
(function(){
  let startTime = null;
  const startBtn = document.getElementById('startBtn');
  const form = document.getElementById('testForm');
  const timeField = document.getElementById('time_taken');

  startBtn.addEventListener('click', function(){
    startTime = Date.now();
    startBtn.disabled = true;
    form.style.display = '';
    // focus first input
    const first = document.getElementById('q1');
    if (first) first.focus();
  });

  form.addEventListener('submit', function(e){
    // calcular tiempo y poner en hidden
    if (!startTime) {
      alert('La prueba no se ha iniciado. Pulse Iniciar prueba.');
      e.preventDefault();
      return;
    }
    const elapsedMs = Date.now() - startTime;
    const elapsedSec = Math.round(elapsedMs / 1000);
    timeField.value = elapsedSec;
    // permitir envío
  });
})();
</script>
</main>
</body>
</html>
