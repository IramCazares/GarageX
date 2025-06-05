<?php
require_once '../../includes/config.php';
require_once '../../includes/db.php';
require_once '../../includes/funciones.php';

header('Content-Type: application/json');

// Iniciar sesión solo si no está activa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Debug: Registrar datos recibidos
error_log("Datos recibidos: " . file_get_contents('php://input'));

// Procesar entrada JSON
$input = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'success' => false,
        'message' => 'JSON inválido'
    ]);
    exit;
}

// Verificar acción
if (empty($input['action'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Acción no especificada'
    ]);
    exit;
}

try {
    switch ($input['action']) {
        case 'login':
            // Validar datos
            if (empty($input['email']) || empty($input['password'])) {
                throw new Exception('Correo y contraseña son obligatorios');
            }
            
            $email = $input['email'];
            $password = $input['password'];
            
            // Buscar usuario
            $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $usuario = $stmt->fetch();
            
            // Verificar credenciales
            if (!$usuario || !password_verify($password, $usuario['password'])) {
                throw new Exception('Credenciales incorrectas');
            }
            
            if (!$usuario['activo']) {
                throw new Exception('Cuenta bloqueada. Contacte al administrador.');
            }
            
            // Configurar sesión
            $_SESSION = [
                'usuario_id' => $usuario['id'],
                'username' => $usuario['username'],
                'autenticado' => true,
                'ip' => $_SERVER['REMOTE_ADDR'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT'],
                'ultimo_acceso' => time()
            ];
            
            // Configurar cookies de sesión (solo si no hay sesión activa)
            if (session_status() === PHP_SESSION_NONE) {
                $cookieParams = session_get_cookie_params();
                session_set_cookie_params([
                    'lifetime' => $cookieParams["lifetime"],
                    'path' => '/',
                    'domain' => $_SERVER['HTTP_HOST'],
                    'secure' => isset($_SERVER['HTTPS']),
                    'httponly' => true,
                    'samesite' => 'Strict'
                ]);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Inicio de sesión exitoso',
                'redirect' => './dashboard.html' // Ajusta esta ruta
            ]);
            break;
        case 'register':
    // Validar datos obligatorios
    if (empty($input['username']) || empty($input['email']) || empty($input['password']) || empty($input['confirm_password'])) {
        throw new Exception('Todos los campos son obligatorios');
    }

    // Obtener y limpiar datos
    $username = trim($input['username']);
    $email = trim(strtolower($input['email'])); // Normalizar email
    $password = $input['password'];
    $confirm_password = $input['confirm_password'];

    // Validaciones
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('El formato del email no es válido');
    }
    if ($password !== $confirm_password) {
        throw new Exception('Las contraseñas no coinciden');
    }
    if (strlen($password) < 8) {
        throw new Exception('La contraseña debe tener al menos 8 caracteres');
    }
    if (!preg_match('/[A-Z]/', $password) || !preg_match('/[0-9]/', $password)) {
        throw new Exception('La contraseña debe contener al menos una mayúscula y un número');
    }

    try {
        // Verificar si el usuario o email ya existen
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->rowCount() > 0) {
            throw new Exception('El nombre de usuario o email ya está registrado');
        }

        // Hash de la contraseña
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        // Insertar nuevo usuario (adaptado a tu estructura exacta)
        $stmt = $pdo->prepare("INSERT INTO usuarios 
                              (username, email, password, activo, intentos_fallidos, created_at) 
                              VALUES (?, ?, ?, 1, 0, NOW())");
        
        $stmt->execute([$username, $email, $hashedPassword]);

        // Obtener ID del nuevo usuario
        $usuario_id = $pdo->lastInsertId();

        // Iniciar sesión automáticamente
        $_SESSION = [
            'usuario_id' => $usuario_id,
            'username' => $username,
            'autenticado' => true,
            'ip' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'],
            'ultimo_acceso' => time()
        ];

        // Respuesta exitosa
        echo json_encode([
            'success' => true,
            'message' => 'Registro exitoso. Bienvenido/a ' . htmlspecialchars($username),
            'redirect' => './dashboard.html'
        ]);

    } catch (PDOException $e) {
        error_log("Error en registro: " . $e->getMessage());
        throw new Exception('Error al crear la cuenta. Por favor intenta nuevamente.');
    }
    break;
        // ... otros casos (register, logout, etc.)
            
        default:
            throw new Exception('Acción no válida');
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>