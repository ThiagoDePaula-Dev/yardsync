// Rotas de login e da conta do usuário logado.
const { Router } = require('express');
const { pool } = require('../db/pool');
const { auth } = require('../middlewares/auth');
const limite = require('../middlewares/limiteLogin');
const { HttpError } = require('../utils/errors');
const { hashSenha, verificarSenha, gerarToken } = require('../services/auth.service');
const { LOCALIZACOES, STATUS } = require('../constants');

const router = Router();

router.post('/login', async (req, res) => {
  limite.verificar(req.ip);
  const b = req.body || {};
  const r = await pool.query('SELECT * FROM usuarios WHERE username = $1', [String(b.username || '').trim().toLowerCase()]);
  const u = r.rows[0];
  if (!u || !verificarSenha(b.password, u.password_hash)) {
    limite.registrarFalha(req.ip);
    throw new HttpError(401, 'Usuário ou senha incorretos.');
  }
  limite.limpar(req.ip);
  res.json({ sucesso: true, token: gerarToken(u), usuario: { username: u.username, role: u.role } });
});

router.get('/me', auth(), (req, res) => {
  res.json({ usuario: req.usuario, localizacoes: LOCALIZACOES, status: STATUS });
});

router.post('/me/senha', auth(), async (req, res) => {
  const { atual, nova } = req.body || {};
  if (!nova || String(nova).length < 8) throw new HttpError(400, 'A nova senha precisa ter pelo menos 8 caracteres.');
  const r = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [req.usuario.id]);
  if (!verificarSenha(atual, r.rows[0].password_hash)) throw new HttpError(400, 'Senha atual incorreta.');
  await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hashSenha(nova), req.usuario.id]);
  res.json({ sucesso: true, mensagem: 'Senha alterada.' });
});

module.exports = router;
