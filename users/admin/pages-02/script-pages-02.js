import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../environment/firebaseConfig.js";

import "./modules/newRegister.js";
import { checkAuth } from '../../../modules/accessControl/authCheck.js';
import { getUserRole } from "../../../modules/accessControl/getUserRole.js";
import { checkUserAccess } from "../../../modules/accessControl/roleAccessControl.js";

import "./modules/downloadToExcel.js";
import { deleteRow } from "./modules/deleteRow.js";
import { addEditEventListeners } from "./modules/editRow.js";
// import { handleFileUpload } from './modules/Excel/uploadExcelHandler.js';

import { initializeSearch } from "./modules/searchFunction.js";
import { initScrollButtons } from "../modules/scrollButtons.js";
import { includeHTML } from '../components/includeHTML/includeHTML.js';
import { updateSelectElements } from './modules/updateSelectElements.js';
import { updateTotalSums } from './modules/sumColumns.js';
import { getDaysInMonth, getMonthAndYearFromURL, generateCalendarDays } from './modules/calendarUtils.js';

// Constantes y variables de estado
const tabla = document.getElementById("contenidoTabla");

// Lee la variable collection desde el HTML
export const collection = (() => {
    const scriptTag = document.querySelector('script[data-collection]');
    if (scriptTag) {
        return scriptTag.getAttribute('data-collection');
    }
})();

if (!collection) {
    console.error('La variable collection está vacía.');
}

export function mostrarDatos() {
    const { month, year } = getMonthAndYearFromURL();

    if (!collection) {
        console.error('La ruta de la colección es inválida.');
        return;
    }

    onValue(ref(database, collection), (snapshot) => {
        tabla.innerHTML = "";

        const data = [];
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            data.push({ id: childSnapshot.key, ...user });
        });

        data.sort((a, b) => a.nombre.localeCompare(b.nombre));

        let filaNumero = 1;
        data.forEach((user) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${filaNumero++}</td>
                <td>${user.nombre}</td>
                <td>${user.correoConductor || ''}</td>
                <td>${user.correoPropietario || ''}</td>
                <td class="display-flex-center">
                <button class="btn btn-primary mg-05em edit-user-button" data-id="${user.id}">
                <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-danger mg-05em delete-user-button" data-id="${user.id}">
                <i class="bi bi-eraser-fill"></i>
                </button>
                </td>
                ${generateCalendarDays(month, year, user)}
            `;
            tabla.appendChild(row);
        });

        addEditEventListeners(database, collection); // Asegúrate de que esto esté aquí
        deleteRow(database, collection);
        updateSelectElements(database, collection);
        updateTotalSums(tabla, Array.from({ length: getDaysInMonth(month, year) }, (_, i) => i + 5));
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
    
    mostrarDatos();
    includeHTML();
    initializeSearch(tabla);
    initScrollButtons(tabla);
    // handleFileUpload();
});

console.log(database);
