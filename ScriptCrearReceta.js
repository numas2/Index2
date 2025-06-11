document.addEventListener('DOMContentLoaded', function() {
    const addInstruccionBtn = document.getElementById('addInstruccionBtn');
    const instruccionesContainer = document.getElementById('instruccionesContainer');
    let pasoCount = 1; // Contador para el placeholder de los pasos

    // Inicializar el contador basado en los elementos existentes (si los hubiera)
    if (instruccionesContainer) {
        pasoCount = instruccionesContainer.getElementsByClassName('instruccion-item').length;
    }

    function updateRemoveButtonsVisibility() {
        if (!instruccionesContainer) return;
        const items = instruccionesContainer.querySelectorAll('.instruccion-item');
        items.forEach((item, index) => {
            let btn = item.querySelector('.remove-step-btn');
            if (items.length > 1) {
                if (!btn) { // Si el botón no existe (para el primer item que no lo tiene inicialmente)
                    btn = document.createElement('button');
                    btn.type = 'button';
                    btn.classList.add('remove-step-btn');
                    btn.textContent = 'Eliminar';
                    btn.addEventListener('click', function() {
                        item.remove();
                        updateRemoveButtonsVisibility(); // Re-evaluar visibilidad
                    });
                    item.appendChild(btn);
                }
                btn.style.display = 'inline-block';
            } else if (btn) { // Si solo hay un item y el botón existe, ocultarlo
                btn.style.display = 'none';
            }
        });
    }

    if (addInstruccionBtn && instruccionesContainer) {
        addInstruccionBtn.addEventListener('click', function() {
            pasoCount++;
            const nuevaInstruccionDiv = document.createElement('div');
            nuevaInstruccionDiv.classList.add('instruccion-item');

            const nuevoInput = document.createElement('input');
            nuevoInput.type = 'text';
            nuevoInput.name = 'instrucciones[]'; // Nombre como array para el backend
            nuevoInput.placeholder = 'Paso ' + pasoCount;
            nuevoInput.required = true;

            nuevaInstruccionDiv.appendChild(nuevoInput);
            // El botón de eliminar se añadirá/mostrará por updateRemoveButtonsVisibility
            instruccionesContainer.appendChild(nuevaInstruccionDiv);
            updateRemoveButtonsVisibility();
        });
    }

    // Llamada inicial para asegurar que el botón de eliminar del primer paso (si se añade dinámicamente) esté oculto.
    updateRemoveButtonsVisibility();

    const form = document.getElementById('crearRecetaForm');
    const messageDiv = document.getElementById('formMessage');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                if (key.endsWith('[]')) { // Manejar campos de array como 'instrucciones[]'
                    const actualKey = key.substring(0, key.length - 2);
                    if (!data[actualKey]) {
                        data[actualKey] = [];
                    }
                    data[actualKey].push(value);
                } else {
                    data[key] = value;
                }
            });

            // console.log('Datos de la nueva receta:', data); // Para depuración

            messageDiv.textContent = 'Enviando...';
            messageDiv.style.color = 'blue';

            fetch('php/crear_receta_backend.php', {
                method: 'POST',
                body: formData // FormData se envía directamente
            })
            .then(response => response.json())
            .then(responseData => {
                messageDiv.textContent = responseData.message;
                messageDiv.style.color = responseData.status === 'success' ? 'green' : 'red';
                if (responseData.status === 'success') {
                    form.reset();
                    instruccionesContainer.innerHTML = `<div class="instruccion-item"><input type="text" name="instrucciones[]" placeholder="Paso 1" required><button type="button" class="remove-step-btn" style="display:none;">Eliminar</button></div>`;
                    pasoCount = 1;
                    updateRemoveButtonsVisibility();
                }
            })
            .catch(error => {
                console.error('Error en fetch:', error);
                messageDiv.textContent = 'Error de conexión al servidor. Intente más tarde.';
                messageDiv.style.color = 'red';
            });
        });
    }
});