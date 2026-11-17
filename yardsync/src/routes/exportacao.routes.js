// Exportação para o Excel (CSV). Aceita login normal OU a chave somente leitura da macro.
const crypto = require('crypto');
const { Router } = require('express');
const { pool } = require('../db/pool');
const { auth } = require('../middlewares/auth');
const { config } = require('../config/env');
const { brData, brDataHora, celulaCsv } = require('../utils/csv');
const { formatarPlaca } = require('../utils/placa');

const router = Router();

const cabecalho = ['Placa', 'Chassi', 'Cliente', 'Data de Faturamento', 'Previsão de Entrega', 'Data Agendada', 'Localização', 'Status', 'Observações', 'Atualizado em'];

function chaveExcelValida(req) {
  const enviada = req.headers['x-api-key'];
  if (!config.excelApiKey || !enviada) return false;
  const h = (s) => crypto.createHash('sha256').update(String(s)).digest();
  return crypto.timingSafeEqual(h(config.excelApiKey), h(enviada));
}

router.get(
  '/exportar.csv',
  (req, res, next) => (chaveExcelValida(req) ? next() : auth()(req, res, next)),
  async (req, res) => {
    const r = await pool.query('SELECT * FROM agendamentos ORDER BY placa NULLS LAST, chassi');
    const linhas = r.rows.map((x) =>
      [x.placa ? formatarPlaca(x.placa) : '', x.chassi, x.cliente, brData(x.data_faturamento), brData(x.previsao_entrega), brDataHora(x.data_agendada),
       x.localizacao, x.status_processo, x.obs, new Date(x.atualizado_em).toLocaleString('pt-BR', { timeZone: config.appTz })]
        .map(celulaCsv).join(';')
    );
    res.type('text/csv; charset=utf-8').send('\uFEFF' + [cabecalho.map(celulaCsv).join(';'), ...linhas].join('\r\n'));
  }
);

module.exports = router;
