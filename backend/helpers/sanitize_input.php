<?php
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

function sanitizeArray($array) {
    foreach ($array as $key => $value) {
        if (is_array($value)) {
            $array[$key] = sanitizeArray($value);
        } else {
            $array[$key] = sanitizeInput($value);
        }
    }
    return $array;
}

// Sanitizar $_GET, $_POST y $_REQUEST
$_GET = sanitizeArray($_GET);
$_POST = sanitizeArray($_POST);
$_REQUEST = sanitizeArray($_REQUEST);
?>