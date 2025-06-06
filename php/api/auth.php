<?php
require_once '../../includes/config.php';
require_once '../../includes/db.php';
require_once '../../includes/funciones.php';

header('Content-Type: application/json');

// Iniciar sesión si no está activa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Leer y decodificar JSON
$input = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'JSON inválido']);
    exit;
}

// Validar acción
$action = $input['action'] ?? null;
if (!$action) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Acción no especificada']);
    exit;
}

try {
    switch ($action) {
        case 'login':
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';

            if (empty($email) || empty($password)) {
                throw new Exception('Correo y contraseña son obligatorios', 400);
            }

            $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $usuario = $stmt->fetch();

            if(!$usuario) {
                throw new Exception('Usuario no encontrado', 404);
            }

            if (!$usuario || !password_verify($password, $usuario['password'])) {
                throw new Exception('Credenciales incorrectas', 401);
            }

            if (!$usuario['activo']) {
                throw new Exception('Cuenta bloqueada. Contacte al administrador.', 403);
            }

            $_SESSION = [
                'usuario_id' => $usuario['id'],
                'username' => $usuario['username'],
                'autenticado' => true,
                'ip' => $_SERVER['REMOTE_ADDR'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT'],
                'ultimo_acceso' => time()
            ];

            echo json_encode([
                'success' => true,
                'message' => 'Inicio de sesión exitoso',
                'username' => $usuario['username'],
                'rol' => $usuario['rol'],
                'redirect' => './dashboard.html'
            ]);
            break;

        case 'register':
            $username = trim($input['username'] ?? '');
            $email = trim(strtolower($input['email'] ?? ''));
            $password = $input['password'] ?? '';
            $confirm_password = $input['confirm_password'] ?? '';
            $rol = $input['usuario'] ?? 'usuario';

            if (!$username || !$email || !$password || !$confirm_password) {
                throw new Exception('Todos los campos son obligatorios', 400);
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Email inválido', 400);
            }
            if ($password !== $confirm_password) {
                throw new Exception('Las contraseñas no coinciden', 400);
            }
            if (strlen($password) < 8 || 
                !preg_match('/[A-Z]/', $password) || 
                !preg_match('/[0-9]/', $password)) {
                throw new Exception('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número', 400);
            }

            // Verificar duplicados
            $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = ? OR email = ?");
            $stmt->execute([$username, $email]);
            if ($stmt->rowCount() > 0) {
                throw new Exception('El nombre de usuario o email ya está registrado', 409);
            }

            $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

            $stmt = $pdo->prepare("INSERT INTO usuarios (username, email, password, activo, intentos_fallidos, created_at)
                                   VALUES (?, ?, ?, 1, 0, NOW())");
            $stmt->execute([$username, $email, $hashedPassword]);

            $usuario_id = $pdo->lastInsertId();

            $_SESSION = [
                'usuario_id' => $usuario_id,
                'username' => $username,
                'rol' => $rol,
                'autenticado' => true,
                'ip' => $_SERVER['REMOTE_ADDR'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT'],
                'ultimo_acceso' => time()
            ];

            echo json_encode([
                'success' => true,
                'message' => 'Registro exitoso. Bienvenido/a ' . htmlspecialchars($username),
                'redirect' => './dashboard.html'
            ]);
            break;

        default:
            throw new Exception('Acción no válida', 400);
    }
} catch (Exception $e) {
    $code = $e->getCode();
    if ($code < 100 || $code >= 600) {
        $code = 500;
        error_log('Error inesperado: ' . $e->getMessage());
    }
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
