require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const db = require('./db');

const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '25', 10);

if (!process.env.JWT_SECRET) {
  console.warn('[warn] JWT_SECRET is not set — using insecure default. Set it in .env for production.');
}
if (!process.env.ADMIN_PASSWORD) {
  console.warn('[warn] ADMIN_PASSWORD is not set — defaulting to "admin". Set it in .env for production.');
}

const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer config ─────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '') || '.jpg';
    const id = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${id}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image uploads are allowed'));
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────
function publicUrlForFile(filename) {
  return `/uploads/${filename}`;
}

function deleteUploadedFile(urlOrPath) {
  if (!urlOrPath || !urlOrPath.startsWith('/uploads/')) return;
  const filename = path.basename(urlOrPath);
  const fp = path.join(UPLOAD_DIR, filename);
  fs.promises.unlink(fp).catch(() => {});
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

function getSeriesWithPhotos() {
  const series = db.prepare(`SELECT * FROM series ORDER BY sort_order ASC, id ASC`).all();
  const photoStmt = db.prepare(
    `SELECT * FROM photos WHERE series_id = ? ORDER BY sort_order ASC, id ASC`
  );
  return series.map((s) => ({
    id: s.id,
    num: s.num || '',
    name: s.name,
    year: s.year || '',
    cover: s.cover || '',
    desc: s.description || '',
    sort_order: s.sort_order,
    photos: photoStmt.all(s.id).map((p) => ({
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

// ── App ───────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

// ── Auth ──────────────────────────────────────────────────────────────────
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
app.get('/api/series', (_req, res) => {
  res.json(getSeriesWithPhotos());
});

// ── Series CRUD ───────────────────────────────────────────────────────────
app.post('/api/series', authMiddleware, upload.single('cover'), (req, res) => {
  const { num, name, year, description } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

  let coverUrl = (req.body.cover_url || '').trim();
  if (req.file) coverUrl = publicUrlForFile(req.file.filename);

  const maxOrder = db.prepare(`SELECT COALESCE(MAX(sort_order), -1) AS m FROM series`).get().m;

  const result = db
    .prepare(
      `INSERT INTO series (num, name, year, cover, description, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(num || '', name.trim(), year || '', coverUrl || '', description || '', maxOrder + 1);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/series/:id', authMiddleware, upload.single('cover'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare(`SELECT * FROM series WHERE id = ?`).get(id);
  if (!existing) return res.status(404).json({ error: 'Series not found' });

  const fields = ['num', 'name', 'year', 'description'];
  const updates = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }

  let newCover = existing.cover;
  if (req.file) {
    if (existing.cover && existing.cover.startsWith('/uploads/')) deleteUploadedFile(existing.cover);
    newCover = publicUrlForFile(req.file.filename);
  } else if (req.body.cover_url !== undefined) {
    if (existing.cover && existing.cover.startsWith('/uploads/') && existing.cover !== req.body.cover_url) {
      deleteUploadedFile(existing.cover);
    }
    newCover = req.body.cover_url;
  }

  db.prepare(
    `UPDATE series SET
       num         = COALESCE(@num, num),
       name        = COALESCE(@name, name),
       year        = COALESCE(@year, year),
       description = COALESCE(@description, description),
       cover       = @cover
     WHERE id = @id`
  ).run({ ...updates, cover: newCover, id });

  res.json({ ok: true });
});

app.delete('/api/series/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const series = db.prepare(`SELECT * FROM series WHERE id = ?`).get(id);
  if (!series) return res.status(404).json({ error: 'Series not found' });

  const photos = db.prepare(`SELECT img FROM photos WHERE series_id = ?`).all(id);
  db.prepare(`DELETE FROM series WHERE id = ?`).run(id); // cascades photos

  if (series.cover) deleteUploadedFile(series.cover);
  for (const p of photos) deleteUploadedFile(p.img);

  res.json({ ok: true });
});

app.post('/api/series/reorder', authMiddleware, (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of ids' });
  const upd = db.prepare(`UPDATE series SET sort_order = ? WHERE id = ?`);
  const tx = db.transaction((ids) => {
    ids.forEach((id, i) => upd.run(i, id));
  });
  tx(order);
  res.json({ ok: true });
});

// ── Photos CRUD ───────────────────────────────────────────────────────────
app.post(
  '/api/series/:id/photos',
  authMiddleware,
  upload.array('photos', 50),
  (req, res) => {
    const seriesId = parseInt(req.params.id, 10);
    const series = db.prepare(`SELECT id FROM series WHERE id = ?`).get(seriesId);
    if (!series) return res.status(404).json({ error: 'Series not found' });

    // Accept either uploaded files OR a list of {img,title,cam,...} via JSON body.
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

    const maxOrder =
      db.prepare(`SELECT COALESCE(MAX(sort_order), -1) AS m FROM photos WHERE series_id = ?`).get(seriesId).m;

    const insert = db.prepare(
      `INSERT INTO photos (series_id, title, img, cam, lens, iso, ss, ap, sort_order)
       VALUES (@series_id, @title, @img, @cam, @lens, @iso, @ss, @ap, @sort_order)`
    );

    const rows = [];
    const tx = db.transaction(() => {
      let order = maxOrder + 1;

      // Files first; pair them with metas[i] when available.
      files.forEach((file, i) => {
        const meta = metas[i] || {};
        const r = insert.run({
          series_id: seriesId,
          title: meta.title || file.originalname.replace(/\.[^.]+$/, ''),
          img: publicUrlForFile(file.filename),
          cam: meta.cam || '',
          lens: meta.lens || '',
          iso: meta.iso || '',
          ss: meta.ss || '',
          ap: meta.ap || '',
          sort_order: order++,
        });
        rows.push({ id: r.lastInsertRowid });
      });

      // Then any URL-only metas (without an attached file).
      for (let i = files.length; i < metas.length; i++) {
        const m = metas[i];
        if (!m || !m.img) continue;
        const r = insert.run({
          series_id: seriesId,
          title: m.title || '',
          img: m.img,
          cam: m.cam || '',
          lens: m.lens || '',
          iso: m.iso || '',
          ss: m.ss || '',
          ap: m.ap || '',
          sort_order: order++,
        });
        rows.push({ id: r.lastInsertRowid });
      }
    });
    tx();

    res.status(201).json({ created: rows });
  }
);

app.put('/api/photos/:id', authMiddleware, upload.single('image'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare(`SELECT * FROM photos WHERE id = ?`).get(id);
  if (!existing) return res.status(404).json({ error: 'Photo not found' });

  const fields = ['title', 'cam', 'lens', 'iso', 'ss', 'ap'];
  const patch = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) patch[f] = req.body[f];
  }

  let newImg = existing.img;
  if (req.file) {
    if (existing.img && existing.img.startsWith('/uploads/')) deleteUploadedFile(existing.img);
    newImg = publicUrlForFile(req.file.filename);
  } else if (req.body.img !== undefined) {
    if (existing.img && existing.img.startsWith('/uploads/') && existing.img !== req.body.img) {
      deleteUploadedFile(existing.img);
    }
    newImg = req.body.img;
  }

  db.prepare(
    `UPDATE photos SET
       title = COALESCE(@title, title),
       cam   = COALESCE(@cam, cam),
       lens  = COALESCE(@lens, lens),
       iso   = COALESCE(@iso, iso),
       ss    = COALESCE(@ss, ss),
       ap    = COALESCE(@ap, ap),
       img   = @img
     WHERE id = @id`
  ).run({ ...patch, img: newImg, id });

  res.json({ ok: true });
});

app.delete('/api/photos/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const photo = db.prepare(`SELECT img FROM photos WHERE id = ?`).get(id);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  db.prepare(`DELETE FROM photos WHERE id = ?`).run(id);
  if (photo.img) deleteUploadedFile(photo.img);
  res.json({ ok: true });
});

app.post('/api/series/:id/photos/reorder', authMiddleware, (req, res) => {
  const seriesId = parseInt(req.params.id, 10);
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of ids' });
  const upd = db.prepare(`UPDATE photos SET sort_order = ? WHERE id = ? AND series_id = ?`);
  const tx = db.transaction((ids) => {
    ids.forEach((id, i) => upd.run(i, id, seriesId));
  });
  tx(order);
  res.json({ ok: true });
});

// ── Static frontend ───────────────────────────────────────────────────────
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/admin/', (_req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.use(express.static(__dirname, { index: 'index.html', extensions: ['html'] }));

// ── Error handler (multer + others) ───────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`[ready] gallery on http://localhost:${PORT}`);
  console.log(`[ready] admin   on http://localhost:${PORT}/admin`);
});
