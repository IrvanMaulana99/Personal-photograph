require('dotenv').config();
const path = require('path');

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const db = require('./db');
const storage = require('./lib/storage');

const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '25', 10);

if (!process.env.JWT_SECRET) {
  console.warn('[warn] JWT_SECRET is not set — using insecure default. Set it in .env / Vercel env.');
}
if (!process.env.ADMIN_PASSWORD) {
  console.warn('[warn] ADMIN_PASSWORD is not set — defaulting to "admin". Set it in .env / Vercel env.');
}

// ── Multer config: in-memory; storage helper decides where bytes go ──────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image uploads are allowed'));
  },
});

async function persistFile(file) {
  if (!file) return null;
  return storage.uploadBuffer({
    buffer: file.buffer,
    originalName: file.originalname,
    mimetype: file.mimetype,
  });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

async function getSeriesWithPhotos() {
  const series = await db.query(
    `SELECT * FROM series ORDER BY sort_order ASC, id ASC`
  );
  if (series.length === 0) return [];
  const ids = series.map((s) => s.id);
  const photos = await db.query(
    `SELECT * FROM photos WHERE series_id = ANY($1::int[])
     ORDER BY series_id, sort_order ASC, id ASC`,
    [ids]
  );
  const byId = new Map(series.map((s) => [s.id, []]));
  for (const p of photos) byId.get(p.series_id)?.push(p);
  return series.map((s) => ({
    id: s.id,
    num: s.num || '',
    name: s.name,
    year: s.year || '',
    cover: s.cover || '',
    desc: s.description || '',
    sort_order: s.sort_order,
    photos: (byId.get(s.id) || []).map((p) => ({
      id: p.id,
      title: p.title || '',
      img: p.img,
      cam: p.cam || '',
      lens: p.lens || '',
      iso: p.iso || '',
      ss: p.ss || '',
      ap: p.ap || '',
      sort_order: p.sort_order,
    })),
  }));
}

// Helper: wrap async route handlers so unhandled rejections hit Express's error middleware.
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── App ───────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Local-disk fallback: still serve /uploads when no Cloudinary configured.
if (storage.storageMode === 'local') {
  app.use('/uploads', express.static(storage.UPLOAD_DIR, { maxAge: '7d' }));
}

// ── Auth ──────────────────────────────────────────────────────────────────
// Diagnostic: report which storage mode is active and which env vars the
// process currently sees. Values are NEVER returned — only presence/length.
app.get('/api/_debug/storage', (req, res) => {
  const flag = (k) => {
    const v = process.env[k];
    return { present: typeof v === 'string' && v.length > 0, length: v ? v.length : 0 };
  };
  res.json({
    storageMode: storage.storageMode,
    env: {
      CLOUDINARY_CLOUD_NAME: flag('CLOUDINARY_CLOUD_NAME'),
      CLOUDINARY_API_KEY: flag('CLOUDINARY_API_KEY'),
      CLOUDINARY_API_SECRET: flag('CLOUDINARY_API_SECRET'),
      DATABASE_URL: flag('DATABASE_URL'),
      JWT_SECRET: flag('JWT_SECRET'),
      ADMIN_PASSWORD: flag('ADMIN_PASSWORD'),
    },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ sub: username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, expiresIn: 8 * 3600 });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user.sub });
});

// ── Public: list series ───────────────────────────────────────────────────
app.get('/api/series', ah(async (_req, res) => {
  res.json(await getSeriesWithPhotos());
}));

