const { getDb } = require('../config/db');

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
      WHERE latitud IS NOT NULL AND longitud IS NOT NULL
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

module.exports = {
  obtenerComercios,
  actualizarUbicacion
};