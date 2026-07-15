const { getDb } = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc Obtener todos los comercios con coordenadas + sus productos
// @route GET /api/comercios
const obtenerComercios = async (req, res) => {
  try {
    const db = getDb();

    // Obtener tiendas que tienen ubicación configurada
    const stores = db.prepare(`
      SELECT id, nombreTienda, responsable, rif, telefono, correo, logo,
             contacto_whatsapp, contacto_instagram, descripcion,
             plataformas, monedas, latitud, longitud
      FROM stores
      WHERE latitud IS NOT NULL AND longitud IS NOT NULL AND (estado IS NULL OR estado != 'Inhabilitado')
    `).all();

    // Obtener productos de cada tienda
    const getProducts = db.prepare(`
      SELECT id, nombre, descripcion, precio, stock, categoria, imagen
      FROM products
      WHERE tienda_id = ?
    `);

    const result = stores.map(store => ({
      _id: store.id,
      nombre: store.nombreTienda,
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
      ubicacion: {
        type: 'Point',
        coordinates: [store.longitud, store.latitud]
      },
      productos: getProducts.all(store.id)
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error obteniendo comercios:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

// @desc Actualizar ubicación de la tienda autenticada
// @route PUT /api/comercios/ubicacion
const actualizarUbicacion = async (req, res) => {
  try {
    const { latitud, longitud } = req.body;

    if (latitud == null || longitud == null) {
      return res.status(400).json({ error: 'Latitud y longitud son requeridas.' });
    }

    const db = getDb();
    db.prepare('UPDATE stores SET latitud = ?, longitud = ? WHERE id = ?')
      .run(parseFloat(latitud), parseFloat(longitud), req.user._id);

    res.json({ mensaje: '¡Ubicación actualizada con éxito!' });
  } catch (error) {
    console.error('Error actualizando ubicación:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc Actualizar perfil del comercio autenticado
// @route PUT /api/comercios/perfil
const actualizarPerfil = async (req, res) => {
  try {
    const db = getDb();
    const storeId = req.user.id;

    // Destructurar los datos recibidos
    const {
      nombreTienda, responsable, rif, correo, descripcion,
      plataformas, monedas, contacto_whatsapp, contacto_instagram,
      currentPassword, newPassword, confirmPassword
    } = req.body;

    // Validar campos obligatorios
    if (!nombreTienda || !responsable || !rif || !correo) {
      return res.status(400).json({ error: 'Nombre, Responsable, RIF y Correo son obligatorios.' });
    }

    // Validar formato del RIF
    if (rif.length !== 10 || !/^\d{10}$/.test(rif)) {
      return res.status(400).json({ error: 'El RIF debe tener exactamente 10 dígitos.' });
    }

    // Validar formato del Responsable
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(responsable)) {
      return res.status(400).json({ error: 'El nombre del responsable solo debe contener letras y espacios.' });
    }

    // Verificar si el correo o RIF ya están en uso por otro comercio
    const existing = db.prepare('SELECT id FROM stores WHERE (correo = ? OR rif = ?) AND id != ?').get(correo, rif, storeId);
    if (existing) {
      return res.status(400).json({ error: 'El correo o RIF ya están en uso por otro comercio.' });
    }

    // Obtener los datos actuales del comercio
    const currentStore = db.prepare('SELECT password, logo FROM stores WHERE id = ?').get(storeId);

    // Si se desea cambiar la contraseña
    let hashedPassword = currentStore.password;
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Para cambiar la contraseña, debes ingresar la contraseña actual, la nueva y confirmarla.' });
      }

      // Validar coincidencia de nueva contraseña
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'La nueva contraseña y su confirmación no coinciden.' });
      }

      // Validar longitud de la nueva contraseña
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      }

      // Verificar contraseña actual
      const isMatch = await bcrypt.compare(currentPassword, currentStore.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
      }

      // Generar nuevo hash
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(newPassword, salt);
    }

    // Manejar el logo (si se subió uno nuevo)
    let logoUrl = currentStore.logo;
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      logoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    // Normalizar plataformas y monedas
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

    // Actualizar en la base de datos
    db.prepare(`
      UPDATE stores
      SET nombreTienda = ?, responsable = ?, rif = ?, correo = ?, password = ?, logo = ?,
          contacto_whatsapp = ?, contacto_instagram = ?, descripcion = ?,
          plataformas = ?, monedas = ?
      WHERE id = ?
    `).run(
      nombreTienda, responsable, rif, correo, hashedPassword, logoUrl,
      contacto_whatsapp || null, contacto_instagram || null, descripcion || null,
      JSON.stringify(plataformasArray), JSON.stringify(monedasArray),
      storeId
    );

    // Obtener los datos actualizados
    const updatedStore = db.prepare('SELECT id, nombreTienda, responsable, rif, telefono, correo, logo, contacto_whatsapp, contacto_instagram, descripcion, plataformas, monedas, latitud, longitud, rol, estado FROM stores WHERE id = ?').get(storeId);
    const token = req.headers.authorization.split(' ')[1];

    res.json({
      mensaje: 'Perfil actualizado con éxito',
      user: {
        id: updatedStore.id,
        nombreTienda: updatedStore.nombreTienda,
        responsable: updatedStore.responsable,
        rif: updatedStore.rif,
        telefono: updatedStore.telefono,
        correo: updatedStore.correo,
        logo: updatedStore.logo,
        contacto_whatsapp: updatedStore.contacto_whatsapp,
        contacto_instagram: updatedStore.contacto_instagram,
        descripcion: updatedStore.descripcion,
        plataformas: JSON.parse(updatedStore.plataformas || '[]'),
        monedas: JSON.parse(updatedStore.monedas || '[]'),
        latitud: updatedStore.latitud,
        longitud: updatedStore.longitud,
        rol: updatedStore.rol,
        estado: updatedStore.estado,
        token
      }
    });

  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

// @desc Obtener perfil del comercio autenticado
// @route GET /api/comercios/perfil
const obtenerPerfil = async (req, res) => {
  try {
    const db = getDb();
    const store = db.prepare('SELECT id, nombreTienda, responsable, rif, telefono, correo, logo, contacto_whatsapp, contacto_instagram, descripcion, plataformas, monedas, latitud, longitud, rol, estado FROM stores WHERE id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
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
      rol: store.rol,
      estado: store.estado
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

module.exports = {
  obtenerComercios,
  actualizarUbicacion,
  actualizarPerfil,
  obtenerPerfil
};