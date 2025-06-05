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
    $serviceId = isset($_GET['id']) ? intval(sanitizeInput($_GET['id'])) : null;
    
    if ($serviceId) {
        // Obtener un servicio específico
        $stmt = $conn->prepare("SELECT * FROM servicios_recomendados WHERE id = ?");
        $stmt->bind_param("i", $serviceId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $response['message'] = 'Servicio no encontrado';
            echo json_encode($response);
            return;
        }
        
        $service = $result->fetch_assoc();
        $response['success'] = true;
        $response['data'] = $service;
    } else {
        // Obtener todos los servicios
        $stmt = $conn->prepare("SELECT * FROM servicios_recomendados ORDER BY nombre");
        $stmt->execute();
        $result = $stmt->get_result();
        $services = $result->fetch_all(MYSQLI_ASSOC);
        
        $response['success'] = true;
        $response['data'] = $services;
    }
    
    echo json_encode($response);
}

function handlePostRequest() {
    global $conn, $response;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos
    if (empty($data['nombre']) || empty($data['kilometros_intervalo']) || empty($data['costo_promedio'])) {
        $response['message'] = 'Nombre, intervalo y costo son requeridos';
        echo json_encode($response);
        return;
    }
    
    $nombre = sanitizeInput($data['nombre']);
    $kilometros = intval(sanitizeInput($data['kilometros_intervalo']));
    $costo = floatval(sanitizeInput($data['costo_promedio']));
    $descripcion = isset($data['descripcion']) ? sanitizeInput($data['descripcion']) : null;
    
    // Validar valores numéricos
    if ($kilometros <= 0) {
        $response['message'] = 'El intervalo de kilómetros debe ser mayor a 0';
        echo json_encode($response);
        return;
    }
    
    if ($costo <= 0) {
        $response['message'] = 'El costo promedio debe ser mayor a 0';
        echo json_encode($response);
        return;
    }
    
    // Verificar si el servicio ya existe
    $stmt = $conn->prepare("SELECT id FROM servicios_recomendados WHERE nombre = ?");
    $stmt->bind_param("s", $nombre);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $response['message'] = 'Ya existe un servicio con ese nombre';
        echo json_encode($response);
        return;
    }
    
    // Insertar nuevo servicio
    $stmt = $conn->prepare("INSERT INTO servicios_recomendados (nombre, kilometros_intervalo, costo_promedio, descripcion) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("sids", $nombre, $kilometros, $costo, $descripcion);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Servicio registrado exitosamente';
        $response['service_id'] = $stmt->insert_id;
    } else {
        $response['message'] = 'Error al registrar el servicio: ' . $conn->error;
    }
    
    echo json_encode($response);
}

function handlePutRequest() {
    global $conn, $response;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['id'])) {
        $response['message'] = 'ID de servicio es requerido';
        echo json_encode($response);
        return;
    }
    
    $serviceId = intval(sanitizeInput($data['id']));
    
    // Verificar que el servicio exista
    $stmt = $conn->prepare("SELECT id FROM servicios_recomendados WHERE id = ?");
    $stmt->bind_param("i", $serviceId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Servicio no encontrado';
        echo json_encode($response);
        return;
    }
    
    // Construir la consulta dinámicamente
    $updates = array();
    $params = array();
    $types = '';
    
    $fields = array('nombre', 'kilometros_intervalo', 'costo_promedio', 'descripcion');
    foreach ($fields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            
            if ($field === 'kilometros_intervalo') {
                $params[] = intval(sanitizeInput($data[$field]));
                $types .= 'i';
            } elseif ($field === 'costo_promedio') {
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
    
    // Validar valores numéricos si se están actualizando
    if (isset($data['kilometros_intervalo']) && $data['kilometros_intervalo'] <= 0) {
        $response['message'] = 'El intervalo de kilómetros debe ser mayor a 0';
        echo json_encode($response);
        return;
    }
    
    if (isset($data['costo_promedio']) && $data['costo_promedio'] <= 0) {
        $response['message'] = 'El costo promedio debe ser mayor a 0';
        echo json_encode($response);
        return;
    }
    
    // Agregar el ID al final de los parámetros
    $params[] = $serviceId;
    $types .= 'i';
    
    $query = "UPDATE servicios_recomendados SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($query);
    
    // Vincular parámetros dinámicamente
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Servicio actualizado exitosamente';
    } else {
        $response['message'] = 'Error al actualizar el servicio: ' . $conn->error;
    }
    
    echo json_encode($response);
}

function handleDeleteRequest() {
    global $conn, $response;
    
    $serviceId = isset($_GET['id']) ? intval(sanitizeInput($_GET['id'])) : null;
    
    if (!$serviceId) {
        $response['message'] = 'ID de servicio es requerido';
        echo json_encode($response);
        return;
    }
    
    // Verificar que el servicio exista
    $stmt = $conn->prepare("SELECT id FROM servicios_recomendados WHERE id = ?");
    $stmt->bind_param("i", $serviceId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Servicio no encontrado';
        echo json_encode($response);
        return;
    }
    
    // Eliminar el servicio
    $stmt = $conn->prepare("DELETE FROM servicios_recomendados WHERE id = ?");
    $stmt->bind_param("i", $serviceId);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Servicio eliminado exitosamente';
    } else {
        $response['message'] = 'Error al eliminar el servicio: ' . $conn->error;
    }
    
    echo json_encode($response);
}
?>