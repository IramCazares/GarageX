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
$carId = isset($_GET['car_id']) ? intval(sanitizeInput($_GET['car_id'])) : null;

// Validar que el carId pertenezca al usuario (a menos que sea admin)
if ($carId && $userRole !== 'admin') {
    $stmt = $conn->prepare("SELECT id FROM autos WHERE id = ? AND usuario_id = ?");
    $stmt->bind_param("ii", $carId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $response['message'] = 'Auto no encontrado o no autorizado';
        echo json_encode($response);
        exit;
    }
}

// Obtener servicios recomendados
$stmt = $conn->prepare("SELECT * FROM servicios_recomendados");
$stmt->execute();
$services = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// Obtener autos del usuario (o todos si es admin)
$query = $userRole === 'admin' 
    ? "SELECT a.*, u.nombre as usuario_nombre FROM autos a JOIN usuarios u ON a.usuario_id = u.id"
    : "SELECT * FROM autos WHERE usuario_id = ?";
    
$stmt = $conn->prepare($query);
if ($userRole !== 'admin') {
    $stmt->bind_param("i", $userId);
}
$stmt->execute();
$cars = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// Procesar alertas para cada auto
$alerts = array();

foreach ($cars as $car) {
    // Si se especificó un carId y no coincide, saltar
    if ($carId && $car['id'] != $carId) continue;
    
    // Obtener último mantenimiento de cada tipo para este auto
    $lastMaintenance = array();
    $stmt = $conn->prepare("SELECT tipo, MAX(kilometros) as last_km FROM mantenimientos WHERE auto_id = ? GROUP BY tipo");
    $stmt->bind_param("i", $car['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $lastMaintenance[$row['tipo']] = $row['last_km'];
    }
    
    // Verificar cada servicio recomendado
    foreach ($services as $service) {
        $tipo = str_replace(' ', '_', strtolower($service['nombre']));
        $lastKm = isset($lastMaintenance[$tipo]) ? $lastMaintenance[$tipo] : 0;
        $currentKm = $car['kilometros'];
        $interval = $service['kilometros_intervalo'];
        $kmSinceLast = $currentKm - $lastKm;
        
        if ($kmSinceLast >= $interval) {
            $priority = ($kmSinceLast >= $interval * 1.5) ? 'high' : 'medium';
            
            $alerts[] = array(
                'car_id' => $car['id'],
                'car_info' => "{$car['marca']} {$car['modelo']} ({$car['año']})",
                'user_name' => $car['usuario_nombre'] ?? '',
                'service_id' => $service['id'],
                'service_name' => $service['nombre'],
                'interval' => $interval,
                'last_service_km' => $lastKm,
                'current_km' => $currentKm,
                'km_overdue' => $kmSinceLast - $interval,
                'estimated_cost' => $service['costo_promedio'],
                'priority' => $priority,
                'message' => "Se recomienda {$service['nombre']} (cada {$interval} km)",
                'recommended_action' => "Realizar {$service['nombre']} lo antes posible"
            );
        }
    }
}

$response['success'] = true;
$response['alerts'] = $alerts;
echo json_encode($response);
?>