const express = require('express');
const router = express.Router();
const { getStats, getAllStores, createStore, toggleStoreStatus } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'Administrador') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador.' });
  }
  next();
};

// Todas las rutas requieren autenticación + rol admin
router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/stores', getAllStores);
router.post('/stores', createStore);
router.put('/stores/:id/status', toggleStoreStatus);

module.exports = router;
