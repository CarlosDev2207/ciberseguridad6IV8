// app.js (Backend - Node.js con Express y PostgreSQL)
const express = require("express");
const { Pool } = require("pg"); // Cliente PostgreSQL
const bodyParser = require("body-parser");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const createDOMPurify = require("dompurify");
const session = require("express-session");
const bcrypt = require("bcryptjs");  // Se usa bcryptjs para mayor compatibilidad

const app = express();

// Configuración de DOMPurify para sanitizar entradas
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// Configuración del Pool para la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://usuario:contraseña@host:puerto/basedatos",
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Archivos en la carpeta "public"

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || "clave-secreta",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Cambiar a true si usas HTTPS
}));

// Función auxiliar para detectar etiquetas HTML
function contieneEtiquetas(cadena) {
  return /<.*?>/g.test(String(cadena));
}

// Middleware para proteger rutas (requiere autenticación)
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).send("Debes iniciar sesión para acceder a este recurso.");
  }
  next();
}

// Rutas de autenticación

// Mostrar la página de login
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

// Procesar el login y redirigir al index al ser exitoso
app.post("/login", async (req, res) => {
  let { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).send("Usuario y contraseña son requeridos.");
  }
  
  // Sanitizar entradas
  username = DOMPurify.sanitize(username);
  password = DOMPurify.sanitize(password);
  
  try {
    // Consulta parametrizada para prevenir inyección SQL
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(401).send("Credenciales inválidas.");
    }
    const user = result.rows[0];
    
    // Comparar contraseña con bcryptjs
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).send("Credenciales inválidas.");
    }
    
    // Almacenar el ID del usuario en la sesión
    req.session.userId = user.id;
    // Redirigir al index.html (carpeta public)
    res.redirect("/");
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).send("Error en el servidor.");
  }
});

// Ruta para cerrar sesión y redirigir al login
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send("Error al cerrar sesión.");
    }
    res.redirect("/login");
  });
});

// Rutas de registro de usuarios

// Mostrar la página de registro
app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/public/register.html");
});

// Procesar el registro y redirigir al login
app.post("/register", async (req, res) => {
  let { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).send("Usuario y contraseña son requeridos.");
  }
  
  // Sanitizar entradas
  username = DOMPurify.sanitize(username);
  password = DOMPurify.sanitize(password);
  
  // Validar que no contengan etiquetas HTML
  if (contieneEtiquetas(username) || contieneEtiquetas(password)) {
    return res.status(400).send("No se permiten etiquetas HTML.");
  }
  
  // Lista blanca: solo se permiten letras, números, guiones bajos y puntos
  const usernameRegex = /^[a-zA-Z0-9_.]+$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).send("El usuario solo puede contener letras, números, guiones bajos y puntos.");
  }
  
  try {
    // Verificar si el usuario ya existe
    const checkUser = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (checkUser.rows.length > 0) {
      return res.status(400).send("El usuario ya existe.");
    }
    
    // Hash de la contraseña con bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insertar el nuevo usuario usando consulta parametrizada
    const insertQuery = "INSERT INTO users (username, password) VALUES ($1, $2)";
    await pool.query(insertQuery, [username, hashedPassword]);
    
    // Redirigir al login después de un registro exitoso
    res.redirect("/login");
  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).send("Error en el servidor.");
  }
});

// Rutas de Backrooms

// Endpoint GET: Obtener todos los Backrooms (público)
app.get("/backrooms", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM backrooms");
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener los Backrooms:", err);
    res.status(500).send("Error al obtener los Backrooms.");
  }
});

// Endpoint POST: Crear un nuevo Backroom (protegido, requiere sesión)
app.post("/backrooms", requireAuth, async (req, res) => {
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

// Endpoint DELETE: Eliminar un Backroom por ID (protegido, requiere sesión)
app.delete("/backrooms/:id", requireAuth, async (req, res) => {
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
