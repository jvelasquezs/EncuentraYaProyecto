const { getDb } = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc Obtener estadísticas generales (admin)
// @route GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const db = getDb();

    const totalStores = db.prepare('SELECT COUNT(*) as count FROM stores').get().count;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const vendedores = db.prepare("SELECT COUNT(*) as count FROM stores WHERE rol = 'Comercio' OR rol IS NULL").get().count;
    const administradores = db.prepare("SELECT COUNT(*) as count FROM stores WHERE rol = 'Administrador'").get().count;

    res.json({
      totalStores,
      totalProducts,
      roles: {
        vendedores,
        administradores
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc Obtener todos los comercios (admin)
// @route GET /api/admin/stores
const getAllStores = async (req, res) => {
  try {
    const db = getDb();
    const stores = db.prepare(`
      SELECT id, nombreTienda, responsable, rif, telefono, correo, logo,
             contacto_whatsapp, contacto_instagram, descripcion,
             plataformas, monedas, latitud, longitud, rol, estado, createdAt
      FROM stores
      ORDER BY createdAt DESC
    `).all();

    const result = stores.map(s => ({
      _id: s.id,
      nombreTienda: s.nombreTienda,
      responsable: s.responsable,
      rif: s.rif,
      telefono: s.telefono,
      correo: s.correo,
      logo: s.logo,
      contacto_whatsapp: s.contacto_whatsapp,
      contacto_instagram: s.contacto_instagram,
      descripcion: s.descripcion,
      plataformas: JSON.parse(s.plataformas || '[]'),
      monedas: JSON.parse(s.monedas || '[]'),
      latitud: s.latitud,
      longitud: s.longitud,
      rol: s.rol || 'Comercio',
      estado: s.estado || 'Activo',
      createdAt: s.createdAt,
      productCount: db.prepare('SELECT COUNT(*) as count FROM products WHERE tienda_id = ?').get(s.id).count
    }));

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo comercios:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc Crear un comercio (admin)
// @route POST /api/admin/stores
const createStore = async (req, res) => {
  try {
    const {
      nombreTienda, responsable, rif, telefono, correo, password,
      contacto_whatsapp, contacto_instagram, descripcion,
      plataformas, monedas, rol
    } = req.body;

    if (!nombreTienda || !responsable || !rif || !telefono || !correo || !password) {
      return res.status(400).json({ error: 'Todos los campos obligatorios son requeridos.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const db = getDb();

    const existing = db.prepare('SELECT id FROM stores WHERE correo = ? OR rif = ?').get(correo, rif);
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un comercio con ese correo o RIF.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Obtener la URL del logo (si se subió archivo, usar su URL, sino usar placeholder)
    let logoUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nombreTienda) + '&background=00ffa3&color=0b0f19&size=120&bold=true&format=png';
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      logoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    // Normalizar plataformas y monedas (pueden venir como string JSON o cadena separada por comas debido a FormData)
    let plataformasArray = [];
    if (plataformas) {
      try {
        plataformasArray = JSON.parse(plataformas);
      } catch (e) {
        plataformasArray = Array.isArray(plataformas) ? plataformas : plataformas.split(',').map(s => s.trim()).filter(s => s);
      }
    }

    let monedasArray = [];
    if (monedas) {
      try {
        monedasArray = JSON.parse(monedas);
      } catch (e) {
        monedasArray = Array.isArray(monedas) ? monedas : monedas.split(',').map(s => s.trim()).filter(s => s);
      }
    }

    const result = db.prepare(`
      INSERT INTO stores (nombreTienda, responsable, rif, telefono, correo, password, logo, contacto_whatsapp, contacto_instagram, descripcion, plataformas, monedas, rol, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo')
    `).run(
      nombreTienda, responsable, rif, telefono, correo, hashedPassword,
      logoUrl,
      contacto_whatsapp || null,
      contacto_instagram || null,
      descripcion || null,
      JSON.stringify(plataformasArray),
      JSON.stringify(monedasArray),
      rol || 'Comercio'
    );

    res.status(201).json({
      _id: result.lastInsertRowid,
      nombreTienda,
      rol: rol || 'Comercio',
      estado: 'Activo',
      message: 'Comercio creado exitosamente.'
    });
  } catch (error) {
    console.error('Error creando comercio:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc Alternar estado de un comercio (admin)
// @route PUT /api/admin/stores/:id/status
const toggleStoreStatus = async (req, res) => {
  try {
    const db = getDb();
    const storeId = req.params.id;
    const { estado } = req.body;

    if (!['Activo', 'Inhabilitado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido. Debe ser Activo o Inhabilitado.' });
    }

    // No permitir que el admin se inahbilite a sí mismo
    if (parseInt(storeId) === req.user._id) {
      return res.status(400).json({ error: 'No puedes cambiar el estado de tu propia cuenta de administrador.' });
    }

    const store = db.prepare('SELECT id, nombreTienda FROM stores WHERE id = ?').get(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Comercio no encontrado.' });
    }

    db.prepare('UPDATE stores SET estado = ? WHERE id = ?').run(estado, storeId);

    res.json({ message: `El estado del comercio "${store.nombreTienda}" se ha cambiado a ${estado}.` });
  } catch (error) {
    console.error('Error cambiando estado de comercio:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getStats, getAllStores, createStore, toggleStoreStatus };
