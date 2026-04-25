// Vercel serverless entrypoint — wraps the Express app.
// Mapped to /api/* and /admin via vercel.json rewrites.

let app;
let initError = null;
try {
  app = require('../server');
} catch (e) {
  initError = e;
}

module.exports = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'init_failed',
        message: initError.message,
        stack: initError.stack,
      })
    );
    return;
  }
  return app(req, res);
};
