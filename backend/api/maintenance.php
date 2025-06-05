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

// Obtener parámetros
$action = isset($_GET['action']) ? sanitizeInput($_GET['action']) : '';
$carId = isset($_GET['car_id']) ? intval(sanitizeInput($_GET['car_id'])) : null;

// Determinar el método HTTP
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if ($action === 'alerts') {
            handleGetAlerts();
        } else {
            handleGetRequest();
        }
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
    global $conn, $userId, $userRole, $carId, $response;
    
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
    
    // Obtener mantenimientos del auto
    $stmt = $conn->prepare("SELECT * FROM mantenimientos WHERE auto_id = ? ORDER BY fecha DESC");
    $stmt->bind_param("i", $carId);
    $stmt->execute();
    $result = $stmt->get_result();
    $maintenances = $result->fetch_all(MYSQLI_ASSOC);
    
    $response['success'] = true;
    $response['data'] = $maintenances;
    echo json_encode($response);
}

function handleGetAlerts() {
    global $conn, $userId, $userRole, $carId, $response;
    
    if (!$carId) {
        $response['message'] = 'ID de auto es requerido';
        echo json_encode($response);
        return;
    }
    
    // Verificar que el auto exista y pertenezca al usuario (o sea admin)
    $stmt = $conn->prepare("SELECT id, kilometros FROM autos WHERE id = ? AND (usuario_id = ? OR ? = 'admin')");
    $stmt->bind_param("iis", $carId, $userId, $userRole);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Auto no encontrado o no autorizado';
        echo json_encode($response);
        return;
    }
    
    $car = $result->fetch_assoc();
    $currentKilometers = $car['kilometros'];
    
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
        $kmSinceLast = $currentKilometers - $lastKm;
        
        if ($kmSinceLast >= $interval) {
            $priority = ($kmSinceLast >= $interval * 1.5) ? 'high' : 'medium';
            
            $alerts[] = array(
                'service' => $service['nombre'],
                'message' => "Se recomienda {$service['nombre']} (cada {$interval} km)",
                'current_kilometers' => $currentKilometers,
                'last_service_kilometers' => $lastKm,
                'kilometers_overdue' => $kmSinceLast - $interval,
                'estimated_cost' => $service['costo_promedio'],
                'priority' => $priority
            );
        }
    }
    
    if (!empty($alerts)) {
        $response['success'] = true;
        $response['alerts'] = $alerts;
    } else {
        $response['success'] = true;
        $response['message'] = 'No hay alertas de mantenimiento para este auto';
    }
    
    echo json_encode($response);
}

function handlePostRequest() {
    global $conn, $userId, $userRole, $response;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos
    if (empty($data['auto_id']) || empty($data['tipo']) || empty($data['fecha']) || empty($data['kilometros'])) {
        $response['message'] = 'Auto, tipo, fecha y kilómetros son requeridos';
        echo json_encode($response);
        return;
    }
    
    $autoId = intval(sanitizeInput($data['auto_id']));
    $tipo = sanitizeInput($data['tipo']);
    $fecha = sanitizeInput($data['fecha']);
    $kilometros = intval(sanitizeInput($data['kilometros']));
    $costo = isset($data['costo']) ? floatval(sanitizeInput($data['costo'])) : null;
    $comentarios = isset($data['comentarios']) ? sanitizeInput($data['comentarios']) : null;
    
    // Verificar que el auto exista y pertenezca al usuario (o sea admin)
    $stmt = $conn->prepare("SELECT id FROM autos WHERE id = ? AND (usuario_id = ? OR ? = 'admin')");
    $stmt->bind_param("iis", $autoId, $userId, $userRole);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Auto no encontrado o no autorizado';
        echo json_encode($response);
        return;
    }
    
    // Insertar nuevo mantenimiento
    $stmt = $conn->prepare("INSERT INTO mantenimientos (auto_id, tipo, fecha, kilometros, costo, comentarios) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issids", $autoId, $tipo, $fecha, $kilometros, $costo, $comentarios);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Mantenimiento registrado exitosamente';
        $response['maintenance_id'] = $stmt->insert_id;
        
        // Actualizar kilómetros del auto si son mayores
        $stmt = $conn->prepare("UPDATE autos SET kilometros = ? WHERE id = ? AND kilometros < ?");
        $stmt->bind_param("iii", $kilometros, $autoId, $kilometros);
        $stmt->execute();
    } else {
        $response['message'] = 'Error al registrar el mantenimiento: ' . $conn->error;
    }
    
    echo json_encode($response);
}

