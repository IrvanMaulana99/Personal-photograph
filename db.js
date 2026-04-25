const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'gallery.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS series (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    num         TEXT,
    name        TEXT NOT NULL,
    year        TEXT,
    cover       TEXT,
    description TEXT,
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS photos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    series_id  INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    title      TEXT,
    img        TEXT NOT NULL,
    cam        TEXT,
    lens       TEXT,
    iso        TEXT,
    ss         TEXT,
    ap         TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_photos_series ON photos(series_id, sort_order);
  CREATE INDEX IF NOT EXISTS idx_series_order  ON series(sort_order);
`);

module.exports = db;
