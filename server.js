const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔌 CONEXIÓN AUTOMÁTICA A LA BASE DE DATOS
// La plataforma en la nube inyecta automáticamente MONGO_URI o DATABASE_URL.
// Si no encuentra ninguna (como en tu PC local sin Mongo instalado), usará la ruta por defecto.
const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/criptomapa';

mongoose.connect(MONGO_URI)
    .then(() => console.log('🍃 ¡Éxito! Conectado a la Base de Datos automática del servidor'))
    .catch(err => {
        console.error('❌ Error de conexión a la base de datos:', err);
        console.log('💡 Nota: Si estás en local es normal que falle si no tienes MongoDB instalado. Al subirlo con la extensión, el servidor creará la base de datos por ti.');
    });

// 🛠️ MIDDLEWARES GLOBALES
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ⛩️ ENLAZAR RUTAS MODULARES
// Esto conecta tu API con la lógica de controladores y rutas de tu proyecto
app.use('/api/comercios', require('./routes/comercioRoutes'));

// 🚀 INICIALIZACIÓN DEL SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 Servidor operativo y listo para desplegar en: http://localhost:${PORT}`);
});