function handlePutRequest() {
    global $conn, $userId, $userRole, $response;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['id'])) {
        $response['message'] = 'ID de mantenimiento es requerido';
        echo json_encode($response);
        return;
    }
    
    $maintenanceId = intval(sanitizeInput($data['id']));
    
    // Verificar que el mantenimiento exista y pertenezca al usuario (o sea admin)
    $stmt = $conn->prepare("SELECT m.id, a.usuario_id 
                           FROM mantenimientos m 
                           JOIN autos a ON m.auto_id = a.id 
                           WHERE m.id = ? AND (a.usuario_id = ? OR ? = 'admin')");
    $stmt->bind_param("iis", $maintenanceId, $userId, $userRole);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Mantenimiento no encontrado o no autorizado';
        echo json_encode($response);
        return;
    }
    
    // Construir la consulta dinámicamente
    $updates = array();
    $params = array();
    $types = '';
    
    $fields = array('tipo', 'fecha', 'kilometros', 'costo', 'comentarios');
    foreach ($fields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            
            if ($field === 'kilometros') {
                $params[] = intval(sanitizeInput($data[$field]));
                $types .= 'i';
            } elseif ($field === 'costo') {
                $params[] = floatval(sanitizeInput($data[$field]));
                $types .= 'd';
            } else {
                $params[] = sanitizeInput($data[$field]);
                $types .= 's';
            }
        }
    }
    
    if (empty($updates)) {
        $response['message'] = 'No hay datos para actualizar';
        echo json_encode($response);
        return;
    }
    
    // Agregar el ID al final de los parámetros
    $params[] = $maintenanceId;
    $types .= 'i';
    
    $query = "UPDATE mantenimientos SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($query);
    
    // Vincular parámetros dinámicamente
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Mantenimiento actualizado exitosamente';
        
        // Si se actualizaron los kilómetros, actualizar también en el auto si son mayores
        if (isset($data['kilometros'])) {
            $stmt = $conn->prepare("UPDATE autos a 
                                   JOIN mantenimientos m ON a.id = m.auto_id 
                                   SET a.kilometros = ? 
                                   WHERE m.id = ? AND a.kilometros < ?");
            $stmt->bind_param("iii", $data['kilometros'], $maintenanceId, $data['kilometros']);
            $stmt->execute();
        }
    } else {
        $response['message'] = 'Error al actualizar el mantenimiento: ' . $conn->error;
    }
    
    echo json_encode($response);
}

function handleDeleteRequest() {
    global $conn, $userId, $userRole, $response;
    
    $maintenanceId = isset($_GET['id']) ? intval(sanitizeInput($_GET['id'])) : null;
    
    if (!$maintenanceId) {
        $response['message'] = 'ID de mantenimiento es requerido';
        echo json_encode($response);
        return;
    }
    
    // Verificar que el mantenimiento exista y pertenezca al usuario (o sea admin)
    $stmt = $conn->prepare("SELECT m.id, a.usuario_id 
                           FROM mantenimientos m 
                           JOIN autos a ON m.auto_id = a.id 
                           WHERE m.id = ? AND (a.usuario_id = ? OR ? = 'admin')");
    $stmt->bind_param("iis", $maintenanceId, $userId, $userRole);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Mantenimiento no encontrado o no autorizado';
        echo json_encode($response);
        return;
    }
    
    // Eliminar el mantenimiento
    $stmt = $conn->prepare("DELETE FROM mantenimientos WHERE id = ?");
    $stmt->bind_param("i", $maintenanceId);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Mantenimiento eliminado exitosamente';
    } else {
        $response['message'] = 'Error al eliminar el mantenimiento: ' . $conn->error;
    }
    
    echo json_encode($response);
}
?>