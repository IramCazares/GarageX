<?php
require_once 'config.php';
require_once 'funciones.php';

session_start();

// Verificar si la sesión es válida
function verificarAutenticacion() {
    if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== true) {
        return false;
    }

    // Verificar consistencia de la sesión
    if ($_SESSION['ip'] !== $_SERVER['REMOTE_ADDR'] || 
        $_SESSION['user_agent'] !== $_SERVER['HTTP_USER_AGENT']) {
        session_destroy();
        return false;
    }

    // Verificar tiempo de inactividad (30 minutos)
    $inactividad = 1800;
    if (isset($_SESSION['ultimo_acceso']) && 
        (time() - $_SESSION['ultimo_acceso'] > $inactividad)) {
        session_destroy();
        return false;
    }

    // Actualizar tiempo de último acceso
    $_SESSION['ultimo_acceso'] = time();
    
    return true;
}

// Función para obtener datos del usuario autenticado
function obtenerUsuarioAutenticado() {
    if (verificarAutenticacion()) {
        return [
            'id' => $_SESSION['usuario_id'],
            'username' => $_SESSION['username']
        ];
    }
    return null;
}
?>