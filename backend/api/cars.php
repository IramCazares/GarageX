<?php
header('Content-Type: application/json');
require_once '../../config/config.php';
require_once '../../helpers/sanitize_input.php';
require_once '../../helpers/auth.php';

$response = array('success' => false, 'message' => '');

// Verificar autenticación
if (!isAuthenticated()) {
    $response['message'] = 'No autorizado';
    echo json_encode($response);
    exit;
}

$userId = $_SESSION['user_id'];
$userRole = $_SESSION['user_role'];

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
    global $conn, $userId, $userRole, $response;
    
    // Obtener ID si está presente
    $carId = isset($_GET['id']) ? intval(sanitizeInput($_GET['id'])) : null;
    
    if ($carId) {
        // Obtener un auto específico
        $stmt = $conn->prepare("SELECT * FROM autos WHERE id = ? AND (usuario_id = ? OR ? = 'admin')");
        $stmt->bind_param("iis", $carId, $userId, $userRole);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $response['message'] = 'Auto no encontrado o no autorizado';
            echo json_encode($response);
            return;
        }
        
        $car = $result->fetch_assoc();
        $response['success'] = true;
        $response['data'] = $car;
    } else {
        // Obtener todos los autos del usuario (o todos si es admin)
        $query = $userRole === 'admin' 
            ? "SELECT a.*, u.nombre as usuario_nombre FROM autos a JOIN usuarios u ON a.usuario_id = u.id"
            : "SELECT * FROM autos WHERE usuario_id = ?";
        
        $stmt = $conn->prepare($query);
        
        if ($userRole !== 'admin') {
            $stmt->bind_param("i", $userId);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $cars = $result->fetch_all(MYSQLI_ASSOC);
        
        $response['success'] = true;
        $response['data'] = $cars;
    }
    
    echo json_encode($response);
}

function handlePostRequest() {
    global $conn, $userId, $response;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos
    if (empty($data['marca']) || empty($data['modelo']) || empty($data['año'])) {
        $response['message'] = 'Marca, modelo y año son requeridos';
        echo json_encode($response);
        return;
    }
    
    $marca = sanitizeInput($data['marca']);
    $modelo = sanitizeInput($data['modelo']);
    $año = intval(sanitizeInput($data['año']));
    $kilometros = isset($data['kilometros']) ? intval(sanitizeInput($data['kilometros'])) : 0;
    
    // Insertar nuevo auto
    $stmt = $conn->prepare("INSERT INTO autos (usuario_id, marca, modelo, año, kilometros) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("issii", $userId, $marca, $modelo, $año, $kilometros);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Auto registrado exitosamente';
        $response['car_id'] = $stmt->insert_id;
        
        // Verificar mantenimientos recomendados
        checkRecommendedMaintenance($stmt->insert_id, $kilometros);
    } else {
        $response['message'] = 'Error al registrar el auto: ' . $conn->error;
    }
    
    echo json_encode($response);
}

function handlePutRequest() {
    global $conn, $userId, $userRole, $response;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['id'])) {
        $response['message'] = 'ID de auto es requerido';
        echo json_encode($response);
        return;
    }
    
    $carId = intval(sanitizeInput($data['id']));
    
    // Verificar que el auto exista y pertenezca al usuario (o sea admin)
    $stmt = $conn->prepare("SELECT id FROM autos WHERE id = ? AND (usuario_id = ? OR ? = 'admin')");
    $stmt->bind_param("iis", $carId, $userId, $userRole);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Auto no encontrado o no autorizado';
        echo json_encode($response);
        return;
    }
    
    // Construir la consulta dinámicamente
    $updates = array();
    $params = array();
    $types = '';
    
    $fields = array('marca', 'modelo', 'año', 'kilometros');
    foreach ($fields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            $params[] = sanitizeInput($data[$field]);
            $types .= $field === 'año' || $field === 'kilometros' ? 'i' : 's';
        }
    }
    
    if (empty($updates)) {
        $response['message'] = 'No hay datos para actualizar';
        echo json_encode($response);
        return;
    }
    
    // Agregar el ID al final de los parámetros
    $params[] = $carId;
    $types .= 'i';
    
    $query = "UPDATE autos SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($query);
    
    // Vincular parámetros dinámicamente
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Auto actualizado exitosamente';
        
        // Si se actualizaron los kilómetros, verificar mantenimientos
        if (isset($data['kilometros'])) {
            checkRecommendedMaintenance($carId, intval($data['kilometros']));
        }
    } else {
        $response['message'] = 'Error al actualizar el auto: ' . $conn->error;
    }
    
    echo json_encode($response);
}

function handleDeleteRequest() {
    global $conn, $userId, $userRole, $response;
    
    $carId = isset($_GET['id']) ? intval(sanitizeInput($_GET['id'])) : null;
    
    if (!$carId) {
        $response['message'] = 'ID de auto es requerido';
        echo json_encode($response);
        return;
    }
    
    // Verificar que el auto exista y pertenezca al usuario (o sea admin)
    $stmt = $conn->prepare("SELECT id FROM autos WHERE id = ? AND (usuario_id = ? OR ? = 'admin')");
    $stmt->bind_param("iis", $carId, $userId, $userRole);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Auto no encontrado o no autorizado';
        echo json_encode($response);
        return;
    }
    
    // Eliminar el auto (las claves foráneas con ON DELETE CASCADE eliminarán los mantenimientos relacionados)
    $stmt = $conn->prepare("DELETE FROM autos WHERE id = ?");
    $stmt->bind_param("i", $carId);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Auto eliminado exitosamente';
    } else {
        $response['message'] = 'Error al eliminar el auto: ' . $conn->error;
    }
    
    echo json_encode($response);
}

function checkRecommendedMaintenance($carId, $kilometros) {
    global $conn, $response;
    
    // Obtener servicios recomendados
    $stmt = $conn->prepare("SELECT * FROM servicios_recomendados");
    $stmt->execute();
    $services = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Obtener último mantenimiento de cada tipo para este auto
    $lastMaintenance = array();
    $stmt = $conn->prepare("SELECT tipo, MAX(kilometros) as last_km FROM mantenimientos WHERE auto_id = ? GROUP BY tipo");
    $stmt->bind_param("i", $carId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $lastMaintenance[$row['tipo']] = $row['last_km'];
    }
    
    // Verificar cada servicio recomendado
    $alerts = array();
    foreach ($services as $service) {
        $tipo = str_replace(' ', '_', strtolower($service['nombre']));
        $lastKm = isset($lastMaintenance[$tipo]) ? $lastMaintenance[$tipo] : 0;
        $interval = $service['kilometros_intervalo'];
        
        if ($kilometros - $lastKm >= $interval) {
            $alerts[] = array(
                'service' => $service['nombre'],
                'current_km' => $kilometros,
                'last_service_km' => $lastKm,
                'interval' => $interval,
                'recommended_action' => "Se recomienda {$service['nombre']} (cada {$interval} km)",
                'estimated_cost' => $service['costo_promedio']
            );
        }
    }
    
    if (!empty($alerts)) {
        $response['alerts'] = $alerts;
    }
}
?>