const { getDb } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'criptomapa_secret_2026!', {
    expiresIn: '15m',
  });
};

// @desc Registrar comercio/tienda
// @route POST /api/auth/register
const registerStore = async (req, res) => {
  try {
    console.log('registerStore req.body:', req.body);
    console.log('registerStore req.file:', req.file);
    const {
      nombreTienda, responsable, rif, correo, password,
      contacto_whatsapp, contacto_instagram, descripcion,
      plataformas, monedas
    } = req.body;

    const telefono = req.body.telefono || '';

    if (!nombreTienda || !responsable || !rif || !correo || !password) {
      return res.status(400).json({ error: 'Todos los campos obligatorios son requeridos.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const db = getDb();

    // Verificar si ya existe
    const existing = db.prepare('SELECT id FROM stores WHERE correo = ? OR rif = ?').get(correo, rif);
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un comercio registrado con ese correo o RIF.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Obtener la URL del logo (si se subió archivo, usar su URL, sino usar placeholder)
    let logoUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nombreTienda) + '&background=00ffa3&color=0b0f19&size=120&bold=true&format=png';
    if (req.file) {
      logoUrl = `/uploads/${req.file.filename}`;
    }

    // Normalizar plataformas y monedas (pueden venir como string JSON o cadena separada por comas debido a FormData)
    let plataformasArray = [];
    if (plataformas) {
      try {
        plataformasArray = JSON.parse(plataformas);
      } catch (e) {
        plataformasArray = plataformas.split(',').map(s => s.trim()).filter(s => s);
      }
    }

    let monedasArray = [];
    if (monedas) {
      try {
        monedasArray = JSON.parse(monedas);
      } catch (e) {
        monedasArray = monedas.split(',').map(s => s.trim()).filter(s => s);
      }
    }

    const result = db.prepare(`
      INSERT INTO stores (nombreTienda, responsable, rif, telefono, correo, password, logo, contacto_whatsapp, contacto_instagram, descripcion, plataformas, monedas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      nombreTienda, responsable, rif, telefono, correo, hashedPassword,
      logoUrl,
      contacto_whatsapp || null,
      contacto_instagram || null,
      descripcion || null,
      JSON.stringify(plataformasArray),
      JSON.stringify(monedasArray)
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      nombreTienda,
      responsable,
      rif,
      telefono: telefono || '',
      correo,
      logo: logoUrl,
      contacto_whatsapp: contacto_whatsapp || null,
      contacto_instagram: contacto_instagram || null,
      descripcion: descripcion || null,
      plataformas: plataformasArray,
      monedas: monedasArray,
      latitud: null,
      longitud: null,
      rol: 'Comercio',
      estado: 'Activo',
      token: generateToken(result.lastInsertRowid)
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc Login de comercio
// @route POST /api/auth/login
const login = async (req, res) => {
  const { correo, password } = req.body;

  try {
    const db = getDb();
    const store = db.prepare('SELECT * FROM stores WHERE correo = ?').get(correo);

    if (store && (await bcrypt.compare(password, store.password))) {
      // Verificar si la cuenta está inhabilitada
      if (store.estado === 'Inhabilitado') {
        return res.status(403).json({
          error: 'inhabilitado',
          message: 'Tu cuenta ha sido inhabilitada. Contacta al administrador para más información.'
        });
      }

      res.json({
        id: store.id,
        nombreTienda: store.nombreTienda,
        responsable: store.responsable,
        rif: store.rif,
        telefono: store.telefono,
        correo: store.correo,
        logo: store.logo,
        contacto_whatsapp: store.contacto_whatsapp,
        contacto_instagram: store.contacto_instagram,
        descripcion: store.descripcion,
        plataformas: JSON.parse(store.plataformas || '[]'),
        monedas: JSON.parse(store.monedas || '[]'),
        latitud: store.latitud,
        longitud: store.longitud,
        rol: store.rol || 'Comercio',
        estado: store.estado,
        token: generateToken(store.id)
      });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerStore, login };
