<?php
header('Content-Type: application/json');
require_once '../../config/config.php';
require_once '../../helpers/sanitize_input.php';
require_once '../../helpers/auth.php';

$response = array('success' => false, 'message' => '');

// Verificar autenticación y que sea admin
checkAdmin();

$conn = getDBConnection();

// Obtener parámetros
$reportType = isset($_GET['type']) ? sanitizeInput($_GET['type']) : '';
$startDate = isset($_GET['start_date']) ? sanitizeInput($_GET['start_date']) : null;
$endDate = isset($_GET['end_date']) ? sanitizeInput($_GET['end_date']) : null;

// Validar fechas
if ($startDate && !DateTime::createFromFormat('Y-m-d', $startDate)) {
    $response['message'] = 'Fecha de inicio no válida';
    echo json_encode($response);
    exit;
}

if ($endDate && !DateTime::createFromFormat('Y-m-d', $endDate)) {
    $response['message'] = 'Fecha de fin no válida';
    echo json_encode($response);
    exit;
}

switch ($reportType) {
    case 'users':
        generateUsersReport($startDate, $endDate);
        break;
    case 'maintenance':
        generateMaintenanceReport($startDate, $endDate);
        break;
    case 'services':
        generateServicesReport($startDate, $endDate);
        break;
    default:
        $response['message'] = 'Tipo de reporte no válido';
        echo json_encode($response);
        break;
}

function generateUsersReport($startDate, $endDate) {
    global $conn, $response;
    
    $query = "SELECT id, nombre, email, rol, fecha_registro FROM usuarios";
    $conditions = array();
    $params = array();
    $types = '';
    
    if ($startDate) {
        $conditions[] = "fecha_registro >= ?";
        $params[] = $startDate;
        $types .= 's';
    }
    
    if ($endDate) {
        $conditions[] = "fecha_registro <= ?";
        $params[] = $endDate . ' 23:59:59';
        $types .= 's';
    }
    
    if (!empty($conditions)) {
        $query .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $query .= " ORDER BY fecha_registro DESC";
    
    $stmt = $conn->prepare($query);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $users = $result->fetch_all(MYSQLI_ASSOC);
    
    // Estadísticas
    $totalUsers = count($users);
    $admins = array_filter($users, function($user) {
        return $user['rol'] === 'admin';
    });
    $regularUsers = array_filter($users, function($user) {
        return $user['rol'] === 'user';
    });
    
    $response['success'] = true;
    $response['data'] = array(
        'users' => $users,
        'stats' => array(
            'total' => $totalUsers,
            'admins' => count($admins),
            'regular_users' => count($regularUsers),
            'start_date' => $startDate,
            'end_date' => $endDate
        )
    );
    
    echo json_encode($response);
}

function generateMaintenanceReport($startDate, $endDate) {
    global $conn, $response;
    
    $query = "SELECT m.id, m.tipo, m.fecha, m.kilometros, m.costo, m.comentarios, 
                     a.marca, a.modelo, a.año, u.nombre as usuario_nombre
              FROM mantenimientos m
              JOIN autos a ON m.auto_id = a.id
              JOIN usuarios u ON a.usuario_id = u.id";
    
    $conditions = array();
    $params = array();
    $types = '';
    
    if ($startDate) {
        $conditions[] = "m.fecha >= ?";
        $params[] = $startDate;
        $types .= 's';
    }
    
    if ($endDate) {
        $conditions[] = "m.fecha <= ?";
        $params[] = $endDate;
        $types .= 's';
    }
    
    if (!empty($conditions)) {
        $query .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $query .= " ORDER BY m.fecha DESC";
    
    $stmt = $conn->prepare($query);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $maintenances = $result->fetch_all(MYSQLI_ASSOC);
    
    // Estadísticas
    $totalMaintenances = count($maintenances);
    $totalCost = array_reduce($maintenances, function($carry, $item) {
        return $carry + ($item['costo'] ?: 0);
    }, 0);
    
    $typesCount = array();
    foreach ($maintenances as $m) {
        $type = $m['tipo'];
        if (!isset($typesCount[$type])) {
            $typesCount[$type] = 0;
        }
        $typesCount[$type]++;
    }
    
    $response['success'] = true;
    $response['data'] = array(
        'maintenances' => $maintenances,
        'stats' => array(
            'total' => $totalMaintenances,
            'total_cost' => $totalCost,
            'types_count' => $typesCount,
            'start_date' => $startDate,
            'end_date' => $endDate
        )
    );
    
    echo json_encode($response);
}

function generateServicesReport($startDate, $endDate) {
    global $conn, $response;
    
    $query = "SELECT s.nombre, s.kilometros_intervalo, s.costo_promedio,
                     COUNT(m.id) as total_services,
                     SUM(m.costo) as total_cost,
                     AVG(m.costo) as avg_cost
              FROM servicios_recomendados s
              LEFT JOIN mantenimientos m ON s.nombre = REPLACE(m.tipo, '_', ' ') AND 
                                           (m.fecha BETWEEN ? AND ? OR (m.fecha IS NULL AND (? IS NULL OR ? IS NULL)))
              GROUP BY s.id";
    
    $stmt = $conn->prepare($query);
    
    if ($startDate && $endDate) {
        $stmt->bind_param("ssss", $startDate, $endDate, $startDate, $endDate);
    } else {
        // Si no hay fechas, traer todos los mantenimientos
        $stmt->bind_param("ssss", $startDate, $endDate, $startDate, $endDate);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $services = $result->fetch_all(MYSQLI_ASSOC);
    
    // Estadísticas
    $totalServices = array_reduce($services, function($carry, $item) {
        return $carry + $item['total_services'];
    }, 0);
    
    $totalCost = array_reduce($services, function($carry, $item) {
        return $carry + ($item['total_cost'] ?: 0);
    }, 0);
    
    $response['success'] = true;
    $response['data'] = array(
        'services' => $services,
        'stats' => array(
            'total_services' => $totalServices,
            'total_cost' => $totalCost,
            'start_date' => $startDate,
            'end_date' => $endDate
        )
    );
    
    echo json_encode($response);
}
?>