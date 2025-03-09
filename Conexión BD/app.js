const express = require("express");
const mysql = require("mysql2");
var bodyParser = require('body-parser');
var app = express();

var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Myl1ll3sq123',
    database: '6IV8'
});
con.connect();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static('public'));

app.post('/agregarUsuario', (req, res) => {
    let nombre = req.body.nombre;
    let id = req.body.id;

    con.query('INSERT INTO usuario (id, nombre) VALUES (?, ?)', [id, nombre], (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send("Error al conectar");
        }

        // Responder con un objeto JSON
        return res.json({ nombre: nombre, id: id });
    });
});

app.listen(5000, () => {
    console.log('Servidor escuchando en el puerto 5000');
});
