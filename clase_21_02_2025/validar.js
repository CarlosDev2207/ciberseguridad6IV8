function validar(form) {


    // Sanitizar entradas
    form.nombre.value = sanitizeHTML(form.nombre.value);
    form.edad.value = sanitizeHTML(form.edad.value);

    // Validar nombre
    var nombre = form.nombre.value.trim();
    if (nombre === "") {
        alert("Por favor, ingrese su nombre o no ponga etiquetas <>.");
        return false;
    }

    // Validar edad
    var edad = form.edad.value.trim();
    if (edad === "" || isNaN(edad) || edad <= 0) {
        alert("Por favor, ingrese una edad válida.");
        return false;
    }

    // Validar selección de sexo
    var sexo = form.sexo.value;
    if (sexo === "") {
        alert("Por favor, seleccione su sexo.");
        return false;
    }

    // Validar deporte favorito
    var deporte = form.deporte.value;
    if (deporte === "ninguno") {
        alert("Por favor, seleccione un deporte favorito.");
        return false;
    }

    // Si todo es válido, muestra el mensaje en la consola
    alert("Los datos son correctos");
    
    return true;
}

function sanitizeHTML(input) {
    if (/<.*?>/g.test(input)) { // Detecta si hay etiquetas HTML
        alert("No se permiten etiquetas HTML en este campo.");
        return ""; // Vacía el campo si se detectan etiquetas
    }
    return input; // Devuelve el texto si no tiene etiquetas
}