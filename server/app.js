const { render } = require("ejs");
const express = require("express");
const mysql = require("mysql2");

require("dotenv").config();

const app = express();
let conexion = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

conexion.connect(function(err){
    if(err){
        console.log("Error de conexión: ", err);
    }
    else{
        console.log("Conexión establecida exitosamente");
    } 
});

//Ruta de Archivos Dinamicos::::::::::::::::::::::::::::::::::::::::::::::::::::::

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.get("/", function(req, res){
    res.render("index");
});

app.get("/registro", function(req, res){
    res.render("formRegistro");
});

// Crud de clientes::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

//Leer clientes:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
let crud_cliente =({});

crud_cliente.leer = (req, res) => {
    const { page = 1, limit = 10, search = "", filter = "" } = req.query; // Obtener parámetros de consulta
    const offset = (page - 1) * limit;

    let query = `SELECT idcliente, nombres, apellidos, telefono, email, ciudad, genero, DATE_FORMAT(cumpleanos, "%d-%m-%Y") AS cumpleanos, cedula FROM clientes`;
    let queryParams = [];

    // Filtro por búsqueda (nombres o cedula)
    if (search) {
        query += ` WHERE nombres LIKE ? OR cedula LIKE ?`;
        queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Filtro adicional (ciudad)
    if (filter) {
        query += search ? ` AND ciudad = ?` : ` WHERE ciudad = ?`;
        queryParams.push(filter);
    }

    // Agregar paginación
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    // Contar total de clientes (sin paginación)
    const countQuery = `SELECT COUNT(*) AS total FROM clientes`;

    conexion.query(countQuery, [], (countError, countResults) => {
        if (countError) {
            throw countError;
        }

        const total = countResults[0].total;

        conexion.query(query, queryParams, (error, results) => {
            if (error) {
                throw error;
            } else {
                res.render("clientes", {
                    resultado: results,
                    total,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    limit: parseInt(limit),
                    search,
                    filter,
                });
            }
        });
    });
};

//Registro de Clientes::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
app.post("/validar", function(req, res){
    const datos = req.body;

    let nombres = datos.nombres;
    let apellidos = datos.apellidos;
    let email = datos.email;
    let telefono = datos.telefono;
    let cedula = datos.cedula;
    let ciudad = datos.ciudad;
    let genero = datos.genero;
    let cumpleanos = datos.cumpleanos;

    let mensaje;    
    let buscar = "SELECT * FROM clientes WHERE cedula = '" + cedula + "'";
    let success;

    conexion.query(buscar, function(err, resultado){
        if(err){
            mensaje = "Error: No se pudo conectar a la base de datos";
            res.render("formRegistro.ejs", {mensaje});
        }else{
            if(resultado.length > 0){
                mensaje = "Error: La cédula ya está registrada";
                res.render("formRegistro.ejs", {mensaje});
            }else{
                let registrar = "INSERT INTO clientes (nombres, apellidos, telefono, email, ciudad, genero, cumpleanos, cedula) VALUES (' " + nombres + "', '" + apellidos + "', '" + telefono + "', '" + email + "', '" + ciudad + "', '" + genero + "', '" + cumpleanos + "', '" + cedula + "')";
                conexion.query(registrar, function(err){
                    if(err){
                        mensaje = "Error: No se pudo registrar el cliente";
                        res.render("formRegistro.ejs", {mensaje});
                    }else{
                        success = "Datos registrados exitosamente";
                        res.render("formRegistro.ejs", {success});
                    }
                });
            }
        }
    });
});

app.get("/verClientes", crud_cliente.leer);

//Ruta de Archivos Estaticos::::::::::::::::::::::::::::::::::::::::::::::::::::::

app.use(express.static("public"));

//Puerto de la aplicación:::::::::::::::::::::::::::::::::::::::::::::::::::::::::

app.listen(3000, function(){
    console.log("Servidor ejecutándose en el puerto http://localhost:3000");
});