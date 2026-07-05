const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, getProductsByStore, getMyProducts, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// Públicos
router.get('/', getProducts);
router.get('/store/:storeId', getProductsByStore);
router.get('/:id', getProductById);

// Protegidos (requieren auth de comercio)
router.get('/my/list', protect, getMyProducts);
router.post('/', protect, createProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
