const { getDb } = require('./config/db');
const bcrypt = require('bcryptjs');

const seedDB = async () => {
  const db = getDb();

  // Limpiar tablas
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM stores');

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('123456', salt);

  // Tienda 1 - Tech Store (Caracas centro)
  const store1 = db.prepare(`
    INSERT INTO stores (nombreTienda, responsable, rif, telefono, correo, password, logo, contacto_whatsapp, contacto_instagram, descripcion, plataformas, monedas, latitud, longitud)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Tech Hub Venezuela', 'Carlos Mendez', 'J-12345678-9',
    '+58 412-5551234', 'tech@store.com', password,
    'https://ui-avatars.com/api/?name=Tech+Hub&background=00ffa3&color=0b0f19&size=120&bold=true&format=png',
    '+584125551234', '@techhubve',
    'Venta de equipos gaming, computadoras y accesorios de alta gama. Soporte técnico especializado.',
    JSON.stringify(['Binance Pay', 'Pago Móvil', 'Zelle']),
    JSON.stringify(['USDT', 'BTC', 'USD', 'BS']),
    9.9110, -67.3550
  );

  // Tienda 2 - Cafetería Crypto (Plaza Venezuela)
  const store2 = db.prepare(`
    INSERT INTO stores (nombreTienda, responsable, rif, telefono, correo, password, logo, contacto_whatsapp, contacto_instagram, descripcion, plataformas, monedas, latitud, longitud)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Cafetería CryptoBean', 'María López', 'J-98765432-1',
    '+58 414-7779876', 'cafe@cryptobean.com', password,
    'https://ui-avatars.com/api/?name=Crypto+Bean&background=ff6b35&color=fff&size=120&bold=true&format=png',
    '+584147779876', '@cryptobeanve',
    'Cafetería artesanal que acepta criptomonedas. Café de especialidad, pasteles y brunch.',
    JSON.stringify(['Binance Pay', 'Reserve', 'Efectivo']),
    JSON.stringify(['USDT', 'BTC', 'ETH', 'BS']),
    9.9130, -67.3520
  );

  // Tienda 3 - Tienda de ropa (Altamira)
  const store3 = db.prepare(`
    INSERT INTO stores (nombreTienda, responsable, rif, telefono, correo, password, logo, contacto_whatsapp, contacto_instagram, descripcion, plataformas, monedas, latitud, longitud)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Urban Crypto Fashion', 'Ana Torres', 'J-55667788-0',
    '+58 424-3334567', 'info@urbanfashion.com', password,
    'https://ui-avatars.com/api/?name=Urban+Fashion&background=8b5cf6&color=fff&size=120&bold=true&format=png',
    '+584243334567', '@urbancryptofashion',
    'Moda urbana y streetwear. Marcas exclusivas con pagos en crypto.',
    JSON.stringify(['Binance Pay', 'Pago Móvil', 'PayPal']),
    JSON.stringify(['USDT', 'USD', 'BS']),
    9.9050, -67.3600
  );

  // Crear Administrador
  const adminPassword = await bcrypt.hash('12345678', salt);
  db.prepare(`
    INSERT INTO stores (nombreTienda, responsable, rif, telefono, correo, password, logo, rol)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Administrador del Criptomapa', 'Administrador Principal', 'J-00000000-0',
    '+58 400-0000000', 'admin@gmail.com', adminPassword,
    'https://ui-avatars.com/api/?name=Admin&background=1e293b&color=00ffa3&size=120&bold=true&format=png',
    'Administrador'
  );

  // Productos para Tech Hub
  const insertProduct = db.prepare(`
    INSERT INTO products (tienda_id, nombre, descripcion, precio, stock, categoria, imagen)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertProduct.run(store1.lastInsertRowid, 'Laptop Gamer Pro', 'Laptop 16GB RAM, RTX 4060, SSD 512GB', 1500, 10, 'Tecnología',
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=300');
  insertProduct.run(store1.lastInsertRowid, 'Teclado Mecánico RGB', 'Switches Cherry MX Red, retroiluminado', 100, 50, 'Tecnología',
    'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=300');
  insertProduct.run(store1.lastInsertRowid, 'Monitor 144Hz 24"', 'Monitor gaming IPS Full HD', 250, 15, 'Tecnología',
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=300');

  // Productos para Cafetería
  insertProduct.run(store2.lastInsertRowid, 'Café Especial V60', 'Café de origen single-origin preparado en V60', 5, 100, 'Bebidas',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300');
  insertProduct.run(store2.lastInsertRowid, 'Torta de Chocolate Belga', 'Torta artesanal con ganache premium', 12, 20, 'Pastelería',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300');

  // Productos para Urban Fashion
  insertProduct.run(store3.lastInsertRowid, 'Hoodie Crypto Edition', 'Hoodie oversize con estampado Bitcoin', 45, 30, 'Ropa',
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300');
  insertProduct.run(store3.lastInsertRowid, 'Gorra Snapback "HODL"', 'Gorra ajustable edición limitada', 20, 60, 'Accesorios',
    'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?auto=format&fit=crop&w=300');

  console.log('✅ Datos sembrados con éxito en SQLite.');
  console.log(`   → 3 tiendas creadas`);
  console.log(`   → 7 productos creados`);
  console.log(`   → Credenciales de prueba: correo de cualquier tienda / password: 123456`);
  process.exit();
};

seedDB();
