const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');

let db;

function getDb() {
  if (!db) {
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
}

module.exports = { getDb };