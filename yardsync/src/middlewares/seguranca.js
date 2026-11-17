const { config } = require('../config/env');

// Em produção, manda quem chegou por HTTP para HTTPS.
function redirecionarHttps(req, res, next) {
  if (!config.isProd || req.secure) return next();
  res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
}

function cabecalhosSeguranca(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(self)',
  });
  next();
}

module.exports = { redirecionarHttps, cabecalhosSeguranca };
