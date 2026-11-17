// Rotas de veículos: painel, listagem, cadastro, edição e leitura do QR Code.
const { Router } = require('express');
const { pool, comTransacao } = require('../db/pool');
const { auth } = require('../middlewares/auth');
const { HttpError } = require('../utils/errors');
const { config } = require('../config/env');
const { LOCALIZACOES, STATUS } = require('../constants');
const { normalizarPlaca } = require('../utils/placa');
const { somarDias, hojeISO } = require('../utils/datas');
const { validarVeiculo } = require('../services/validacao');
const { paraApi, rotuloVeiculo, getSla, buscarPorChave, registrarMovimentacao } = require('../services/veiculos.service');

const router = Router();

/* ---- Painel resumo ---- */
router.get('/resumo', auth(), async (req, res) => {
  const hoje = hojeISO(config.appTz);
  const [loc, abertos] = await Promise.all([
    pool.query(`SELECT localizacao, COUNT(*)::int AS n FROM agendamentos WHERE status_processo <> 'Entregue' GROUP BY 1`),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE COALESCE(data_agendada::date, previsao_entrega) = $1)::int AS hoje,
         COUNT(*) FILTER (WHERE previsao_entrega < $1 AND data_agendada IS NULL)::int AS atrasados
       FROM agendamentos WHERE status_processo <> 'Entregue'`,
      [hoje]
    ),
  ]);
  const porLocalizacao = Object.fromEntries(LOCALIZACOES.map((l) => [l, 0]));
  loc.rows.forEach((r) => (porLocalizacao[r.localizacao] = r.n));
  res.json({ porLocalizacao, entregasHoje: abertos.rows[0].hoje, atrasados: abertos.rows[0].atrasados });
});

/* ---- Listagem (app e Excel). Filtros: ?busca=&localizacao=&status=&dia=hoje ---- */
router.get('/agendamentos', auth(), async (req, res) => {
  const cond = [];
  const args = [];
  const { busca, localizacao, status, dia } = req.query;
  if (busca) {
    args.push(`%${String(busca).trim()}%`);
    const i = args.length;
    args.push(`%${normalizarPlaca(busca)}%`);
    cond.push(`(cliente ILIKE $${i} OR chassi ILIKE $${i} OR placa ILIKE $${i} OR placa ILIKE $${i + 1})`);
  }
  if (localizacao) { args.push(String(localizacao)); cond.push(`localizacao = $${args.length}`); }
  if (status) { args.push(String(status)); cond.push(`status_processo = $${args.length}`); }
  if (dia === 'hoje') { args.push(hojeISO(config.appTz)); cond.push(`COALESCE(data_agendada::date, previsao_entrega) = $${args.length}`); }
  const r = await pool.query(
    `SELECT * FROM agendamentos ${cond.length ? 'WHERE ' + cond.join(' AND ') : ''}
     ORDER BY (status_processo = 'Entregue'), COALESCE(data_agendada::date, previsao_entrega) NULLS LAST, placa, chassi`,
    args
  );
  res.json(r.rows.map(paraApi));
});

// :chave pode ser a placa OU o chassi (17 caracteres)
router.get('/agendamentos/:chave', auth(), async (req, res) => {
  const veiculo = await buscarPorChave(pool, req.params.chave);
  if (!veiculo) throw new HttpError(404, 'Veículo não encontrado.');
  const h = await pool.query(
    'SELECT de, para, usuario, criado_em FROM movimentacoes WHERE veiculo_id = $1 ORDER BY criado_em DESC LIMIT 20',
    [veiculo.id]
  );
  res.json({ ...paraApi(veiculo), historico: h.rows });
});

/* ---- Cadastro e edição (administrador / TI) ---- */
router.post('/agendamentos', auth('administrador', 'ti'), async (req, res) => {
  const { v, erro } = validarVeiculo(req.body || {});
  if (erro) throw new HttpError(400, erro);
  if (!v.placa && !v.chassi) throw new HttpError(400, 'Informe a placa ou o chassi do veículo.');
  if (!v.cliente) throw new HttpError(400, 'Informe o nome do cliente.');

  // Evita duplicados (placa ou chassi já cadastrados)
  const dup = await pool.query('SELECT placa, chassi FROM agendamentos WHERE ($1::text IS NOT NULL AND placa = $1) OR ($2::text IS NOT NULL AND chassi = $2)', [v.placa || null, v.chassi || null]);
  if (dup.rowCount) throw new HttpError(409, 'Já existe um veículo com essa placa ou esse chassi.');

  // Motor de SLA: previsão = faturamento + dias configurados (a menos que informem a previsão)
  if (v.data_faturamento && !v.previsao_entrega) v.previsao_entrega = somarDias(v.data_faturamento, await getSla());
  v.localizacao = v.localizacao || 'CD';
  v.status_processo = v.status_processo || STATUS[0];

  const cols = Object.keys(v);
  const r = await pool.query(
    `INSERT INTO agendamentos (${cols.join(',')}) VALUES (${cols.map((_, i) => '$' + (i + 1)).join(',')}) RETURNING *`,
    Object.values(v)
  );
  res.status(201).json({ sucesso: true, mensagem: `Veículo ${rotuloVeiculo(r.rows[0])} cadastrado.`, veiculo: paraApi(r.rows[0]) });
});

router.put('/agendamentos/:chave', auth('administrador', 'ti'), async (req, res) => {
  const { v, erro } = validarVeiculo(req.body || {});
  if (erro) throw new HttpError(400, erro);

  const veiculo = await comTransacao(async (client) => {
    const atual = await buscarPorChave(client, req.params.chave, true);
    if (!atual) throw new HttpError(404, 'Veículo não encontrado.');

    // Depois da edição, o veículo ainda precisa ter placa ou chassi
    const placaFinal = 'placa' in v ? v.placa : atual.placa;
    const chassiFinal = 'chassi' in v ? v.chassi : atual.chassi;
    if (!placaFinal && !chassiFinal) throw new HttpError(400, 'O veículo precisa ter placa ou chassi.');

    if (v.data_faturamento && !('previsao_entrega' in v)) v.previsao_entrega = somarDias(v.data_faturamento, await getSla(client));
    const cols = Object.keys(v);
    if (!cols.length) return atual;
    const sets = cols.map((c, i) => `${c} = $${i + 1}`).concat('atualizado_em = now()');
    const r = await client.query(`UPDATE agendamentos SET ${sets.join(', ')} WHERE id = $${cols.length + 1} RETURNING *`, [
      ...Object.values(v),
      atual.id,
    ]);
    if (v.localizacao) await registrarMovimentacao(client, r.rows[0], atual.localizacao, v.localizacao, req.usuario.username);
    return r.rows[0];
  });
  res.json({ sucesso: true, mensagem: `Veículo ${rotuloVeiculo(veiculo)} atualizado.`, veiculo: paraApi(veiculo) });
});

router.delete('/agendamentos/:chave', auth('ti'), async (req, res) => {
  const veiculo = await buscarPorChave(pool, req.params.chave);
  if (!veiculo) throw new HttpError(404, 'Veículo não encontrado.');
  await pool.query('DELETE FROM agendamentos WHERE id = $1', [veiculo.id]);
  res.json({ sucesso: true, mensagem: `Veículo ${rotuloVeiculo(veiculo)} removido.` });
});

/* ---- Leitor de QR Code: qualquer perfil logado pode mudar a localização ---- */
// O corpo pode trazer "chave" (placa ou chassi); "placa" e "chassi" também funcionam.
router.post('/veiculos/scan', auth(), async (req, res) => {
  const b = req.body || {};
  const chave = b.chave || b.placa || b.chassi;
  const nova = b.novaLocalizacao;
  if (!LOCALIZACOES.includes(nova)) throw new HttpError(400, 'Localização inválida.');

  const veiculo = await comTransacao(async (client) => {
    const atual = await buscarPorChave(client, chave, true);
    if (!atual) throw new HttpError(404, 'Veículo não encontrado.');
    const r = await client.query('UPDATE agendamentos SET localizacao = $1, atualizado_em = now() WHERE id = $2 RETURNING *', [nova, atual.id]);
    await registrarMovimentacao(client, r.rows[0], atual.localizacao, nova, req.usuario.username);
    return r.rows[0];
  });
  res.json({ sucesso: true, mensagem: `Veículo ${rotuloVeiculo(veiculo)} atualizado para: ${nova}`, veiculo: paraApi(veiculo) });
});

module.exports = router;
