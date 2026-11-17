// Permite cadastrar veículo só pelo chassi (placa opcional, ex.: carro em emplacamento).
module.exports = {
  versao: 2,
  nome: 'chassi único e placa opcional',
  sql: `
    -- 1) A placa deixa de ser obrigatória (vários veículos podem ficar sem placa)
    ALTER TABLE agendamentos ALTER COLUMN placa DROP NOT NULL;

    -- 2) Padroniza os chassis já gravados (maiúsculas, sem espaços/hífens)
    UPDATE agendamentos SET chassi = NULLIF(UPPER(REGEXP_REPLACE(chassi, '[^A-Za-z0-9]', '', 'g')), '');

    -- 3) Chassi único. Se já houver chassis repetidos, o índice não é criado (aviso) e a migração continua.
    DO $$ BEGIN
      CREATE UNIQUE INDEX IF NOT EXISTS ux_agendamentos_chassi ON agendamentos (chassi) WHERE chassi IS NOT NULL;
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE 'Chassis repetidos: índice único não criado. Corrija os repetidos e crie depois.';
    END $$;

    -- 4) Todo veículo precisa de placa OU chassi
    ALTER TABLE agendamentos ADD CONSTRAINT ck_agendamentos_identificacao CHECK (placa IS NOT NULL OR chassi IS NOT NULL);

    -- 5) O histórico passa a apontar para o veículo (id), não para a placa, porque a placa pode mudar
    ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS veiculo_id INTEGER REFERENCES agendamentos(id) ON DELETE CASCADE;
    UPDATE movimentacoes m SET veiculo_id = a.id FROM agendamentos a WHERE a.placa = m.placa AND m.veiculo_id IS NULL;
    ALTER TABLE movimentacoes ALTER COLUMN placa DROP NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_mov_veiculo ON movimentacoes (veiculo_id, criado_em DESC);
  `,
};
