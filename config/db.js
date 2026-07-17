const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.sqlite');

let db;

function getDb() {
  if (!db) {
    // Asegurar que el directorio padre existe antes de abrir la base de datos
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
    console.log('🗄️  Conectado a SQLite3 en:', DB_PATH);
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombreTienda TEXT NOT NULL,
      responsable TEXT NOT NULL,
      rif TEXT NOT NULL UNIQUE,
      telefono TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      logo TEXT DEFAULT 'https://via.placeholder.com/120/1e293b/00ffa3?text=LOGO',
      contacto_whatsapp TEXT,
      contacto_instagram TEXT,
      descripcion TEXT,
      plataformas TEXT DEFAULT '[]',
      monedas TEXT DEFAULT '[]',
      latitud REAL,
      longitud REAL,
      rol TEXT DEFAULT 'Comercio',
      estado TEXT DEFAULT 'Activo',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tienda_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      precio REAL NOT NULL,
      stock INTEGER NOT NULL,
      categoria TEXT NOT NULL,
      imagen TEXT DEFAULT 'https://via.placeholder.com/300',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tienda_id) REFERENCES stores(id) ON DELETE CASCADE
    );
  `);

  // Migración para bases de datos existentes
  try {
    db.prepare("ALTER TABLE stores ADD COLUMN rol TEXT DEFAULT 'Comercio'").run();
    console.log('🗄️  Migración: Columna "rol" añadida a la tabla "stores".');
  } catch (e) {
    // Si la columna ya existe, SQLite lanzará un error que ignoramos de forma segura.
  }

  // Renombrar Vendedor a Comercio
  try {
    db.prepare("UPDATE stores SET rol = 'Comercio' WHERE rol = 'Vendedor' OR rol IS NULL").run();
  } catch (e) {}

  // Migración: columna estado
  try {
    db.prepare("ALTER TABLE stores ADD COLUMN estado TEXT DEFAULT 'Activo'").run();
    console.log('🗄️  Migración: Columna "estado" añadida a la tabla "stores".');
  } catch (e) {}

  // Asegurar que registros existentes sin estado tengan 'Activo'
  try {
    db.prepare("UPDATE stores SET estado = 'Activo' WHERE estado IS NULL").run();
  } catch (e) {}
}

module.exports = { getDb };