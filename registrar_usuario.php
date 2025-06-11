<?php
header('Content-Type: application/json'); // Indicar que la respuesta será JSON
require_once 'db_config.php'; // Incluir la configuración de la base de datos

$response = ['status' => 'error', 'message' => 'Ocurrió un error desconocido.'];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Obtener los datos del formulario de forma segura
    $nombre_completo = isset($_POST['fullName']) ? trim($_POST['fullName']) : '';
    $correo = isset($_POST['email']) ? trim($_POST['email']) : '';
    $contrasena = isset($_POST['password']) ? $_POST['password'] : '';
    $confirmar_contrasena = isset($_POST['confirmPassword']) ? $_POST['confirmPassword'] : '';

    // Validaciones básicas
    if (empty($nombre_completo) || empty($correo) || empty($contrasena)) {
        $response['message'] = 'Todos los campos son obligatorios.';
    } elseif (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Formato de correo electrónico inválido.';
    } elseif (strlen($contrasena) < 6) { // Ejemplo: contraseña mínima de 6 caracteres
        $response['message'] = 'La contraseña debe tener al menos 6 caracteres.';
    } elseif ($contrasena !== $confirmar_contrasena) {
        $response['message'] = 'Las contraseñas no coinciden.';
    } else {
        // Comprobar si el correo ya existe
        $sql_check_email = "SELECT id_usuario FROM USUARIO WHERE Correo = ?";
        if ($stmt_check = $mysqli->prepare($sql_check_email)) {
            $stmt_check->bind_param("s", $correo);
            $stmt_check->execute();
            $stmt_check->store_result();

            if ($stmt_check->num_rows > 0) {
                $response['message'] = 'Este correo electrónico ya está registrado.';
            } else {
                // Hashear la contraseña antes de guardarla (¡MUY IMPORTANTE!)
                $hashed_password = password_hash($contrasena, PASSWORD_DEFAULT);

                $sql = "INSERT INTO USUARIO (nombre_usuario, Correo, Contrasena) VALUES (?, ?, ?)";

                if ($stmt = $mysqli->prepare($sql)) {
                    $stmt->bind_param("sss", $nombre_completo, $correo, $hashed_password);
                    if ($stmt->execute()) {
                        $response['status'] = 'success';
                        $response['message'] = '¡Usuario registrado exitosamente!';
                    } else {
                        $response['message'] = 'Error al registrar el usuario: ' . $stmt->error;
                    }
                    $stmt->close();
                } else {
                    $response['message'] = 'Error al preparar la consulta: ' . $mysqli->error;
                }
            }
            $stmt_check->close();
        } else {
            $response['message'] = 'Error al verificar el correo: ' . $mysqli->error;
        }
    }
} else {
    $response['message'] = 'Método de solicitud no válido.';
}

$mysqli->close();
echo json_encode($response);
?>