// ── Series CRUD ───────────────────────────────────────────────────────────
app.post(
  '/api/series',
  authMiddleware,
  upload.single('cover'),
  ah(async (req, res) => {
    const { num, name, year, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

    let coverUrl = (req.body.cover_url || '').trim();
    if (req.file) coverUrl = await persistFile(req.file);

    const maxOrder =
      (await db.queryOne(`SELECT COALESCE(MAX(sort_order), -1) AS m FROM series`)).m;

    const row = await db.queryOne(
      `INSERT INTO series (num, name, year, cover, description, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [num || '', name.trim(), year || '', coverUrl || '', description || '', maxOrder + 1]
    );

    res.status(201).json({ id: row.id });
  })
);

app.put(
  '/api/series/:id',
  authMiddleware,
  upload.single('cover'),
  ah(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const existing = await db.queryOne(`SELECT * FROM series WHERE id = $1`, [id]);
    if (!existing) return res.status(404).json({ error: 'Series not found' });

    const updates = {};
    for (const f of ['num', 'name', 'year', 'description']) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }

    let newCover = existing.cover;
    if (req.file) {
      const url = await persistFile(req.file);
      if (existing.cover) await storage.deleteByUrl(existing.cover);
      newCover = url;
    } else if (req.body.cover_url !== undefined) {
      if (existing.cover && existing.cover !== req.body.cover_url) {
        await storage.deleteByUrl(existing.cover);
      }
      newCover = req.body.cover_url;
    }

    await db.query(
      `UPDATE series SET
         num         = COALESCE($1, num),
         name        = COALESCE($2, name),
         year        = COALESCE($3, year),
         description = COALESCE($4, description),
         cover       = $5
       WHERE id = $6`,
      [
        updates.num ?? null,
        updates.name ?? null,
        updates.year ?? null,
        updates.description ?? null,
        newCover ?? '',
        id,
      ]
    );

    res.json({ ok: true });
  })
);

app.delete(
  '/api/series/:id',
  authMiddleware,
  ah(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const series = await db.queryOne(`SELECT * FROM series WHERE id = $1`, [id]);
    if (!series) return res.status(404).json({ error: 'Series not found' });

    const photos = await db.query(`SELECT img FROM photos WHERE series_id = $1`, [id]);
    await db.query(`DELETE FROM series WHERE id = $1`, [id]); // cascades photos

    if (series.cover) await storage.deleteByUrl(series.cover);
    await Promise.all(photos.map((p) => storage.deleteByUrl(p.img)));

    res.json({ ok: true });
  })
);

app.post(
  '/api/series/reorder',
  authMiddleware,
  ah(async (req, res) => {
    const { order } = req.body || {};
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of ids' });
    await db.withTx(async (client) => {
      for (let i = 0; i < order.length; i++) {
        await client.query(`UPDATE series SET sort_order = $1 WHERE id = $2`, [i, order[i]]);
      }
    });
    res.json({ ok: true });
  })
);

// ── Photos CRUD ───────────────────────────────────────────────────────────
app.post(
  '/api/series/:id/photos',
  authMiddleware,
  upload.array('photos', 50),
  ah(async (req, res) => {
    const seriesId = parseInt(req.params.id, 10);
    const series = await db.queryOne(`SELECT id FROM series WHERE id = $1`, [seriesId]);
    if (!series) return res.status(404).json({ error: 'Series not found' });

    const files = req.files || [];
    let metas = [];
    if (req.body.meta) {
      try {
        metas = JSON.parse(req.body.meta);
        if (!Array.isArray(metas)) metas = [];
      } catch {
        metas = [];
      }
    }

    if (files.length === 0 && metas.length === 0) {
      return res.status(400).json({ error: 'Provide at least one file or a "meta" array' });
    }

    const fileUrls = await Promise.all(files.map((f) => persistFile(f)));

    const maxOrder =
      (await db.queryOne(
        `SELECT COALESCE(MAX(sort_order), -1) AS m FROM photos WHERE series_id = $1`,
        [seriesId]
      )).m;

    const rows = await db.withTx(async (client) => {
      const created = [];
      let order = maxOrder + 1;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const meta = metas[i] || {};
        const r = await client.query(
          `INSERT INTO photos (series_id, title, img, cam, lens, iso, ss, ap, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [
            seriesId,
            meta.title || file.originalname.replace(/\.[^.]+$/, ''),
            fileUrls[i],
            meta.cam || '',
            meta.lens || '',
            meta.iso || '',
            meta.ss || '',
            meta.ap || '',
            order++,
          ]
        );
        created.push({ id: r.rows[0].id });
      }

      for (let i = files.length; i < metas.length; i++) {
        const m = metas[i];
        if (!m || !m.img) continue;
        const r = await client.query(
          `INSERT INTO photos (series_id, title, img, cam, lens, iso, ss, ap, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [
            seriesId,
            m.title || '',
            m.img,
            m.cam || '',
            m.lens || '',
            m.iso || '',
            m.ss || '',
            m.ap || '',
            order++,
          ]
        );
        created.push({ id: r.rows[0].id });
      }
      return created;
    });

    res.status(201).json({ created: rows });
  })
);

app.put(
  '/api/photos/:id',
  authMiddleware,
  upload.single('image'),
  ah(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const existing = await db.queryOne(`SELECT * FROM photos WHERE id = $1`, [id]);
    if (!existing) return res.status(404).json({ error: 'Photo not found' });

    const patch = {};
    for (const f of ['title', 'cam', 'lens', 'iso', 'ss', 'ap']) {
      if (req.body[f] !== undefined) patch[f] = req.body[f];
    }

    let newImg = existing.img;
    if (req.file) {
      const url = await persistFile(req.file);
      if (existing.img) await storage.deleteByUrl(existing.img);
      newImg = url;
    } else if (req.body.img !== undefined) {
      if (existing.img && existing.img !== req.body.img) {
        await storage.deleteByUrl(existing.img);
      }
      newImg = req.body.img;
    }

    await db.query(
      `UPDATE photos SET
         title = COALESCE($1, title),
         cam   = COALESCE($2, cam),
         lens  = COALESCE($3, lens),
         iso   = COALESCE($4, iso),
         ss    = COALESCE($5, ss),
         ap    = COALESCE($6, ap),
         img   = $7
       WHERE id = $8`,
      [
        patch.title ?? null,
        patch.cam ?? null,
        patch.lens ?? null,
        patch.iso ?? null,
        patch.ss ?? null,
        patch.ap ?? null,
        newImg ?? '',
        id,
      ]
    );

    res.json({ ok: true });
  })
);

app.delete(
  '/api/photos/:id',
  authMiddleware,
  ah(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const photo = await db.queryOne(`SELECT img FROM photos WHERE id = $1`, [id]);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });
    await db.query(`DELETE FROM photos WHERE id = $1`, [id]);
    if (photo.img) await storage.deleteByUrl(photo.img);
    res.json({ ok: true });
  })
);

app.post(
  '/api/series/:id/photos/reorder',
  authMiddleware,
  ah(async (req, res) => {
    const seriesId = parseInt(req.params.id, 10);
    const { order } = req.body || {};
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of ids' });
    await db.withTx(async (client) => {
      for (let i = 0; i < order.length; i++) {
        await client.query(
          `UPDATE photos SET sort_order = $1 WHERE id = $2 AND series_id = $3`,
          [i, order[i], seriesId]
        );
      }
    });
    res.json({ ok: true });
  })
);

// ── Static frontend ───────────────────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, 'public');
app.get('/admin', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));
app.get('/admin/', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));
app.use(express.static(PUBLIC_DIR, { index: 'index.html', extensions: ['html'] }));

// ── Error handler (multer + others) ───────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || 'Server error' });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[ready] gallery on http://localhost:${PORT}`);
    console.log(`[ready] admin   on http://localhost:${PORT}/admin`);
    console.log(`[ready] storage: ${storage.storageMode}`);
  });
}
