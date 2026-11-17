// Regras de negócio dos veículos. As rotas (HTTP) só chamam estas funções.
const { pool } = require('../db/pool');
const { identificar } = require('../utils/chassi');
const { formatarPlaca } = require('../utils/placa');

// Linha do banco (snake_case) -> resposta da API (camelCase)
const paraApi = (r) => ({
  id: r.id,
  placa: r.placa,
  chassi: r.chassi,
  cliente: r.cliente,
  dataFaturamento: r.data_faturamento,
  previsaoEntrega: r.previsao_entrega,
  dataEntrega: r.previsao_entrega, // mantido por compatibilidade com a primeira versão
  dataAgendada: r.data_agendada,
  localizacao: r.localizacao,
  statusProcesso: r.status_processo,
  obs: r.obs,
  atualizadoEm: r.atualizado_em,
});

// Como chamar o veículo em mensagens: placa formatada ou, se ainda não tem, o chassi.
const rotuloVeiculo = (r) => (r.placa ? formatarPlaca(r.placa) : `chassi ${r.chassi}`);

// Prazo (em dias) após o faturamento, configurado no painel de TI.
async function getSla(db = pool) {
  const r = await db.query(`SELECT valor FROM config WHERE chave = 'dias_apos_faturamento'`);
  const n = parseInt(r.rows[0] && r.rows[0].valor, 10);
  return Number.isFinite(n) ? n : 7;
}

// Acha o veículo pela placa OU pelo chassi (17 caracteres = chassi). Devolve a linha ou null.
async function buscarPorChave(db, chave, travar = false) {
  const id = identificar(chave);
  if (!id) return null;
  const coluna = id.tipo === 'chassi' ? 'chassi' : 'placa';
  const r = await db.query(`SELECT * FROM agendamentos WHERE ${coluna} = $1${travar ? ' FOR UPDATE' : ''}`, [id.valor]);
  return r.rows[0] || null;
}

// Grava no histórico quem moveu o veículo (só se a localização realmente mudou).
async function registrarMovimentacao(client, veiculo, de, para, usuario) {
  if (de === para) return;
  await client.query(
    'INSERT INTO movimentacoes (veiculo_id, placa, de, para, usuario) VALUES ($1,$2,$3,$4,$5)',
    [veiculo.id, veiculo.placa, de, para, usuario]
  );
}

module.exports = { paraApi, rotuloVeiculo, getSla, buscarPorChave, registrarMovimentacao };
