// app.js (Backend - Node.js con Express)
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const createDOMPurify = require("dompurify");

// Configuración de DOMPurify para sanitizar entradas
const window = (new JSDOM('')).window;
const DOMPurify = createDOMPurify(window);

const app = express();

// Conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Myl1ll3sq123",  // Cambia esto por tu contraseña de MySQL
    database: "backrooms_database"  // Nombre de la base de datos
});

db.connect((err) => {
    if (err) {
        console.error("Error conectando a la base de datos:", err);
        process.exit(1);
    }
    console.log("Conexión a la base de datos establecida.");
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Los archivos index.html, styles.css y main.js deben estar en "public"

// Función auxiliar para detectar etiquetas HTML en un campo
function contieneEtiquetas(cadena) {
    return /<.*?>/g.test(String(cadena));
}

// Endpoint para obtener todos los Backrooms
app.get("/backrooms", (req, res) => {
    db.query("SELECT * FROM backrooms", (err, results) => {
        if (err) {
            return res.status(500).send("Error al obtener los Backrooms.");
        }
        res.json(results);
    });
});

// Endpoint para crear un nuevo Backroom con validación de etiquetas HTML
app.post("/backrooms", (req, res) => {
    const { nivel_backroom, entidades_presentes, nivel_peligro, metodo_entrada, estado_investigacion, descripcion_backroom } = req.body;

    // Validar campos obligatorios
    if (!nivel_backroom || !descripcion_backroom) {
        return res.status(400).send("Nivel de Backroom y descripción son obligatorios.");
    }

    // Verificar si alguno de los campos contiene etiquetas HTML
    const campos = { nivel_backroom, entidades_presentes, nivel_peligro, metodo_entrada, estado_investigacion, descripcion_backroom };
    for (const key in campos) {
        if (contieneEtiquetas(campos[key])) {
            return res.status(400).send("No puedes poner etiquetas HTML en los campos.");
        }
    }

    // Sanitizar la descripción para prevenir inyección de código malicioso
    const sanitizedDescripcion = DOMPurify.sanitize(descripcion_backroom);

    db.query(
        "INSERT INTO backrooms (nivel_backroom, entidades_presentes, nivel_peligro, metodo_entrada, estado_investigacion, descripcion_backroom) VALUES (?, ?, ?, ?, ?, ?)",
        [nivel_backroom, entidades_presentes, nivel_peligro, metodo_entrada, estado_investigacion, sanitizedDescripcion],
        (err, result) => {
            if (err) {
                return res.status(500).send("Error al crear el Backroom.");
            }
            res.send("Backroom creado con éxito.");
        }
    );
});

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
    console.log("Servidor escuchando en el puerto 3000");
});
