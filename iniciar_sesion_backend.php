<?php
header('Content-Type: application/json');
require_once 'db_config.php'; // Asegúrate que este archivo existe y está configurado

session_start(); // Iniciar o reanudar la sesión

$response = ['status' => 'error', 'message' => 'Ocurrió un error desconocido.'];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $correo = trim($_POST['email'] ?? '');
    $contrasena_ingresada = $_POST['password'] ?? '';

    if (empty($correo) || empty($contrasena_ingresada)) {
        $response['message'] = 'Correo electrónico y contraseña son obligatorios.';
    } elseif (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Formato de correo electrónico inválido.';
    } else {
        $sql = "SELECT id_usuario, nombre_usuario, Contrasena FROM USUARIO WHERE Correo = ?";
        if ($stmt = $mysqli->prepare($sql)) {
            $stmt->bind_param("s", $correo);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows == 1) {
                $stmt->bind_result($id_usuario, $nombre_usuario, $contrasena_hasheada_db);
                $stmt->fetch();

                if (password_verify($contrasena_ingresada, $contrasena_hasheada_db)) {
                    // Contraseña correcta, iniciar sesión
                    $_SESSION['id_usuario'] = $id_usuario;
                    $_SESSION['nombre_usuario'] = $nombre_usuario;
                    $_SESSION['correo_usuario'] = $correo; // Opcional, si lo necesitas

                    $response['status'] = 'success';
                    $response['message'] = 'Inicio de sesión exitoso. Redirigiendo...';
                } else {
                    $response['message'] = 'Correo electrónico o contraseña incorrectos.';
                }
            } else {
                $response['message'] = 'Correo electrónico o contraseña incorrectos.';
            }
            $stmt->close();
        } else {
            $response['message'] = 'Error al preparar la consulta: ' . $mysqli->error;
        }
    }
} else {
    $response['message'] = 'Método de solicitud no válido.';
}

$mysqli->close();
echo json_encode($response);
?>