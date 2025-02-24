function sanitizeHTML(input) {
    return input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}

// Ejemplo de uso:
let contenido = `<p>Texto seguro</p><script>alert('Peligroso');</script><p>Más texto</p>`;
console.log(sanitizeHTML(contenido)); // Devuelve: "<p>Texto seguro</p><p>Más texto</p>"
