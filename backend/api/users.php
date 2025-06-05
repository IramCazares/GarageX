<?php
header('Content-Type: application/json');
require_once '../../config/config.php';
require_once '../../helpers/sanitize_input.php';
require_once '../../helpers/auth.php';

$response = array('success' => false, 'message' => '');

// Verificar autenticación y que sea admin
checkAdmin();

$conn = getDBConnection();

// Determinar el método HTTP
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetRequest();
        break;
    case 'POST':
        handlePostRequest();
        break;
    case 'PUT':
        handlePutRequest();
        break;
    case 'DELETE':
        handleDeleteRequest();
        break;
    default:
        $response['message'] = 'Método no permitido';
        echo json_encode($response);
        break;
}

function handleGetRequest() {
    global $conn, $response;
    
    // Obtener ID si está presente
    $userId = isset($_GET['id']) ? intval(sanitizeInput($_GET['id'])) : null;
    
    if ($userId) {
        // Obtener un usuario específico
        $stmt = $conn->prepare("SELECT id, nombre, email, rol, fecha_registro FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $response['message'] = 'Usuario no encontrado';
            echo json_encode($response);
            return;
        }
        
        $user = $result->fetch_assoc();
        $response['success'] = true;
        $response['data'] = $user;
    } else {
        // Obtener todos los usuarios (sin contraseñas)
        $stmt = $conn->prepare("SELECT id, nombre, email, rol, fecha_registro FROM usuarios ORDER BY fecha_registro DESC");
        $stmt->execute();
        $result = $stmt->get_result();
        $users = $result->fetch_all(MYSQLI_ASSOC);
        
        $response['success'] = true;
        $response['data'] = $users;
    }
    
    echo json_encode($response);
}

function handlePostRequest() {
    global $conn, $response;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos
    if (empty($data['nombre']) || empty($data['email']) || empty($data['password']) || empty($data['rol'])) {
        $response['message'] = 'Nombre, email, contraseña y rol son requeridos';
        echo json_encode($response);
        return;
    }
    
    $nombre = sanitizeInput($data['nombre']);
    $email = sanitizeInput($data['email']);
    $password = sanitizeInput($data['password']);
    $rol = sanitizeInput($data['rol']);
    
    // Validar email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Correo electrónico no válido';
        echo json_encode($response);
        return;
    }
    
    // Validar rol
    if (!in_array($rol, ['admin', 'user'])) {
        $response['message'] = 'Rol no válido';
        echo json_encode($response);
        return;
    }
    
    // Verificar si el email ya existe
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $response['message'] = 'El correo electrónico ya está registrado';
        echo json_encode($response);
        return;
    }
    
    // Hash de la contraseña
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insertar nuevo usuario
    $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $nombre, $email, $hashedPassword, $rol);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Usuario registrado exitosamente';
        $response['user_id'] = $stmt->insert_id;
    } else {
        $response['message'] = 'Error al registrar el usuario: ' . $conn->error;
    }
    
    echo json_encode($response);
}

function handlePutRequest() {
    global $conn, $response;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['id'])) {
        $response['message'] = 'ID de usuario es requerido';
        echo json_encode($response);
        return;
    }
    
    $userId = intval(sanitizeInput($data['id']));
    
    // Verificar que el usuario exista
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Usuario no encontrado';
        echo json_encode($response);
        return;
    }
    
    // Construir la consulta dinámicamente
    $updates = array();
    $params = array();
    $types = '';
    
    $fields = array('nombre', 'email', 'rol');
    foreach ($fields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            $params[] = sanitizeInput($data[$field]);
            $types .= 's';
        }
    }
    
    // Manejar actualización de contraseña si se proporciona
    if (isset($data['password']) && !empty($data['password'])) {
        $updates[] = "password = ?";
        $params[] = password_hash(sanitizeInput($data['password']), PASSWORD_DEFAULT);
        $types .= 's';
    }
    
    if (empty($updates)) {
        $response['message'] = 'No hay datos para actualizar';
        echo json_encode($response);
        return;
    }
    
    // Agregar el ID al final de los parámetros
    $params[] = $userId;
    $types .= 'i';
    
    $query = "UPDATE usuarios SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($query);
    
    // Vincular parámetros dinámicamente
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Usuario actualizado exitosamente';
    } else {
        $response['message'] = 'Error al actualizar el usuario: ' . $conn->error;
    }
    
    echo json_encode($response);
}

function handleDeleteRequest() {
    global $conn, $response;
    
    $userId = isset($_GET['id']) ? intval(sanitizeInput($_GET['id'])) : null;
    
    if (!$userId) {
        $response['message'] = 'ID de usuario es requerido';
        echo json_encode($response);
        return;
    }
    
    // Verificar que el usuario exista y no sea el último admin
    $stmt = $conn->prepare("SELECT COUNT(*) as admin_count FROM usuarios WHERE rol = 'admin'");
    $stmt->execute();
    $result = $stmt->get_result();
    $adminCount = $result->fetch_assoc()['admin_count'];
    
    $stmt = $conn->prepare("SELECT rol FROM usuarios WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $userRole = $result->fetch_assoc()['rol'];
    
    if ($userRole === 'admin' && $adminCount <= 1) {
        $response['message'] = 'No se puede eliminar el último administrador';
        echo json_encode($response);
        return;
    }
    
    // Eliminar el usuario (las claves foráneas con ON DELETE CASCADE eliminarán los autos y mantenimientos relacionados)
    $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
    $stmt->bind_param("i", $userId);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Usuario eliminado exitosamente';
    } else {
        $response['message'] = 'Error al eliminar el usuario: ' . $conn->error;
    }
    
    echo json_encode($response);
}
?>