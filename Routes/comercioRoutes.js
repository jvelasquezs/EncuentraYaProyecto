const express = require('express');
const router = express.Router();
const { obtenerComercios, actualizarUbicacion } = require('../controllers/comercioController');
const { protect } = require('../middleware/authMiddleware');

// Público: obtener comercios para el mapa
router.get('/', obtenerComercios);

// Protegido: actualizar ubicación del comercio autenticado
router.put('/ubicacion', protect, actualizarUbicacion);

module.exports = router;