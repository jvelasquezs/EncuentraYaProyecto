const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getProducts, getProductById, createProduct, getProductsByStore, getMyProducts, deleteProduct, updateProduct } = require('../controllers/productController');
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
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
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

// Públicos
router.get('/', getProducts);
router.get('/store/:storeId', getProductsByStore);
router.get('/:id', getProductById);

// Protegidos (requieren auth de comercio)
router.get('/my/list', protect, getMyProducts);
router.post('/', protect, upload.single('imagen'), createProduct);
router.put('/:id', protect, upload.single('imagen'), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
