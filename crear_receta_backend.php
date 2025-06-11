<?php
header('Content-Type: application/json');
require_once 'db_config.php'; // Asegúrate que este archivo existe y está configurado

session_start(); // Inicia la sesión para obtener el id_usuario

$response = ['status' => 'error', 'message' => 'Ocurrió un error desconocido.'];

// Verificar si el usuario está autenticado
if (!isset($_SESSION['id_usuario'])) {
    $response['status'] = 'auth_error';
    $response['message'] = 'Usuario no autenticado. Por favor, inicie sesión para crear una receta.';
    echo json_encode($response);
    exit;
}
$id_usuario = $_SESSION['id_usuario'];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $titulo = trim($_POST['tituloReceta'] ?? '');
    $descripcion = trim($_POST['descripcionReceta'] ?? '');
    $url_imagen = trim($_POST['urlImagenReceta'] ?? null);
    $tiempo_preparacion_str = trim($_POST['tiempoPreparacion'] ?? '0');
    $tiempo_coccion_str = trim($_POST['tiempoCoccion'] ?? '0');
    $porciones_str = trim($_POST['porcionesReceta'] ?? '1');
    $nombre_categoria = trim($_POST['categoriaReceta'] ?? '');
    $ingredientes_str = trim($_POST['ingredientesReceta'] ?? '');
    $instrucciones_array = $_POST['instrucciones'] ?? []; // Viene como un array

    // --- Validación básica ---
    if (empty($titulo) || empty($descripcion) || empty($nombre_categoria) || empty($ingredientes_str) || empty($instrucciones_array) || !is_array($instrucciones_array)) {
        $response['message'] = 'Todos los campos marcados como obligatorios deben ser completados.';
        echo json_encode($response);
        exit;
    }

    // Convertir tiempos y porciones a enteros
    // Extraer solo el número para los tiempos. Ej: "20 minutos" -> 20
    preg_match('/\d+/', $tiempo_preparacion_str, $matches_prep);
    $tiempo_preparacion_minutos = !empty($matches_prep) ? (int)$matches_prep[0] : 0;

    preg_match('/\d+/', $tiempo_coccion_str, $matches_coccion);
    $tiempo_coccion_minutos = !empty($matches_coccion) ? (int)$matches_coccion[0] : 0; // Asumimos que quieres guardar esto, aunque no está en tu schema RECETA original.
                                                                                  // Podrías añadir una columna `tiempo_coccion_minutos INT` a tu tabla RECETA.

    $porciones = (int)$porciones_str;
    if ($porciones <= 0) $porciones = 1;

    // --- Manejo de Categoría ---
    $id_categoria = null;
    $sql_find_cat = "SELECT id_categoria FROM CATEGORIA WHERE nombre_categoria = ?";
    if ($stmt_find_cat = $mysqli->prepare($sql_find_cat)) {
        $stmt_find_cat->bind_param("s", $nombre_categoria);
        $stmt_find_cat->execute();
        $stmt_find_cat->store_result();
        if ($stmt_find_cat->num_rows > 0) {
            $stmt_find_cat->bind_result($id_cat_found);
            $stmt_find_cat->fetch();
            $id_categoria = $id_cat_found;
        } else {
            // Insertar nueva categoría
            $sql_insert_cat = "INSERT INTO CATEGORIA (nombre_categoria) VALUES (?)";
            if ($stmt_insert_cat = $mysqli->prepare($sql_insert_cat)) {
                $stmt_insert_cat->bind_param("s", $nombre_categoria);
                if ($stmt_insert_cat->execute()) {
                    $id_categoria = $mysqli->insert_id;
                } else {
                    $response['message'] = 'Error al crear nueva categoría: ' . $stmt_insert_cat->error;
                    echo json_encode($response); exit;
                }
                $stmt_insert_cat->close();
            }
        }
        $stmt_find_cat->close();
    } else {
        $response['message'] = 'Error al preparar consulta de categoría: ' . $mysqli->error;
        echo json_encode($response); exit;
    }

    if ($id_categoria === null) {
        $response['message'] = 'No se pudo procesar la categoría.';
        echo json_encode($response); exit;
    }

    // --- Iniciar Transacción ---
    $mysqli->begin_transaction();

    try {
        // 1. Insertar en RECETA
        // Nota: Tu tabla RECETA tiene `Instrucciones MEDIUMTEXT`. Si los pasos van en la tabla PASO,
        // puedes omitir `Instrucciones` aquí o usarlo como un resumen.
        // También, `Calificacion` se omite y tomará su valor por defecto o NULL.
        // Añadí $tiempo_coccion_minutos, si no tienes la columna, elimínalo del INSERT.
        $sql_receta = "INSERT INTO RECETA (id_usuario, Titulo, Descripcion, tiempo_preparacion_minutos, Porciones, imagen_url) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt_receta = $mysqli->prepare($sql_receta);
        $stmt_receta->bind_param("isssis", $id_usuario, $titulo, $descripcion, $tiempo_preparacion_minutos, $porciones, $url_imagen);
        $stmt_receta->execute();
        $id_receta = $mysqli->insert_id;
        $stmt_receta->close();

        // 2. Insertar en RECETA_CATEGORIA
        $sql_rec_cat = "INSERT INTO RECETA_CATEGORIA (id_receta, id_categoria) VALUES (?, ?)";
        $stmt_rec_cat = $mysqli->prepare($sql_rec_cat);
        $stmt_rec_cat->bind_param("ii", $id_receta, $id_categoria);
        $stmt_rec_cat->execute();
        $stmt_rec_cat->close();

        // 3. Insertar en INGREDIENTE
        $ingredientes_lista = explode("\n", $ingredientes_str);
        $sql_ingrediente = "INSERT INTO INGREDIENTE (id_receta, Nombre, cantidad, UNIDAD) VALUES (?, ?, NULL, NULL)"; // Simplificado
        $stmt_ingrediente = $mysqli->prepare($sql_ingrediente);
        foreach ($ingredientes_lista as $ing_nombre) {
            $ing_nombre_trim = trim($ing_nombre);
            if (!empty($ing_nombre_trim)) {
                // Para una mejor implementación, deberías parsear cantidad y unidad aquí.
                $stmt_ingrediente->bind_param("is", $id_receta, $ing_nombre_trim);
                $stmt_ingrediente->execute();
            }
        }
        $stmt_ingrediente->close();

        // 4. Insertar en PASO
        $sql_paso = "INSERT INTO PASO (id_receta, numero_paso, Descripcion) VALUES (?, ?, ?)";
        $stmt_paso = $mysqli->prepare($sql_paso);
        foreach ($instrucciones_array as $index => $desc_paso) {
            $numero_paso = $index + 1;
            $desc_paso_trim = trim($desc_paso);
            if (!empty($desc_paso_trim)) {
                $stmt_paso->bind_param("iis", $id_receta, $numero_paso, $desc_paso_trim);
                $stmt_paso->execute();
            }
        }
        $stmt_paso->close();

        $mysqli->commit();
        $response['status'] = 'success';
        $response['message'] = '¡Receta creada exitosamente!';

    } catch (mysqli_sql_exception $exception) {
        $mysqli->rollback();
        $response['message'] = 'Error al crear la receta: ' . $exception->getMessage();
    }

} else {
    $response['message'] = 'Método de solicitud no válido.';
}

$mysqli->close();
echo json_encode($response);
?>