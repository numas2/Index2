const allRecipes = [
    {
        id: 1,
        category: 'Plato principal',
        title: 'Salteado de pollo',
        description: 'Un salteado rápido y saludable de pollo y verduras',
        prepTime: '15 minutos',
        cookTime: '10 minutos',
        servings: '3 personas',
        tags: ['asiático', 'pollo', 'sano'],
        isFavorite: false,
        image: 'placeholder.png' // Puedes añadir URLs de imágenes reales aquí
    },
    {
        id: 2,
        category: 'Plato principal',
        title: 'Espaguetis Clásicos a la Carbonara',
        description: 'Un plato de pasta italiana simple pero delicioso.',
        prepTime: '18 minutos',
        cookTime: '15 minutos',
        servings: '4 personas',
        tags: ['italiano', 'pasta', 'rápido'],
        isFavorite: false,
        image: 'placeholder.png'
    },
    {
        id: 3,
        category: 'Postre',
        title: 'Galletas con chispas de chocolate',
        description: 'Las mejores galletas suaves y masticables con chispas de chocolate.',
        prepTime: '20 minutos',
        cookTime: '12 minutos',
        servings: '24 personas',
        tags: ['horneada', 'galletas', 'chocolate'],
        isFavorite: false,
        image: 'placeholder.png'
    },
    {
        id: 4,
        category: 'Desayuno',
        title: 'Tortillas de Avena y Plátano',
        description: 'Un desayuno nutritivo y fácil de preparar, perfecto para empezar el día.',
        prepTime: '10 minutos',
        cookTime: '5 minutos',
        servings: '2 personas',
        tags: ['saludable', 'vegetariano', 'dulce'],
        isFavorite: true,
        image: 'placeholder.png'
    },
    {
        id: 5,
        category: 'Ensalada',
        title: 'Ensalada César con Pollo a la Parrilla',
        description: 'La clásica ensalada César con la adición de pollo a la parrilla para una comida completa.',
        prepTime: '15 minutos',
        cookTime: '10 minutos',
        servings: '2 personas',
        tags: ['ligero', 'pollo', 'cena'],
        isFavorite: false,
        image: 'placeholder.png'
    }
];

let displayedRecipes = [...allRecipes]; // Copia de las recetas para aplicar filtros

// --- Referencias a elementos del DOM ---
const recipeGrid = document.getElementById('recipeGrid');
const searchInput = document.getElementById('searchInput');
const showFavoritesCheckbox = document.getElementById('showFavoritesCheckbox');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const categoryFilterBtn = document.getElementById('categoryFilterBtn'); // Botón que dispara el desplegable
const categoryFilterBtnText = document.getElementById('categoryFilterBtnText'); // Span para el texto del botón
const categoryDropdownMenu = document.getElementById('categoryDropdownMenu'); // El UL del desplegable

// Referencias para los elementos de navegación (aunque solo mostrarán un alert)
const navRecetas = document.getElementById('navRecetas');
const navFavoritos = document.getElementById('navFavoritos');
const navNuevaReceta = document.getElementById('navNuevaReceta');
const navSustituciones = document.getElementById('navSustituciones');


// --- Funciones para renderizar y filtrar ---

/**
 * Renderiza las tarjetas de recetas en el grid.
 * @param {Array} recipesToRender - El array de recetas a mostrar.
 */
