const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Inicializar la base de datos SQLite al arrancar
const { getDb } = require('./config/db');
getDb();

const app = express();
const PORT = process.env.PORT || 3000;

// 🛠️ MIDDLEWARES GLOBALES
app.use(cors());
app.use(express.json());
// Servir archivos estáticos (mapa Leaflet)
app.use(express.static(path.join(__dirname, 'public')));

// ⛩️ ENLAZAR RUTAS MODULARES
app.use('/api/comercios', require('./Routes/comercioRoutes'));
app.use('/api/auth', require('./Routes/authRoutes'));
app.use('/api/products', require('./Routes/productRoutes'));
app.use('/api/admin', require('./Routes/adminRoutes'));

// 🚀 INICIALIZACIÓN DEL SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 Servidor operativo en: http://localhost:${PORT}`);
});