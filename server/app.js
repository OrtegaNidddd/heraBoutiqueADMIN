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
    res.render("form-registro");
});

// Crud de clientes::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

//Leer clientes:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
let crud_cliente =({});

crud_cliente.leer = (req, res) => {
    conexion.query(
        'SELECT idcliente,nombres,apellidos,telefono,email,ciudad,genero,date_format(cumpleanos,"%d-%m-%Y") AS cumpleanos, cedula FROM clientes;',
        (error, results) => {
            if (error) {
                throw error;
            } else {
                res.render('clientes', { resultado: results });
            }
        }
    );
};

app.get("/verClientes", crud_cliente.leer);

//Ruta de Archivos Estaticos::::::::::::::::::::::::::::::::::::::::::::::::::::::

app.use(express.static("public"));

//Puerto de la aplicación:::::::::::::::::::::::::::::::::::::::::::::::::::::::::

app.listen(3000, function(){
    console.log("Servidor ejecutándose en el puerto http://localhost:3000");
});