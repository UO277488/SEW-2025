<?php
require_once __DIR__ . '/Cronometro.php';
session_start();

$action = $_REQUEST['action'] ?? null;
$redirect = $_SERVER['HTTP_REFERER'] ?? '/';
$cron = $_SESSION['cronometro'] ?? new Cronometro();

if ($action === 'arrancar') {
    $cron->arrancar();
} elseif ($action === 'parar') {
    $cron->parar();
}

$_SESSION['cronometro'] = $cron;

// Redirigir de vuelta
header('Location: ' . $redirect);
exit;
