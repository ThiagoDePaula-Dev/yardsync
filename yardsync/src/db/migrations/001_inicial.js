// Estrutura inicial. Usa IF NOT EXISTS: em bancos que já tinham estas tabelas, não muda nada.
module.exports = {
  versao: 1,
  nome: 'estrutura inicial',
  sql: `
    CREATE TABLE IF NOT EXISTS config (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operador',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS agendamentos (
      id SERIAL PRIMARY KEY,
      placa TEXT UNIQUE NOT NULL,
      chassi TEXT,
      cliente TEXT,
      data_faturamento DATE,
      previsao_entrega DATE,
      data_agendada TIMESTAMP,
      localizacao TEXT NOT NULL DEFAULT 'CD',
      status_processo TEXT NOT NULL DEFAULT 'Pendente de Agendamento',
      obs TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id SERIAL PRIMARY KEY,
      placa TEXT NOT NULL,
      de TEXT,
      para TEXT NOT NULL,
      usuario TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    INSERT INTO config (chave, valor) VALUES ('dias_apos_faturamento', '7') ON CONFLICT (chave) DO NOTHING;
  `,
};
