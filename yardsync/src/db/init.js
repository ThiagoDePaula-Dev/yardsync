// Preparação do banco na partida:
// 1) guarda tabelas de versões muito antigas, 2) aplica as migrações, 3) cria o admin e dados de exemplo.
const crypto = require('crypto');
const { pool } = require('./pool');
const { migrar } = require('./migrate');
const { config } = require('../config/env');
const { hashSenha } = require('../services/auth.service');
const { somarDias, hojeISO } = require('../utils/datas');

async function colunasDe(tabela) {
  const r = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1`,
    [tabela]
  );
  return r.rows.map((x) => x.column_name);
}

// Se já existir uma tabela com o mesmo nome mas estrutura de uma versão ANTIGA do projeto,
// ela é RENOMEADA para <nome>_antiga_AAAAMMDD. Nada é apagado.
async function guardarTabelasAntigas() {
  const exigidas = {
    config: ['chave', 'valor'],
    usuarios: ['id', 'username', 'password_hash', 'role', 'criado_em'],
    agendamentos: ['id', 'placa', 'chassi', 'cliente', 'data_faturamento', 'previsao_entrega', 'data_agendada', 'localizacao', 'status_processo', 'obs', 'criado_em', 'atualizado_em'],
  };
  const sufixo = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let agendamentosAntigos = null;
  for (const [tabela, cols] of Object.entries(exigidas)) {
    const atuais = await colunasDe(tabela);
    if (!atuais.length || cols.every((c) => atuais.includes(c))) continue;
    const novoNome = `${tabela}_antiga_${sufixo}`;
    await pool.query(`ALTER TABLE ${tabela} RENAME TO ${novoNome}`);
    console.warn(`AVISO: a tabela "${tabela}" era de uma versão antiga e foi renomeada para "${novoNome}".`);
    if (tabela === 'agendamentos') agendamentosAntigos = { nome: novoNome, colunas: atuais };
  }
  return agendamentosAntigos;
}

// Copia os veículos da tabela antiga para a nova (só as colunas que existiam).
async function copiarAgendamentosAntigos(antigos) {
  try {
    const expr = {
      placa: `NULLIF(UPPER(REGEXP_REPLACE(placa, '[^A-Za-z0-9]', '', 'g')), '')`,
      chassi: `NULLIF(UPPER(REGEXP_REPLACE(chassi, '[^A-Za-z0-9]', '', 'g')), '')`,
      cliente: 'cliente',
      data_faturamento: `NULLIF(data_faturamento::text, '')::date`,
      previsao_entrega: `NULLIF(previsao_entrega::text, '')::date`,
      data_agendada: `NULLIF(data_agendada::text, '')::timestamp`,
      localizacao: `COALESCE(localizacao, 'CD')`,
      status_processo: `COALESCE(status_processo, 'Pendente de Agendamento')`,
      obs: 'obs',
    };
    const campos = Object.keys(expr).filter((c) => antigos.colunas.includes(c));
    if (!campos.includes('placa') && !campos.includes('chassi')) return;
    const r = await pool.query(
      `INSERT INTO agendamentos (${campos.join(', ')})
       SELECT ${campos.map((c) => expr[c]).join(', ')} FROM ${antigos.nome} t
       WHERE ${[campos.includes('placa') && `NULLIF(UPPER(REGEXP_REPLACE(t.placa, '[^A-Za-z0-9]', '', 'g')), '') IS NOT NULL`,
                campos.includes('chassi') && `NULLIF(UPPER(REGEXP_REPLACE(t.chassi, '[^A-Za-z0-9]', '', 'g')), '') IS NOT NULL`]
                .filter(Boolean).join(' OR ')}
       ON CONFLICT DO NOTHING`
    );
    console.log(`Migração: ${r.rowCount} veículo(s) copiado(s) de "${antigos.nome}".`);
  } catch (e) {
    console.warn(`AVISO: não foi possível copiar os veículos antigos (${e.message}). Eles continuam em "${antigos.nome}".`);
  }
}

async function initDB() {
  const agendamentosAntigos = await guardarTabelasAntigas();
  await migrar();
  if (agendamentosAntigos) await copiarAgendamentosAntigos(agendamentosAntigos);

  // Primeiro acesso: cria o usuário "admin" com perfil TI.
  const u = await pool.query('SELECT 1 FROM usuarios LIMIT 1');
  if (!u.rowCount) {
    const senha = config.adminPassword || crypto.randomBytes(9).toString('base64url');
    await pool.query(`INSERT INTO usuarios (username, password_hash, role) VALUES ('admin', $1, 'ti')`, [hashSenha(senha)]);
    console.log('============================================================');
    console.log(' Usuário inicial criado -> login: admin | perfil: ti');
    if (!config.adminPassword) console.log(` Senha gerada (aparece só agora): ${senha}`);
    console.log(' Troque a senha depois do primeiro acesso.');
    console.log('============================================================');
  }

  // Dados de exemplo (só em desenvolvimento): dois com placa e um só com chassi
  const v = await pool.query('SELECT 1 FROM agendamentos LIMIT 1');
  if (config.seedDemo && !v.rowCount) {
    const hoje = hojeISO(config.appTz);
    const exemplos = [
      ['ABC1234', '9BWZZZ377VT004251', 'João Silva', -3, 'Pátio Loja', 'Agendado'],
      ['XYZ9876', '8AJXXX581R1234567', 'Maria Souza', -1, 'CD', 'Pendente de Agendamento'],
      [null, 'LGXC16DG2R0123456', 'Carlos Lima (aguardando emplacamento)', 0, 'CD', 'Pendente de Agendamento'],
    ];
    for (const [placa, chassi, cliente, dif, loc, st] of exemplos) {
      const fat = somarDias(hoje, dif);
      await pool.query(
        `INSERT INTO agendamentos (placa, chassi, cliente, data_faturamento, previsao_entrega, localizacao, status_processo)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [placa, chassi, cliente, fat, somarDias(fat, 7), loc, st]
      );
    }
  }
}

module.exports = { initDB };
