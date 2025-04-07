// app.js (Backend - Node.js con Express y PostgreSQL)
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const createDOMPurify = require("dompurify");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = express();

// Configuración de DOMPurify para sanitizar entradas
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// Pool de conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://usuario:contraseña@host:puerto/basedatos",
  ssl: { rejectUnauthorized: false }
});

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: process.env.SESSION_SECRET || "clave-secreta",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Función para detectar etiquetas HTML
function contieneEtiquetas(cadena) {
  return /<.*?>/g.test(String(cadena));
}

// Middleware para rutas protegidas
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).send("Debes iniciar sesión para acceder a este recurso.");
  }
  next();
}

// ---- Rutas de autenticación ----

// GET /login -> sirve login.html
typeof app.get === 'function';
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

// POST /login -> procesa login, devuelve mensaje
app.post("/login", async (req, res) => {
  let { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send("Usuario y contraseña son requeridos.");
  }
  username = DOMPurify.sanitize(username);
  password = DOMPurify.sanitize(password);
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(401).send("Usuario no encontrado o contraseña inválida.");
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).send("Usuario no encontrado o contraseña inválida.");
    }
    req.session.userId = user.id;
    res.send("Login exitoso.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error en el servidor.");
  }
});

// GET /logout -> destruye sesión y redirige a login
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Error al cerrar sesión.");
    res.redirect("/login");
  });
});

// GET /register -> sirve register.html
app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/public/register.html");
});

// POST /register -> procesa registro, devuelve mensaje
app.post("/register", async (req, res) => {
  let { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send("Usuario y contraseña son requeridos.");
  }
  username = DOMPurify.sanitize(username);
  password = DOMPurify.sanitize(password);
  if (contieneEtiquetas(username) || contieneEtiquetas(password)) {
    return res.status(400).send("No se permiten etiquetas HTML.");
  }
  const usernameRegex = /^[a-zA-Z0-9_.]+$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).send("El usuario solo puede contener letras, números, guiones bajos y puntos.");
  }
  try {
    const checkUser = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (checkUser.rows.length > 0) {
      return res.status(400).send("El usuario ya existe.");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashedPassword]);
    res.send("Usuario registrado exitosamente.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error en el servidor.");
  }
});

// ---- Rutas de Backrooms ----

app.get("/backrooms", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM backrooms");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener los Backrooms.");
  }
});

app.post("/backrooms", requireAuth, async (req, res) => {
  let { nivel_backroom, entidades_presentes, nivel_peligro, metodo_entrada, estado_investigacion, descripcion_backroom, iluminacion, anomalia_presente } = req.body;
  if (nivel_backroom === undefined || !descripcion_backroom || !iluminacion || !anomalia_presente) {
    return res.status(400).send("Nivel de Backroom, descripción, iluminación y anomalía presente son obligatorios.");
  }
  nivel_backroom = parseInt(nivel_backroom, 10);
  if (isNaN(nivel_backroom)) {
    return res.status(400).send("El nivel de Backroom debe ser un número.");
  }
  const campos = { nivel_backroom, entidades_presentes, nivel_peligro, metodo_entrada, estado_investigacion, descripcion_backroom, iluminacion, anomalia_presente };
  for (const key in campos) {
    if (contieneEtiquetas(campos[key])) {
      return res.status(400).send("No puedes poner etiquetas HTML en los campos.");
    }
  }
  const sanitizedDescripcion = DOMPurify.sanitize(descripcion_backroom);
  try {
    await pool.query(
      `INSERT INTO backrooms
        (nivel_backroom, entidades_presentes, nivel_peligro, metodo_entrada, estado_investigacion, descripcion_backroom, iluminacion, anomalia_presente)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [nivel_backroom, entidades_presentes, nivel_peligro, metodo_entrada, estado_investigacion, sanitizedDescripcion, iluminacion, anomalia_presente]
    );
    res.send("Backroom creado con éxito.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al crear el Backroom.");
  }
});

app.delete("/backrooms/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM backrooms WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).send("Backroom no encontrado.");
    res.send("Backroom eliminado con éxito.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al eliminar el Backroom.");
  }
});

// Iniciar servidor
app.listen(3000, () => console.log("Servidor escuchando en puerto 3000"));