const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Provide a Postgres connection string.');
}

// Neon (and most managed Postgres providers) require SSL but use cert chains
// that Node.js does not validate by default. Disable strict cert validation
// here — the connection itself is still encrypted.
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: parseInt(process.env.PGPOOL_MAX || '5', 10),
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS series (
  id          SERIAL PRIMARY KEY,
  num         TEXT,
  name        TEXT NOT NULL,
  year        TEXT,
  cover       TEXT,
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
  id         SERIAL PRIMARY KEY,
  series_id  INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  title      TEXT,
  img        TEXT NOT NULL,
  cam        TEXT,
  lens       TEXT,
  iso        TEXT,
  ss         TEXT,
  ap         TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_series ON photos(series_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_series_order  ON series(sort_order);
`;

let schemaPromise = null;
function ensureSchema() {
  if (!schemaPromise) schemaPromise = pool.query(SCHEMA).then(() => null);
  return schemaPromise;
}

async function query(sql, params) {
  await ensureSchema();
  const r = await pool.query(sql, params);
  return r.rows;
}

async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function withClient(fn) {
  await ensureSchema();
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

async function withTx(fn) {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  });
}

module.exports = { pool, query, queryOne, withClient, withTx, ensureSchema };