function renderRecipes(recipesToRender) {
    if (!recipeGrid) return; // Salir si recipeGrid no existe
    recipeGrid.innerHTML = ''; // Limpia el grid actual

    if (recipesToRender.length === 0) {
        recipeGrid.innerHTML = '<p style="text-align: center; color: #777; font-size: 1.2em; margin-top: 50px;">No se encontraron recetas.</p>';
        return;
    }

    recipesToRender.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.classList.add('recipe-card');

        // Determina si el icono de corazón debe ser sólido (favorito) o hueco (no favorito)
        const favoriteStateClass = recipe.isFavorite ? 'fas' : 'far'; // 'fas' para sólido, 'far' para regular (contorno)


        recipeCard.innerHTML = `
            <div class="recipe-image-placeholder" style="background-image: url('${recipe.image || 'placeholder.png'}');">
                <span class="recipe-category">${recipe.category}</span>
            </div>
            <div class="recipe-content">
                <h2 class="recipe-title">${recipe.title}</h2>
                <p class="recipe-description">${recipe.description}</p>
                <div class="recipe-meta">
                    <span><i class="far fa-clock"></i> ${recipe.prepTime} de preparación</span>
                    <span><i class="fas fa-utensils"></i> ${recipe.cookTime} Cocinar</span>
                    <span><i class="fas fa-users"></i> Para ${recipe.servings}</span>
                </div>
                <div class="recipe-tags">
                   ${recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="recipe-actions">
                    <i class="heart-icon ${favoriteStateClass} fa-heart" data-id="${recipe.id}"></i>
                    <button class="btn-edit" data-id="${recipe.id}"><i class="fas fa-pencil-alt"></i> Editar</button>
                    <button class="btn-delete" data-id="${recipe.id}"><i class="fas fa-trash-alt"></i> Borrar</button>
                </div>
            </div>
        `;
        recipeGrid.appendChild(recipeCard);
    });

    // Re-attach event listeners for dynamic elements
    attachRecipeCardEventListeners();
}

let selectedCategory = null; // Variable global para la categoría seleccionada
/**
 * Aplica los filtros de búsqueda y favoritos a las recetas.
 */
function applyFilters() {
    let filtered = [...allRecipes];
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    // 1. Filtrar por búsqueda (título, descripción, tags)    
    if (searchTerm) { // searchTerm ahora se refiere a la declaración de la línea 118 creo
        filtered = filtered.filter(recipe =>
            recipe.title.toLowerCase().includes(searchTerm) ||
            recipe.description.toLowerCase().includes(searchTerm) ||
            recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    // 2. Filtrar por favoritos
    if (showFavoritesCheckbox && showFavoritesCheckbox.checked) {
        filtered = filtered.filter(recipe => recipe.isFavorite);
    }

    // 3. Filtrar por categoría seleccionada
    if (selectedCategory) {
        filtered = filtered.filter(recipe => recipe.category === selectedCategory);
    }

    displayedRecipes = filtered;
    renderRecipes(displayedRecipes);
}

/**
 * Adjunta listeners a los botones de acción de las tarjetas (Editar, Borrar, Favorito).
 */
function attachRecipeCardEventListeners() {
    if (!recipeGrid) return; // Si no hay grid, no hay botones que adjuntar
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.onclick = (event) => {
            const recipeId = event.currentTarget.dataset.id;
            alert(`Editar receta ID: ${recipeId}. (Funcionalidad real necesitaría una nueva página o modal)`);
            // Aquí iría la lógica para redirigir a una página de edición o abrir un modal
        };
    });

    document.querySelectorAll('.btn-delete').forEach(button => {
        button.onclick = (event) => {
            const recipeId = parseInt(event.currentTarget.dataset.id);
            if (confirm(`¿Estás seguro de que quieres borrar la receta ID: ${recipeId}?`)) {
                // Lógica para borrar la receta del array allRecipes
                const index = allRecipes.findIndex(recipe => recipe.id === recipeId);
                if (index > -1) {
                    allRecipes.splice(index, 1);
                    applyFilters(); // Vuelve a renderizar después de borrar
                    alert(`Receta ID: ${recipeId} borrada.`);
                } else {
                    alert(`Receta ID: ${recipeId} no encontrada.`);
                }
            }
        };
    });

    document.querySelectorAll('.heart-icon').forEach(icon => {
        icon.onclick = (event) => {
            const recipeId = parseInt(event.currentTarget.dataset.id);
            const recipe = allRecipes.find(r => r.id === recipeId);
            if (recipe) {
                recipe.isFavorite = !recipe.isFavorite; // Cambia el estado de favorito
                event.currentTarget.classList.toggle('fas', recipe.isFavorite);
                event.currentTarget.classList.toggle('far', !recipe.isFavorite);
                alert(`Receta ID: ${recipeId} ahora ${recipe.isFavorite ? 'es' : 'no es'} favorita.`);
                // Si el checkbox de favoritos está activado, re-aplicar filtros para actualizar la vista
                if (showFavoritesCheckbox.checked) {
                    applyFilters();
                }
            }
        };
    });
}

