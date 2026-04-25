// Vercel serverless entrypoint — wraps the Express app.
// Mapped to /api/* and /admin via vercel.json rewrites.
module.exports = require('../server');
