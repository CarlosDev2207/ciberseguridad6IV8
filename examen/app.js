// app.js (Backend - Node.js con Express usando PostgreSQL)
const express = require("express");
const { Pool } = require("pg"); // Cliente PostgreSQL
const bodyParser = require("body-parser");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const createDOMPurify = require("dompurify");

// Configuración de DOMPurify para sanitizar entradas
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const app = express();

// Conexión a la base de datos mediante Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://usuario:contraseña@host:puerto/basedatos",
  ssl: { rejectUnauthorized: false }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Archivos en la carpeta "public"

// Función auxiliar para detectar etiquetas HTML
function contieneEtiquetas(cadena) {
  return /<.*?>/g.test(String(cadena));
}

// Endpoint GET: Obtener todos los Backrooms
app.get("/backrooms", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM backrooms");
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener los Backrooms:", err);
    res.status(500).send("Error al obtener los Backrooms.");
  }
});

// Endpoint POST: Crear un nuevo Backroom con validación y nuevos campos
app.post("/backrooms", async (req, res) => {
  let {
    nivel_backroom,
    entidades_presentes,
    nivel_peligro,
    metodo_entrada,
    estado_investigacion,
    descripcion_backroom,
    iluminacion,
    anomalia_presente
  } = req.body;

  // Validar campos obligatorios
  if (
    nivel_backroom === undefined ||
    !descripcion_backroom ||
    !iluminacion ||
    !anomalia_presente
  ) {
    return res.status(400).send("Nivel de Backroom, descripción, iluminación y anomalía presente son obligatorios.");
  }

  // Convertir nivel_backroom a número
  nivel_backroom = parseInt(nivel_backroom, 10);
  if (isNaN(nivel_backroom)) {
    return res.status(400).send("El nivel de Backroom debe ser un número.");
  }

  const campos = {
    nivel_backroom,
    entidades_presentes,
    nivel_peligro,
    metodo_entrada,
    estado_investigacion,
    descripcion_backroom,
    iluminacion,
    anomalia_presente
  };

  for (const key in campos) {
    if (contieneEtiquetas(campos[key])) {
      return res.status(400).send("No puedes poner etiquetas HTML en los campos.");
    }
  }

  const sanitizedDescripcion = DOMPurify.sanitize(descripcion_backroom);

  try {
    const query = `
      INSERT INTO backrooms
      (nivel_backroom, entidades_presentes, nivel_peligro, metodo_entrada, estado_investigacion, descripcion_backroom, iluminacion, anomalia_presente)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await pool.query(query, [
      nivel_backroom,
      entidades_presentes,
      nivel_peligro,
      metodo_entrada,
      estado_investigacion,
      sanitizedDescripcion,
      iluminacion,
      anomalia_presente
    ]);
    res.send("Backroom creado con éxito.");
  } catch (err) {
    console.error("Error al crear el Backroom:", err);
    res.status(500).send("Error al crear el Backroom.");
  }
});

// Endpoint DELETE: Eliminar un Backroom por ID
app.delete("/backrooms/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM backrooms WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).send("Backroom no encontrado.");
    }
    res.send("Backroom eliminado con éxito.");
  } catch (err) {
    console.error("Error al eliminar el Backroom:", err);
    res.status(500).send("Error al eliminar el Backroom.");
  }
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log("Servidor escuchando en el puerto 3000");
});
