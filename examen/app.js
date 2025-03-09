// app.js (Backend - Node.js con Express usando PostgreSQL)
const express = require("express");
const { Pool } = require("pg");  // <-- Importa pg en lugar de mysql2
const bodyParser = require("body-parser");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const createDOMPurify = require("dompurify");

// Configuración de DOMPurify para sanitizar entradas
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const app = express();

// Crea un pool de conexiones a PostgreSQL
// Usamos la variable de entorno DATABASE_URL (la configurarás en Render y/o en tu sistema local).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://usuario:contraseña@host:puerto/basedatos",
  ssl: {
    rejectUnauthorized: false // Requerido para conectarse a Neon
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Archivos index.html, styles.css y main.js en la carpeta "public"

// Función auxiliar para detectar etiquetas HTML en un campo
function contieneEtiquetas(cadena) {
  return /<.*?>/g.test(String(cadena));
}

// Endpoint para obtener todos los Backrooms
app.get("/backrooms", async (req, res) => {
  try {
    // Ejecutamos la consulta con el pool de PostgreSQL
    const result = await pool.query("SELECT * FROM backrooms");
    // result.rows contendrá las filas retornadas
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener los Backrooms:", err);
    res.status(500).send("Error al obtener los Backrooms.");
  }
});

// Endpoint para crear un nuevo Backroom con validación de etiquetas HTML
app.post("/backrooms", async (req, res) => {
  const {
    nivel_backroom,
    entidades_presentes,
    nivel_peligro,
    metodo_entrada,
    estado_investigacion,
    descripcion_backroom
  } = req.body;

  // Validar campos obligatorios
  if (!nivel_backroom || !descripcion_backroom) {
    return res.status(400).send("Nivel de Backroom y descripción son obligatorios.");
  }

  // Verificar si alguno de los campos contiene etiquetas HTML
  const campos = {
    nivel_backroom,
    entidades_presentes,
    nivel_peligro,
    metodo_entrada,
    estado_investigacion,
    descripcion_backroom
  };
  for (const key in campos) {
    if (contieneEtiquetas(campos[key])) {
      return res.status(400).send("No puedes poner etiquetas HTML en los campos.");
    }
  }

  // Sanitizar la descripción para prevenir inyección de código malicioso
  const sanitizedDescripcion = DOMPurify.sanitize(descripcion_backroom);

  try {
    // Consulta parametrizada para insertar datos
    const query = `
      INSERT INTO backrooms
      (nivel_backroom, entidades_presentes, nivel_peligro, metodo_entrada, estado_investigacion, descripcion_backroom)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await pool.query(query, [
      nivel_backroom,
      entidades_presentes,
      nivel_peligro,
      metodo_entrada,
      estado_investigacion,
      sanitizedDescripcion
    ]);
    res.send("Backroom creado con éxito.");
  } catch (err) {
    console.error("Error al crear el Backroom:", err);
    res.status(500).send("Error al crear el Backroom.");
  }
});

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
  console.log("Servidor escuchando en el puerto 3000");
});
