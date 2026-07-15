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
// Servir archivos del frontend compilado (React)
app.use(express.static(path.join(__dirname, 'client', 'dist')));
// Servir subidas de imágenes
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Servir la página del mapa estático en la ruta /mapa
app.get('/mapa', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ⛩️ ENLAZAR RUTAS MODULARES
app.use('/api/comercios', require('./Routes/comercioRoutes'));
app.use('/api/auth', require('./Routes/authRoutes'));
app.use('/api/products', require('./Routes/productRoutes'));
app.use('/api/admin', require('./Routes/adminRoutes'));

// Servir el frontend de React para cualquier otra ruta (soportar React Router)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// 🚨 MANEJADOR DE ERRORES GLOBAL
app.use((err, req, res, next) => {
    console.error('❌ Error capturado:', err);
    let message = err.message || 'Error interno del servidor.';
    if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'El archivo de imagen es demasiado grande. El límite máximo es de 10MB.';
    }
    res.status(err.status || 500).json({ error: message });
});

// 🚀 INICIALIZACIÓN DEL SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 Servidor operativo en: http://localhost:${PORT}`);
});