<?php
require_once 'db.php';

function sanitizar($dato) {
    if (is_array($dato)) {
        return array_map('sanitizar', $dato);
    }
    return htmlspecialchars(trim($dato), ENT_QUOTES, 'UTF-8');
}

function verificarAutenticacion() {
    if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== true) {
        header('HTTP/1.1 401 Unauthorized');
        exit(json_encode(['error' => true, 'mensaje' => 'Acceso no autorizado']));
    }
}

function registrarIntentoFallido($username) {
    global $pdo;
    
    try {
        // Actualizar intentos fallidos
        $stmt = $pdo->prepare("UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE username = ?");
        $stmt->execute([$username]);
        
        // Verificar si superó el límite
        $stmt = $pdo->prepare("SELECT intentos_fallidos FROM usuarios WHERE username = ?");
        $stmt->execute([$username]);
        $usuario = $stmt->fetch();
        
        if ($usuario && $usuario['intentos_fallidos'] >= MAX_INTENTOS) {
            $fechaBloqueo = date('Y-m-d H:i:s', strtotime("+" . TIEMPO_BLOQUEO . " minutes"));
            $stmt = $pdo->prepare("UPDATE usuarios SET activo = 0, fecha_bloqueo = ? WHERE username = ?");
            $stmt->execute([$fechaBloqueo, $username]);
            return false;
        }
        return true;
    } catch (PDOException $e) {
        error_log("Error al registrar intento fallido: " . $e->getMessage());
        return false;
    }
}
?>