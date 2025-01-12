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

//Ruta de Archivos Dinamicos
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({extended: false}));

//Ruta de Inicio
app.get("/", function(req, res){
    res.render("index");
});

//Ruta de Registro de Clientes
app.get("/registro", function(req, res){
    res.render("formRegistro");
});

//Ruta de Registro de Productos
app.get("/registro-productos", function(req, res){
    res.render("registro-productos");
});

// Crud de clientes
let crud_cliente =({});

crud_cliente.leer = (req, res) => {
    const { page = 1, limit = 10, search = "", filter = "" } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT idcliente, nombres, apellidos, telefono, email, ciudad, genero, DATE_FORMAT(cumpleanos, "%d-%m-%Y") AS cumpleanos, cedula FROM hera_boutique.clientes`;
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
    const countQuery = `SELECT COUNT(*) AS total FROM hera_boutique.clientes`;

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

//Ruta de Ver listado de clientes
app.get("/verClientes", crud_cliente.leer);


// Crud de productos:::::::::::::::::::::::::::::::::::::::::::::
let crud_producto = {};

crud_producto.leer = (req, res) => {
    const { page = 1, limit = 10, search = "", filter = "" } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT id_producto, nombre, FORMAT(precio, 0) AS precio, stock_actual, referencia FROM hera_boutique.productos`;
    let queryParams = [];

    // Filtro por búsqueda (nombres o referencia)
    if (search) {
        query += ` WHERE nombre LIKE ? OR referencia LIKE ?`;
        queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Agregar paginación
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    // Contar total de clientes (sin paginación)
    const countQuery = `SELECT COUNT(*) AS total FROM hera_boutique.productos`;

    conexion.query(countQuery, [], (countError, countResults) => {
        if (countError) {
            throw countError;
        }

        const total = countResults[0].total;

        conexion.query(query, queryParams, (error, results) => {
            if (error) {
                throw error;
            } else {
                res.render("inventario", {
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

//Ruta de Ver listado de productos
app.get("/inventario", crud_producto.leer);

// Crud de ventas:::::::::::::::::::::::::::::::::::::::::::::
let crud_ventas = {};

crud_ventas.leer = (req, res) => {
    const { page = 1, limit = 10, search = "", filter = "" } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT id_venta, DATE_FORMAT(fecha, "%d-%m-%Y") AS fecha, id_producto, cantidad, FORMAT(total, 0) AS total FROM hera_boutique.ventas`;
    let queryParams = [];

    // Filtro por búsqueda (nombres o referencia)
    if (search) {
        query += ` WHERE fecha LIKE ?`;
        queryParams.push(`%${search}%`);
    }

    // Agregar paginación
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    // Consulta para contar el total de registros
    let countQuery = `SELECT COUNT(*) AS total FROM hera_boutique.ventas`;

    // Ejecutar la consulta para contar el total
    conexion.query(countQuery, [], (countError, countResults) => {
        if (countError) {
            throw countError;
        }

        const total = countResults[0].total;

        // Ejecutar la consulta principal
        conexion.query(query, queryParams, (error, results) => {
            if (error) {
                throw error;
            } else {
                res.render("historial-ventas", {
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

//Ruta de Ver listado de productos
app.get("/historial-ventas", crud_ventas.leer);

//Registro de Clientes
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
    let buscar = "SELECT * FROM hera_boutique.clientes WHERE cedula = '" + cedula + "'";
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
                let registrar = "INSERT INTO hera_boutique.clientes (nombres, apellidos, telefono, email, ciudad, genero, cumpleanos, cedula) VALUES (' " + nombres + "', '" + apellidos + "', '" + telefono + "', '" + email + "', '" + ciudad + "', '" + genero + "', '" + cumpleanos + "', '" + cedula + "')";
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

//Registro de Productos
app.post("/registrar_producto", function(req, res){
    const datosProducto = req.body;

    let nombreProducto = datosProducto.nombreProducto;
    let precioProducto = datosProducto.precioProducto;
    let stock_actual = datosProducto.stockProducto;
    let referencia = datosProducto.referencia;

    let mensajeProducto;
    let buscarProducto = "SELECT * FROM hera_boutique.productos WHERE nombre = '" + nombreProducto + "'";
    let successProducto;

    conexion.query(buscarProducto, function(err, resultado){
        if(err){
            mensajeProducto = "Error: No se pudo conectar a la base de datos";
            res.render("registro-productos.ejs", {mensajeProducto});
        }else{
            if(resultado.length > 0){
                mensajeProducto = "Error: El producto ya está registrado";
                res.render("registro-productos.ejs", {mensajeProducto});
            }else{
                let registrarProducto = "INSERT INTO hera_boutique.productos (nombre, precio, stock_actual, referencia) VALUES (' " + nombreProducto + "', '" + precioProducto + "', '" + stock_actual + "', '" + referencia + "')";
                conexion.query(registrarProducto, function(err){
                    if(err){
                        mensajeProducto = "Error: No se pudo registrar el producto";
                        res.render("registro-productos.ejs", {mensajeProducto});
                    }else{
                        successProducto = "Datos registrados exitosamente";
                        res.render("registro-productos.ejs", {successProducto});
                    }
                });
            }
        }
    });
});

//Ruta de Registro de Ventas
app.get('/ventas', (req, res) => {
    const query = "SELECT id_producto, nombre FROM hera_boutique.productos WHERE stock_actual > 0";
    
    conexion.query(query, (error, productos) => {
        if (error) {
            console.error('Error al obtener productos:', error);
            res.render('registro-ventas', { 
                mensaje: 'Error al cargar productos', 
                productos: [],
                mensajeSuccess: undefined // Agregamos esto
            });
            return;
        }
        
        res.render('registro-ventas', { 
            productos: productos,
            mensaje: undefined, // Inicializamos mensaje como null
            mensajeSuccess: undefined // Inicializamos mensajeSuccess como null
        });
    });
});

//Registro de Ventas
app.post('/registrar_venta', (req, res) => {
    // Función auxiliar para renderizar con productos
    const renderConProductos = (mensaje, mensajeSuccess) => {
        const query = "SELECT id_producto, nombre FROM hera_boutique.productos WHERE stock_actual > 0";
        
        conexion.query(query, (error, productos) => {
            if (error) {
                console.error('Error al obtener productos:', error);
                res.render('registro-ventas', { 
                    mensaje: 'Error al cargar productos', 
                    productos: [],
                    mensajeSuccess: undefined
                });
                return;
            }
            
            res.render('registro-ventas', { 
                productos: productos,
                mensaje: mensaje,
                mensajeSuccess: mensajeSuccess
            });
        });
    };

    const productos = [];
    const keys = Object.keys(req.body);
    const numProductos = keys.length / 2;

    for(let i = 0; i < numProductos; i++) {
        const idProducto = req.body[`productos[${i}][id_producto]`];
        const cantidad = req.body[`productos[${i}][cantidad]`];
        
        if(idProducto && cantidad) {
            productos.push({
                id_producto: parseInt(idProducto),
                cantidad: parseInt(cantidad)
            });
        }
    }

    if (productos.length === 0) {
        renderConProductos('No se recibieron productos válidos', null);
        return;
    }

    conexion.beginTransaction((err) => {
        if (err) { 
            console.error('Error al iniciar transacción:', err);
            renderConProductos('Error al procesar la venta', null);
            return;
        }

        const promises = productos.map(producto => {
            return new Promise((resolve, reject) => {
                const getPrecioQuery = `
                    SELECT precio, stock_actual 
                    FROM hera_boutique.productos 
                    WHERE id_producto = ?
                `;

                conexion.query(getPrecioQuery, [producto.id_producto], (error, results) => {
                    if (error) {
                        reject(new Error('Error al obtener precio'));
                        return;
                    }

                    if (!results || results.length === 0) {
                        reject(new Error(`Producto ${producto.id_producto} no encontrado`));
                        return;
                    }

                    if (results[0].stock_actual < producto.cantidad) {
                        reject(new Error(`Stock insuficiente para el producto ${producto.id_producto}`));
                        return;
                    }

                    const total = results[0].precio * producto.cantidad;

                    const insertVentaQuery = `
                        INSERT INTO hera_boutique.ventas 
                        (fecha, id_producto, cantidad, total) 
                        VALUES (CURRENT_TIMESTAMP, ?, ?, ?)
                    `;

                    conexion.query(insertVentaQuery, 
                        [producto.id_producto, producto.cantidad, total], 
                        (error, result) => {
                            if (error) {
                                reject(new Error('Error al insertar venta'));
                                return;
                            }

                            const updateStockQuery = `
                                UPDATE hera_boutique.productos 
                                SET stock_actual = stock_actual - ? 
                                WHERE id_producto = ?
                            `;

                            conexion.query(updateStockQuery, 
                                [producto.cantidad, producto.id_producto], 
                                (error, result) => {
                                    if (error) {
                                        reject(new Error('Error al actualizar stock'));
                                    } else {
                                        resolve();
                                    }
                                });
                        });
                });
            });
        });

        Promise.all(promises)
            .then(() => {
                conexion.commit((err) => {
                    if (err) {
                        console.error('Error en commit:', err);
                        conexion.rollback(() => {
                            renderConProductos('Error al finalizar la venta', undefined);
                        });
                        return;
                    }
                    renderConProductos(undefined, 'Venta registrada correctamente');
                });
            })
            .catch(error => {
                console.error('Error en proceso de venta:', error);
                conexion.rollback(() => {
                    renderConProductos(error.message, undefined);
                });
            });
    });
});

//Ruta de Archivos Estaticos
app.use(express.static("public"));

//Puerto de la aplicación
app.listen(3000, function(){
    console.log("Servidor ejecutándose en el puerto http://localhost:3000");
});