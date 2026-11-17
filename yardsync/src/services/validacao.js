// Validação do corpo das requisições de veículo. Função pura (sem banco): fácil de testar.
const { LOCALIZACOES, STATUS } = require('../constants');
const { normalizarPlaca, placaValida } = require('../utils/placa');
const { normalizarChassi, chassiValido } = require('../utils/chassi');

const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATAHORA_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

// Só valida os campos que vieram no corpo. Devolve { v: colunas_do_banco, erro: texto }.
function validarVeiculo(b) {
  const v = {};
  const erros = [];

  const texto = (k, col, max) => {
    if (!(k in b)) return;
    const s = String(b[k] == null ? '' : b[k]).trim();
    if (s.length > max) erros.push(`${k} deve ter no máximo ${max} caracteres`);
    else v[col] = s || null;
  };
  const data = (k, col) => {
    if (!(k in b)) return;
    const s = String(b[k] == null ? '' : b[k]).trim();
    if (!s) v[col] = null;
    else if (!DATA_RE.test(s)) erros.push(`${k} deve estar no formato AAAA-MM-DD`);
    else v[col] = s;
  };

  // Placa e chassi são opcionais (um dos dois, pelo menos, é exigido por quem chama)
  if ('placa' in b) {
    const n = normalizarPlaca(b.placa);
    if (!n) v.placa = null;
    else if (!placaValida(n)) erros.push('placa inválida (exemplos: ABC1234 ou ABC1D23)');
    else v.placa = n;
  }
  if ('chassi' in b) {
    const n = normalizarChassi(b.chassi);
    if (!n) v.chassi = null;
    else if (!chassiValido(n)) erros.push('chassi inválido: use os 17 caracteres (sem as letras I, O e Q)');
    else v.chassi = n;
  }

  texto('cliente', 'cliente', 120);
  texto('obs', 'obs', 500);
  data('dataFaturamento', 'data_faturamento');
  data('previsaoEntrega', 'previsao_entrega');
  if ('dataAgendada' in b) {
    const s = String(b.dataAgendada == null ? '' : b.dataAgendada).trim();
    if (!s) v.data_agendada = null;
    else if (!DATAHORA_RE.test(s)) erros.push('dataAgendada deve estar no formato AAAA-MM-DD HH:MM');
    else v.data_agendada = s.replace('T', ' ');
  }
  if ('localizacao' in b) {
    if (!LOCALIZACOES.includes(b.localizacao)) erros.push('localização inválida');
    else v.localizacao = b.localizacao;
  }
  if ('statusProcesso' in b) {
    if (!STATUS.includes(b.statusProcesso)) erros.push('status inválido');
    else v.status_processo = b.statusProcesso;
  }
  return { v, erro: erros.join('; ') };
}

module.exports = { validarVeiculo };
