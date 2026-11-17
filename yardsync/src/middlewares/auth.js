// "Porteiro" das rotas: exige login e, opcionalmente, um dos perfis informados.
// Consulta o usuário no banco a cada chamada: revogar um usuário ou mudar o perfil vale na hora.
const { pool } = require('../db/pool');
const { HttpError } = require('../utils/errors');
const { lerToken } = require('../services/auth.service');

function auth(...perfis) {
  return async (req, res, next) => {
    const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
    const dados = m && lerToken(m[1]);
    if (!dados) throw new HttpError(401, 'Faça login para continuar.');
    const r = await pool.query('SELECT id, username, role FROM usuarios WHERE id = $1', [dados.id]);
    if (!r.rowCount) throw new HttpError(401, 'Usuário não existe mais. Faça login novamente.');
    if (perfis.length && !perfis.includes(r.rows[0].role)) {
      throw new HttpError(403, 'Seu perfil não tem permissão para esta ação.');
    }
    req.usuario = r.rows[0];
    next();
  };
}

module.exports = { auth };
