<?php
header('Content-Type: application/json');
require_once '../../config/config.php';
require_once '../../helpers/sanitize_input.php';

$response = array('success' => false, 'message' => '');

// Permitir solo métodos POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Método no permitido';
    echo json_encode($response);
    exit;
}

$action = isset($_GET['action']) ? sanitizeInput($_GET['action']) : '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'register':
        handleRegister();
        break;
    default:
        $response['message'] = 'Acción no válida';
        echo json_encode($response);
        break;
}

function handleLogin() {
    global $response;
    
    $email = isset($_POST['email']) ? sanitizeInput($_POST['email']) : '';
    $password = isset($_POST['password']) ? sanitizeInput($_POST['password']) : '';
    
    // Validaciones básicas
    if (empty($email) || empty($password)) {
        $response['message'] = 'Todos los campos son requeridos';
        echo json_encode($response);
        return;
    }
    
    $conn = getDBConnection();
    
    // Buscar usuario por email
    $stmt = $conn->prepare("SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Usuario no encontrado';
        echo json_encode($response);
        return;
    }
    
    $user = $result->fetch_assoc();
    
    // Verificar contraseña
    if (!password_verify($password, $user['password'])) {
        $response['message'] = 'Contraseña incorrecta';
        echo json_encode($response);
        return;
    }
    
    // Iniciar sesión
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['nombre'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['rol'];
    
    $response['success'] = true;
    $response['message'] = 'Inicio de sesión exitoso';
    $response['redirect'] = $user['rol'] === 'admin' ? '../admin/dashboard.html' : '../user/dashboard.html';
    
    echo json_encode($response);
}

function handleRegister() {
    global $response;
    
    $name = isset($_POST['name']) ? sanitizeInput($_POST['name']) : '';
    $email = isset($_POST['email']) ? sanitizeInput($_POST['email']) : '';
    $password = isset($_POST['password']) ? sanitizeInput($_POST['password']) : '';
    $confirmPassword = isset($_POST['confirmPassword']) ? sanitizeInput($_POST['confirmPassword']) : '';
    
    // Validaciones
    if (empty($name) || empty($email) || empty($password) || empty($confirmPassword)) {
        $response['message'] = 'Todos los campos son requeridos';
        echo json_encode($response);
        return;
    }
    
    if (strlen($name) < 3) {
        $response['message'] = 'El nombre debe tener al menos 3 caracteres';
        echo json_encode($response);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Correo electrónico no válido';
        echo json_encode($response);
        return;
    }
    
    if (strlen($password) < 6) {
        $response['message'] = 'La contraseña debe tener al menos 6 caracteres';
        echo json_encode($response);
        return;
    }
    
    if ($password !== $confirmPassword) {
        $response['message'] = 'Las contraseñas no coinciden';
        echo json_encode($response);
        return;
    }
    
    $conn = getDBConnection();
    
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
    $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $email, $hashedPassword);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Registro exitoso. Redirigiendo...';
        $response['redirect'] = 'login.html';
    } else {
        $response['message'] = 'Error al registrar el usuario: ' . $conn->error;
    }
    
    echo json_encode($response);
}
?>