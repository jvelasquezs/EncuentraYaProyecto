const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { obtenerComercios, actualizarUbicacion, actualizarPerfil, obtenerPerfil } = require('../controllers/comercioController');
const { protect } = require('../middleware/authMiddleware');

// Asegurar que la carpeta de subidas existe
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar almacenamiento de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp, gif)'));
  }
});

// Público: obtener comercios para el mapa
router.get('/', obtenerComercios);

// Protegido: actualizar ubicación del comercio autenticado
router.put('/ubicacion', protect, actualizarUbicacion);

// Protegido: obtener perfil del comercio autenticado
router.get('/perfil', protect, obtenerPerfil);

// Protegido: actualizar perfil del comercio autenticado
router.put('/perfil', protect, upload.single('logo'), actualizarPerfil);

module.exports = router;