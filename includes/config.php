<?php
// Configuración básica
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Usuario por defecto
define('DB_PASS', '');     // Contraseña vacía por defecto
define('DB_NAME', 'mantenimiento_autos');

// Configuración de seguridad
define('MAX_INTENTOS', 3);
define('TIEMPO_BLOQUEO', 30); // minutos

session_start();
?>