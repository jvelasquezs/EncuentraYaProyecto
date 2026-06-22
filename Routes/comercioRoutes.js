const express = require('express');
const router = express.Router();
const comercioController = require('../controllers/comercioController');

// Definir los puntos de acceso de la API
router.get('/', comercioController.obtenerComercios);
router.post('/', comercioController.crearComercio);

module.exports = router;