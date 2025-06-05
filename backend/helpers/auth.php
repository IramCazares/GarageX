<?php
function isAuthenticated() {
    session_start();
    return isset($_SESSION['user_id']);
}

function isAdmin() {
    session_start();
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
}

function checkAuthentication() {
    if (!isAuthenticated()) {
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(array('success' => false, 'message' => 'No autorizado'));
        exit;
    }
}

function checkAdmin() {
    checkAuthentication();
    
    if (!isAdmin()) {
        header('HTTP/1.1 403 Forbidden');
        echo json_encode(array('success' => false, 'message' => 'Acceso denegado'));
        exit;
    }
}
?>