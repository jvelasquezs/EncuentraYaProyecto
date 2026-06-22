const mongoose = require('mongoose');

const conectarDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'tu_string_de_conexion_a_atlas_aqui';
        await mongoose.connect(MONGO_URI);
        console.log('🍃 Conectado exitosamente a MongoDB Atlas via Antigravity Core');
    } catch (err) {
        console.error('❌ Error de conexión:', err);
        process.exit(1); // Detener la app si falla
    }
};

module.exports = conectarDB;