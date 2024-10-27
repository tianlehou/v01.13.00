import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../environment/firebaseConfig.js";

import { checkAuth } from '../../../modules/accessControl/authCheck.js';
import { getUserRole } from "../../../modules/accessControl/getUserRole.js";
import { checkUserAccess } from "../../../modules/accessControl/roleAccessControl.js";
import { filterDataByAuthenticatedUser } from "../../../modules/tabla/filterData/filterByAuthUser.js";

import { includeHTML } from "../components/includeHTML/includeHTML.js";
import { updateSelectElements } from "./modules/updateSelectElements.js";
import { getMonthAndYearFromURL, generateCalendarDays } from "./modules/calendarUtils.js";

// Lee la variable collection desde el HTML
export const collection = (() => {
    const scriptTag = document.querySelector("script[data-collection]");
    if (scriptTag) {
        return scriptTag.getAttribute("data-collection");
    }
})();

if (!collection) {
    console.error("La variable collection está vacía.");
}

function getElementByIdSafe(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with ID '${id}' not found.`);
    }
    return element;
}

export function mostrarDatos() {
    const tabla = getElementByIdSafe("contenidoTabla");
    if (!tabla) {
        return;
    }

    const { month, year } = getMonthAndYearFromURL();

    if (!collection) {
        console.error("La ruta de la colección es inválida.");
        return;
    }

    // Escuchar los cambios en la base de datos
    onValue(ref(database, collection), (snapshot) => {
        tabla.innerHTML = "";

        const data = [];
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            data.push({ id: childSnapshot.key, ...user });
        });

        // Filtrar los datos según el usuario autenticado
        filterDataByAuthenticatedUser(data, "correoConductor")
            .then((filteredData) => {
                // Ordenar los datos filtrados
                filteredData.sort((a, b) => a.nombre.localeCompare(b.nombre));

                // Renderizar los datos filtrados en la tabla
                let filaNumero = 1;
                filteredData.forEach((user) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td class="text-center">${filaNumero++}</td>
                        <td class="text-center">${user.nombre}</td>
                        ${generateCalendarDays(month, year, user)}
                        <td class="text-center display-none">
                            <span class="${!user.userId ? "invisible-value" : ""}">${user.userId || ""}</span>
                        </td>
                    `;
                    tabla.appendChild(row);
                });

                // Actualizar los elementos <select> de la tabla
                updateSelectElements(database, collection);
            })
            .catch((error) => {
                console.error("Error al filtrar los datos: ", error);
            });
    });
}

// Inicializa la tabla y eventos al cargar el documento
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    checkUserAccess();
  
    // Verifica el rol del usuario autenticado
    try {
      const role = await getUserRole();
      console.log("Rol del usuario autenticado:", role);
    } catch (error) {
      console.error("Error al obtener el rol del usuario:", error);
    }
  
    includeHTML();
    mostrarDatos();
});

console.log(database);
