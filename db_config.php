<?php
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root'); // Usuario por defecto de XAMPP
define('DB_PASSWORD', '');     // Contraseña por defecto de XAMPP (vacía)
define('DB_NAME', 'recetapp');

/* Intentar conectar a la base de datos MySQL */
$mysqli = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Comprobar la conexión
if($mysqli === false){
    // Mostrar errores detallados durante el desarrollo.
    // ¡RECUERDA CAMBIAR ESTO DE NUEVO A UN MENSAJE GENÉRICO EN PRODUCCIÓN!
    die("ERROR: No se pudo conectar. " . $mysqli->connect_error);
}

// Establecer el charset a utf8mb4 para soportar una amplia gama de caracteres
$mysqli->set_charset("utf8mb4");
?>