/**
 * Storage abstraction.
 *
 * If CLOUDINARY_* env vars are set, uploads go to Cloudinary and DB stores the
 * secure URL. Otherwise we fall back to local disk under ./uploads/ so the
 * dev experience remains zero-config.
 *
 * Public API:
 *   uploadBuffer({ buffer, originalName, mimetype }) -> Promise<string url>
 *   deleteByUrl(url) -> Promise<void>   (best-effort)
 *   isCloudinaryUrl(url) -> boolean
 *   storageMode -> 'cloudinary' | 'local'
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

const useCloudinary =
  Boolean(CLOUDINARY_CLOUD_NAME) &&
  Boolean(CLOUDINARY_API_KEY) &&
  Boolean(CLOUDINARY_API_SECRET);

let cloudinary = null;
if (useCloudinary) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

let uploadDirReady = false;
function ensureUploadDir() {
  if (uploadDirReady) return;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  uploadDirReady = true;
}

const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'irvan-photos';

function uploadBufferToCloudinary(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: 'image',
        // Save original filename as part of the public_id so URLs are recognisable.
        public_id: `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function uploadBufferToLocal(buffer, originalName) {
  // On serverless platforms with read-only function bundles (Vercel, Lambda),
  // attempting to write here would surface as a confusing ENOENT mkdir error.
  // Bail out early with a clear message — the deploy is missing CLOUDINARY_*.
  if (process.env.VERCEL) {
    throw new Error(
      'Local-disk uploads are not available on Vercel. ' +
        'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET ' +
        'as project env vars (type "encrypted") and redeploy.'
    );
  }
  ensureUploadDir();
  const ext =
    (originalName ? path.extname(originalName) : '.jpg')
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '') || '.jpg';
  const id = crypto.randomBytes(8).toString('hex');
  const filename = `${Date.now()}-${id}${ext}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

async function uploadBuffer({ buffer, originalName }) {
  if (useCloudinary) return uploadBufferToCloudinary(buffer, originalName);
  return uploadBufferToLocal(buffer, originalName);
}

function isCloudinaryUrl(url) {
  return typeof url === 'string' && /res\.cloudinary\.com/.test(url);
}

function publicIdFromCloudinaryUrl(url) {
  // Format: https://res.cloudinary.com/<cloud>/image/upload/[v123/]?<public_id_with_path>.<ext>
  // We need everything between /upload/(v\d+/)? and the trailing extension.
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-z0-9]+(?:\?.*)?$/i);
  return m ? m[1] : null;
}

async function deleteByUrl(url) {
  if (!url) return;
  if (isCloudinaryUrl(url)) {
    if (!cloudinary) return; // No creds configured at runtime — silently skip.
    const publicId = publicIdFromCloudinaryUrl(url);
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (e) {
      console.warn('[storage] cloudinary destroy failed:', e.message);
    }
    return;
  }
  if (typeof url === 'string' && url.startsWith('/uploads/')) {
    const filename = path.basename(url);
    fs.promises.unlink(path.join(UPLOAD_DIR, filename)).catch(() => {});
  }
}

module.exports = {
  uploadBuffer,
  deleteByUrl,
  isCloudinaryUrl,
  storageMode: useCloudinary ? 'cloudinary' : 'local',
  UPLOAD_DIR,
};
