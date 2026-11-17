// Painel de TI: SLA e usuários (somente perfil "ti").
const { Router } = require('express');
const { pool } = require('../db/pool');
const { auth } = require('../middlewares/auth');
const { HttpError } = require('../utils/errors');
const { ROLES } = require('../constants');
const { hashSenha } = require('../services/auth.service');
const { getSla } = require('../services/veiculos.service');

const router = Router();

router.get('/config', auth('ti'), async (req, res) => res.json({ diasAposFaturamento: await getSla() }));

router.put('/config', auth('ti'), async (req, res) => {
  const dias = parseInt((req.body || {}).diasAposFaturamento, 10);
  if (!Number.isInteger(dias) || dias < 0 || dias > 365) throw new HttpError(400, 'Informe um número de dias entre 0 e 365.');
  await pool.query(
    `INSERT INTO config (chave, valor) VALUES ('dias_apos_faturamento', $1) ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`,
    [String(dias)]
  );
  res.json({ sucesso: true, mensagem: `SLA atualizado para ${dias} dia(s). Vale para os próximos cadastros.` });
});

router.get('/usuarios', auth('ti'), async (req, res) => {
  const r = await pool.query('SELECT id, username, role, criado_em FROM usuarios ORDER BY username');
  res.json(r.rows);
});

router.post('/usuarios', auth('ti'), async (req, res) => {
  const b = req.body || {};
  const username = String(b.username || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new HttpError(400, 'Usuário: 3 a 30 caracteres (letras, números, ponto, hífen ou _).');
  if (!ROLES.includes(b.role)) throw new HttpError(400, 'Perfil inválido.');
  if (!b.password || String(b.password).length < 8) throw new HttpError(400, 'A senha precisa ter pelo menos 8 caracteres.');
  await pool.query('INSERT INTO usuarios (username, password_hash, role) VALUES ($1,$2,$3)', [username, hashSenha(b.password), b.role]);
  res.status(201).json({ sucesso: true, mensagem: `Usuário ${username} criado.` });
});

router.delete('/usuarios/:id', auth('ti'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.usuario.id) throw new HttpError(400, 'Você não pode remover o seu próprio usuário.');
  const r = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
  if (!r.rowCount) throw new HttpError(404, 'Usuário não encontrado.');
  res.json({ sucesso: true, mensagem: 'Usuário removido. O acesso dele foi revogado.' });
});

module.exports = router;
