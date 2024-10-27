import { getUserRole } from "../../modules/accessControl/getUserRole.js"; // Asegúrate de que la ruta sea correcta

// Función para mostrar/ocultar el botón "00" basado en el rol del usuario
function mostrarBotonSegunRol(userRole) {
    const adminButton = document.getElementById("adminButton");
    const rolesPermitidos = ["Administrador", "Cobrador", "Desarrollador"]; // Roles permitidos
    if (adminButton) {
        adminButton.style.display = rolesPermitidos.includes(userRole) ? "flex" : "none";
    }
}

// Función para obtener el script apropiado según el rol del usuario
function getScriptPath(role) {
    const rolePaths = {
        "Cobrador": "cobrador/pages-02/script-pages-02.js",
        "Administrador": "admin/pages-02/script-pages-02.js",
        "Desarrollador": "dev/pages-02/script-pages-02.js",
        // Agrega otros roles aquí
    };
    return rolePaths[role] || "default/pages-02/script-pages-02.js"; // Ruta de respaldo
}

// Cargar el rol del usuario y el script correspondiente
getUserRole()
    .then((userRole) => {
        mostrarBotonSegunRol(userRole);
        const scriptPath = getScriptPath(userRole);
        return import(`../../users/${scriptPath}`); // Carga dinámica del script
    })
    .then(module => {
        const { updateCollection, mostrarDatos } = module; // Desestructuración para obtener funciones

        loadMonthButtons(updateCollection, mostrarDatos); // Cargar los botones después de obtener el rol
    })
    .catch((error) => {
        console.error("Error obteniendo el rol del usuario o cargando el script:", error);
    });

// Cargar el contenido del componente month-buttons.html
function loadMonthButtons(updateCollection, mostrarDatos) {
    fetch("../../../components/month-buttons/month-buttons.html")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al cargar el componente month-buttons.");
            }
            return response.text();
        })
        .then(data => renderButtons(data, updateCollection, mostrarDatos))
        .catch((error) => console.error("Error al cargar el componente month-buttons:", error));
}

// Insertar botones y configurar eventos
function renderButtons(data, updateCollection, mostrarDatos) {
    const container = document.getElementById("month-buttons-container");
    if (container) {
        container.innerHTML = data;
        const buttons = container.querySelectorAll(".month-buttons .button");
        highlightActiveButton(buttons);
        addClickEventToButtons(buttons, updateCollection, mostrarDatos);
    }
}

// Marcar el botón activo basado en la URL actual
function highlightActiveButton(buttons) {
    const currentPage = window.location.pathname.split("/").pop();
    buttons.forEach((button) => {
        const buttonHref = button.getAttribute("href");
        button.classList.toggle("active", buttonHref && buttonHref.includes(currentPage));
    });
}

// Añadir evento de clic a cada botón para cambiar la colección y resaltar el botón activo
function addClickEventToButtons(buttons, updateCollection, mostrarDatos) {
    buttons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            const collectionValue = button.getAttribute("data-collection");
            if (collectionValue) {
                updateCollection(collectionValue); // Llama a la función desde el módulo importado
                mostrarDatos(); // Llama a la función desde el módulo importado
                highlightActiveButton(buttons); // Resaltar el botón seleccionado
            } else {
                console.error("La colección no está definida. Selecciona una colección válida.");
            }
        });
    });
}

// Ejecutar la carga de los botones al cargar el DOM
document.addEventListener("DOMContentLoaded", () => loadMonthButtons());
