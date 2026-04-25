# Irvan Maulana — Photography Gallery

A minimalist, web-based photography gallery designed to showcase a collection of moments captured across the Indonesian archipelago. The gallery is backed by a small Node.js API with an admin dashboard at `/admin` so series and photos can be managed (upload / edit / delete) **without touching any code**.

Designed to deploy to **Vercel** (free Hobby plan) with **Neon Postgres** + **Cloudinary** — all on free tiers. Local development still works with zero external services (SQLite-style ergonomics via Postgres + local-disk uploads fallback).

## Key Features

- **Minimalist masonry grid** — an adaptive photo layout that respects each image's original aspect ratio without cropping.
- **Series-based collections** — organized photo sets based on location or theme (Yogyakarta, Bandung, Garut, …).
- **EXIF data display** — Camera, Lens, ISO, Shutter Speed, Aperture surfaced inside an elegant lightbox view.
- **Admin dashboard at `/admin`** — login, drag-and-drop image upload, edit and delete series & photos.
- **Fully responsive** — mobile and desktop optimized.
- **Cloud-native by default** — images on Cloudinary, data in Postgres. Local-disk fallback when those env vars are unset (so dev works zero-config).

## Tech Stack

- **Frontend**: HTML5, CSS3, vanilla JavaScript.
- **Backend**: Node.js · Express · `pg` (Postgres) · Multer · Cloudinary SDK.
- **Auth**: JWT signed with a server-side secret. Single admin account configured via env vars.
- **Storage**: Postgres (Neon recommended via Vercel) for data; Cloudinary for image bytes.

## Getting Started (local)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   Then edit .env and set:
#     ADMIN_USERNAME, ADMIN_PASSWORD  (login for /admin)
#     JWT_SECRET                      (long random string)
#     DATABASE_URL                    (Postgres connection string)
#     CLOUDINARY_*                    (optional: leave blank to upload to ./uploads/)

# 3. (Optional) Seed the database with the original 5 series / 100 photos
npm run seed

# 4. Start the server
npm start
```

Open the gallery at <http://localhost:3000> and the admin dashboard at <http://localhost:3000/admin>.

## Deploying to Vercel

1. **Create a Postgres database** (one-time)
   - In your Vercel project → **Storage** → **Create Database** → **Neon (Serverless Postgres)**.
   - Vercel auto-injects `DATABASE_URL` (and a few related vars) into your project's env.
2. **Sign up at Cloudinary** (free) → copy `Cloud name`, `API Key`, `API Secret` from the dashboard.
3. **Set the project's environment variables** (Vercel → Settings → Environment Variables):
   - `ADMIN_USERNAME` — admin login name
   - `ADMIN_PASSWORD` — admin login password
   - `JWT_SECRET` — long random string (e.g. `openssl rand -hex 32`)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - (`DATABASE_URL` is already set by step 1.)
4. **Push to GitHub.** Vercel auto-deploys on every push.
5. **Seed the production DB** (one-time): from your local machine, with the production `DATABASE_URL` in your shell:
   ```bash
   DATABASE_URL='postgres://...' npm run seed
   ```
6. **Open `<your-domain>/admin`**, log in, and manage your gallery.

The `vercel.json` rewrites `/api/*` and `/admin` to a single serverless function that wraps the Express app. `index.html` and other static assets are served directly from Vercel's CDN.

## Admin Dashboard

The dashboard lets you:

- **Create / edit / delete series** (number, name, year, description, cover image).
- **Upload one or more photos** to a series via drag-and-drop or file picker.
- **Edit photo metadata** (title, camera, lens, ISO, shutter, aperture).
- **Replace the image** for a photo or its cover at any time.
- **Delete photos** individually or delete a whole series (cascades).

Changes appear on the public gallery immediately on next page load — no code edits, no redeploy.

## REST API

Public:

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/api/series` | List every series with its photos |

Admin (require `Authorization: Bearer <jwt>`):

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST`   | `/api/auth/login` | Exchange `{username, password}` for a JWT |
| `POST`   | `/api/series` | Create a series (multipart, optional `cover` file) |
| `PUT`    | `/api/series/:id` | Update fields and/or replace cover |
| `DELETE` | `/api/series/:id` | Delete series + all its photos & remote assets |
| `POST`   | `/api/series/:id/photos` | Upload one or more `photos` (multipart) |
| `PUT`    | `/api/photos/:id` | Update metadata and/or replace image |
| `DELETE` | `/api/photos/:id` | Delete a photo + its remote asset |
| `POST`   | `/api/series/reorder` | Body: `{ order: [id, ...] }` |
| `POST`   | `/api/series/:id/photos/reorder` | Body: `{ order: [id, ...] }` |

## Project Layout

```
.
├── index.html         # public gallery (fetches /api/series)
├── admin.html         # admin login + CRUD dashboard
├── server.js          # Express app (exported for Vercel)
├── db.js              # Postgres pool + schema migration
├── seed.js            # one-time import of the original SERIES data
├── lib/storage.js     # Cloudinary uploader (with local-disk fallback)
├── api/index.js       # Vercel serverless entrypoint
├── vercel.json        # Vercel rewrites + function config
├── package.json
└── .env.example
```
