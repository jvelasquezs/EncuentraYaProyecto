const mongoose = require('mongoose');

const ComercioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String }, // Qué venden
    categoria: { type: String },    // Ej: Alimentos, Tecnología, Ropa
    plataformas: [{ type: String }], // Ej: ['Binance', 'Crysto', 'Zelle']
    monedas: [{ type: String }],     // Ej: ['USDT', 'BTC', 'BS', 'USD']
    
    // Estructura GeoJSON estándar para coordenadas GPS
    ubicacion: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitud, latitud] -> OJO: Longitud va primero en GeoJSON
            required: true
        }
    },
    fechaRegistro: { type: Date, default: Date.now }
});

// Creamos un índice geoespacial para permitir búsquedas por cercanía física en el futuro
ComercioSchema.index({ ubicacion: '2dsphere' });

module.exports = mongoose.model('Comercio', ComercioSchema);