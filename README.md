# Irvan Maulana — Photography Gallery

A minimalist, web-based photography gallery designed to showcase a collection of moments captured across the Indonesian archipelago. The gallery is now backed by a small Node.js API + SQLite database with an admin dashboard at `/admin` so series and photos can be managed (upload / edit / delete) **without touching any code**.

## Key Features

- **Minimalist masonry grid** — an adaptive photo layout that respects each image's original aspect ratio without cropping.
- **Series-based collections** — organized photo sets based on location or theme (Yogyakarta, Bandung, Garut, …).
- **EXIF data display** — Camera, Lens, ISO, Shutter Speed, Aperture surfaced inside an elegant lightbox view.
- **Admin dashboard at `/admin`** — login, drag-and-drop image upload, edit and delete series & photos.
- **Fully responsive** — mobile and desktop optimized.
- **Cloudinary still supported** — you can attach a Cloudinary URL when creating/editing a series or photo, or upload an image directly and the backend will host it locally under `/uploads/...`.

## Tech Stack

- **Frontend**: HTML5, CSS3, vanilla JavaScript.
- **Backend**: Node.js · Express · `better-sqlite3` · Multer.
- **Auth**: JWT signed with a server-side secret. Single admin account configured via env vars.
- **Storage**: SQLite database at `data/gallery.db`, uploaded images at `uploads/` (both git-ignored).
- **Typography**: Playfair Display (serif) & Inter (sans-serif) via Google Fonts.

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   Then edit .env and set:
#     ADMIN_USERNAME, ADMIN_PASSWORD  (login for /admin)
#     JWT_SECRET                      (long random string)

# 3. (Optional) Seed the database with the original 5 series / 100 photos
npm run seed

# 4. Start the server
npm start
```

Open the gallery at <http://localhost:3000> and the admin dashboard at <http://localhost:3000/admin>.

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
| `GET`  | `/uploads/:filename` | Serve an uploaded image |

Admin (require `Authorization: Bearer <jwt>`):

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST`   | `/api/auth/login` | Exchange `{username, password}` for a JWT |
| `POST`   | `/api/series` | Create a series (multipart, optional `cover` file) |
| `PUT`    | `/api/series/:id` | Update fields and/or replace cover |
| `DELETE` | `/api/series/:id` | Delete series + all its photos & files |
| `POST`   | `/api/series/:id/photos` | Upload one or more `photos` (multipart) |
| `PUT`    | `/api/photos/:id` | Update metadata and/or replace image |
| `DELETE` | `/api/photos/:id` | Delete a photo + its file |
| `POST`   | `/api/series/reorder` | Body: `{ order: [id, ...] }` |
| `POST`   | `/api/series/:id/photos/reorder` | Body: `{ order: [id, ...] }` |

## Deploying

The app is a single Node.js process plus a SQLite file and an `uploads/` folder, so it deploys cleanly to:

- **Railway**, **Render**, or **Fly.io** — set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, and mount a persistent volume for `data/` and `uploads/`.
- **A small VPS** — run with `pm2 start server.js`, put nginx in front for TLS, and back up the working directory.

## Project Layout

```
.
├── index.html         # public gallery (fetches /api/series)
├── admin.html         # admin login + CRUD dashboard
├── server.js          # Express app
├── db.js              # SQLite init + schema
├── seed.js            # one-time import of the original SERIES data
├── package.json
├── .env.example
├── data/              # SQLite database (gitignored)
└── uploads/           # uploaded images (gitignored)
```