/**
 * Obtiene las categorías únicas de todas las recetas.
 * @returns {Array<string>} Un array de nombres de categorías únicas.
 */
function getUniqueCategories() {
    const categories = allRecipes.map(recipe => recipe.category);
    return [...new Set(categories)]; // Elimina duplicados
}

/**
 * Puebla el menú desplegable de categorías.
 */
function populateCategoryDropdown() {
    if (!categoryDropdownMenu) return;

    const categories = getUniqueCategories();
    categoryDropdownMenu.innerHTML = ''; // Limpiar opciones existentes

    // Opción para "Todas las categorías"
    const allCategoriesLi = document.createElement('li');
    allCategoriesLi.textContent = 'Todas las categorías';
    allCategoriesLi.dataset.category = ''; // Valor vacío para "todas"
    allCategoriesLi.addEventListener('click', () => {
        selectedCategory = null;
        categoryFilterBtnText.textContent = 'Todas las categorías';
        categoryDropdownMenu.style.display = 'none';
        applyFilters();
    });
    categoryDropdownMenu.appendChild(allCategoriesLi);

    // Opciones para cada categoría
    categories.forEach(category => {
        const li = document.createElement('li');
        li.textContent = category;
        li.dataset.category = category;
        li.addEventListener('click', () => {
            selectedCategory = category;
            categoryFilterBtnText.textContent = category;
            categoryDropdownMenu.style.display = 'none';
            applyFilters();
        });
        categoryDropdownMenu.appendChild(li);
    });
}

// --- Event Listeners Globales ---

// Búsqueda en tiempo real
if (searchInput) searchInput.addEventListener('input', applyFilters);


// Checkbox de mostrar solo favoritos
if (showFavoritesCheckbox) showFavoritesCheckbox.addEventListener('change', applyFilters);


// Botón de restablecer filtros
if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (showFavoritesCheckbox) showFavoritesCheckbox.checked = false;
        selectedCategory = null; // Restablece la categoría seleccionada
        if (categoryFilterBtnText) categoryFilterBtnText.textContent = 'Todas las categorías'; // Restablece el texto del botón
        applyFilters();
        alert('Filtros restablecidos.');
    });
}

// Botón para mostrar/ocultar el desplegable de categorías
if (categoryFilterBtn) {
    categoryFilterBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Evita que el click se propague al document
        if (categoryDropdownMenu) {
            categoryDropdownMenu.style.display = categoryDropdownMenu.style.display === 'none' ? 'block' : 'none';
        }
    });
}

// Navegación (simulación)
if (navRecetas) navRecetas.addEventListener('click', (e) => { e.preventDefault(); alert('Navegar a la sección de Recetas (página actual).'); });
if (navFavoritos) navFavoritos.addEventListener('click', (e) => { e.preventDefault(); alert('Navegar a la sección de Favoritos.'); });
if (navNuevaReceta) navNuevaReceta.addEventListener('click', (e) => { e.preventDefault(); alert('Navegar a la página para Crear Nueva Receta.'); });
if (navSustituciones) navSustituciones.addEventListener('click', (e) => { e.preventDefault(); alert('Navegar a la sección de Sustituciones.'); });


// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    populateCategoryDropdown(); // Llena el desplegable de categorías
    renderRecipes(allRecipes); // Carga todas las recetas al inicio

    //Cerrar el desplegable si se hace clic fuera de él
    document.addEventListener('click', (event) => {
        if (categoryDropdownMenu && categoryFilterBtn &&
            !categoryFilterBtn.contains(event.target) && !categoryDropdownMenu.contains(event.target)) {
            categoryDropdownMenu.style.display = 'none';
        }
    });
});
// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    renderRecipes(allRecipes); // Carga todas las recetas al inicio
});
