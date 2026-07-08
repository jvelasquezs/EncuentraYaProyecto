const jwt = require('jsonwebtoken');
const { getDb } = require('../config/db');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'criptomapa_secret_2026!');

      const db = getDb();
      const store = db.prepare('SELECT id, nombreTienda, responsable, rif, telefono, correo, logo, contacto_whatsapp, contacto_instagram, descripcion, plataformas, monedas, latitud, longitud, rol, estado FROM stores WHERE id = ?').get(decoded.id);

      if (!store) {
        return res.status(401).json({ error: 'No autorizado, comercio no encontrado' });
      }

      if (store.estado === 'Inhabilitado') {
        return res.status(401).json({ error: 'inhabilitado', message: 'Tu cuenta ha sido inhabilitada. Contacta al administrador.' });
      }

      req.user = { ...store, _id: store.id, rol: store.rol || 'Comercio' };
      next();
    } catch (error) {
      res.status(401).json({ error: 'No autorizado, token fallido' });
    }
  } else {
    res.status(401).json({ error: 'No autorizado, no hay token' });
  }
};

module.exports = { protect };
