// main.js (Frontend JavaScript)
document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formulario-backroom");
    const alertaDiv = document.getElementById("alerta");
    const tablaBody = document.querySelector("#tabla-backrooms tbody");

    // Función para sanitizar entradas y validar que no contengan etiquetas HTML
    function sanitizeHTML(input) {
        if (/<.*?>/g.test(input)) { // Detecta si hay etiquetas HTML
            alert("No se permiten etiquetas HTML en este campo.");
            return "";
        }
        return input;
    }

    // Función para validar todos los campos del formulario
    function validarCampos(form) {
        const inputs = form.querySelectorAll("input[type='text'], textarea");
        for (let input of inputs) {
            // Sanitiza y actualiza el valor del campo
            input.value = sanitizeHTML(input.value);
            if (input.value.trim() === "") {
                alert("Por favor, completa todos los campos sin usar etiquetas HTML.");
                return false;
            }
        }
        return true;
    }

    // Función para mostrar alertas en pantalla
    function mostrarAlerta(mensaje, esError = false) {
        alertaDiv.textContent = mensaje;
        alertaDiv.className = esError ? "alert error" : "alert";
        setTimeout(() => {
            alertaDiv.textContent = "";
            alertaDiv.className = "";
        }, 3000);
    }

    // Función para cargar los Backrooms y mostrarlos en la tabla
    function cargarBackrooms() {
        fetch("/backrooms")
            .then(response => response.json())
            .then(backrooms => {
                tablaBody.innerHTML = "";
                backrooms.forEach(backroom => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${backroom.nivel_backroom}</td>
                        <td>${backroom.entidades_presentes}</td>
                        <td>${backroom.nivel_peligro}</td>
                        <td>${backroom.metodo_entrada}</td>
                        <td>${backroom.estado_investigacion}</td>
                        <td>${backroom.descripcion_backroom}</td>
                    `;
                    tablaBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error("Error al cargar los Backrooms:", error);
                mostrarAlerta("Error al cargar los Backrooms", true);
            });
    }

    // Manejo del envío del formulario
    formulario.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!validarCampos(formulario)) {
            return; // Si la validación falla, no se envía el formulario
        }
        const formData = new FormData(formulario);
        const data = Object.fromEntries(formData.entries());

        // Enviar datos al backend mediante fetch
        fetch("/backrooms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
            .then(response => response.text())
            .then(message => {
                mostrarAlerta(message);
                formulario.reset();
                cargarBackrooms();
            })
            .catch(error => {
                console.error("Error al agregar el Backroom:", error);
                mostrarAlerta("Error al agregar el Backroom", true);
            });
    });

    // Cargar los Backrooms al iniciar la página
    cargarBackrooms();
});
