const { getDb } = require('../config/db');

// @desc Obtener todos los productos
// @route GET /api/products
const getProducts = async (req, res) => {
  try {
    const db = getDb();
    const products = db.prepare(`
      SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.categoria, p.imagen, p.tienda_id,
             s.nombreTienda
      FROM products p
      LEFT JOIN stores s ON p.tienda_id = s.id
    `).all();

    const result = products.map(p => ({
      _id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      stock: p.stock,
      categoria: p.categoria,
      imagen: p.imagen,
      tienda: { _id: p.tienda_id, nombreTienda: p.nombreTienda }
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Obtener producto por ID
// @route GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const db = getDb();
    const p = db.prepare(`
      SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.categoria, p.imagen, p.tienda_id,
             s.nombreTienda, s.contacto_whatsapp
      FROM products p
      LEFT JOIN stores s ON p.tienda_id = s.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (p) {
      res.json({
        _id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        stock: p.stock,
        categoria: p.categoria,
        imagen: p.imagen,
        tienda: { 
          _id: p.tienda_id, 
          nombreTienda: p.nombreTienda,
          contacto_whatsapp: p.contacto_whatsapp 
        }
      });
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Crear producto (Solo Vendedores autenticados)
// @route POST /api/products
const createProduct = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria } = req.body;

    if (!nombre || !descripcion || precio == null || stock == null || !categoria) {
      return res.status(400).json({ error: 'Faltan campos obligatorios del producto.' });
    }

    // Validar nombre (solo letras, números y espacios)
    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombre)) {
      return res.status(400).json({ error: 'El nombre del producto solo debe contener letras, números y espacios.' });
    }

    // Validar categoría (solo letras y espacios)
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(categoria)) {
      return res.status(400).json({ error: 'La categoría del producto solo debe contener letras y espacios.' });
    }

    let imagenUrl = 'https://via.placeholder.com/300';
    if (req.file) {
      imagenUrl = `/uploads/${req.file.filename}`;
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO products (tienda_id, nombre, descripcion, precio, stock, categoria, imagen)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user._id,
      nombre, descripcion, parseFloat(precio), parseInt(stock), categoria,
      imagenUrl
    );

    res.status(201).json({
      _id: result.lastInsertRowid,
      tienda_id: req.user._id,
      nombre, descripcion, precio, stock, categoria, imagen: imagenUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Obtener productos de una tienda
// @route GET /api/products/store/:storeId
const getProductsByStore = async (req, res) => {
  try {
    const db = getDb();
    const products = db.prepare('SELECT * FROM products WHERE tienda_id = ?').all(req.params.storeId);
    res.json(products.map(p => ({ ...p, _id: p.id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Obtener productos de la tienda autenticada
// @route GET /api/products/my-products
const getMyProducts = async (req, res) => {
  try {
    const db = getDb();
    const products = db.prepare('SELECT * FROM products WHERE tienda_id = ?').all(req.user._id);
    res.json(products.map(p => ({ ...p, _id: p.id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Eliminar producto
// @route DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND tienda_id = ?').get(req.params.id, req.user._id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado o no te pertenece.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ mensaje: 'Producto eliminado con éxito.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Editar producto
// @route PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND tienda_id = ?').get(req.params.id, req.user._id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado o no te pertenece.' });
    }

    const { nombre, descripcion, precio, stock, categoria } = req.body;

    if (nombre && !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombre)) {
      return res.status(400).json({ error: 'El nombre del producto solo debe contener letras, números y espacios.' });
    }

    if (categoria && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(categoria)) {
      return res.status(400).json({ error: 'La categoría del producto solo debe contener letras y espacios.' });
    }

    let imagenUrl = product.imagen;
    if (req.file) {
      imagenUrl = `/uploads/${req.file.filename}`;
    }

    // Actualizar campos (usar los existentes si no se especifican nuevos)
    const finalNombre = nombre !== undefined ? nombre : product.nombre;
    const finalDescripcion = descripcion !== undefined ? descripcion : product.descripcion;
    const finalPrecio = precio !== undefined ? parseFloat(precio) : product.precio;
    const finalStock = stock !== undefined ? parseInt(stock) : product.stock;
    const finalCategoria = categoria !== undefined ? categoria : product.categoria;

    db.prepare(`
      UPDATE products 
      SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ?, imagen = ?
      WHERE id = ?
    `).run(
      finalNombre, finalDescripcion, finalPrecio, finalStock, finalCategoria, imagenUrl,
      req.params.id
    );

    res.json({
      _id: product.id,
      tienda_id: req.user._id,
      nombre: finalNombre,
      descripcion: finalDescripcion,
      precio: finalPrecio,
      stock: finalStock,
      categoria: finalCategoria,
      imagen: imagenUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, getProductsByStore, getMyProducts, deleteProduct, updateProduct };
