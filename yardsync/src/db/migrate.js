// Aplica as migrações pendentes, em ordem, cada uma "tudo ou nada".
// A tabela schema_migrations guarda quais já foram aplicadas.
const { pool } = require('./pool');
const migracoes = require('./migrations');

const LOCK_ID = 727274; // trava para duas instâncias não migrarem ao mesmo tempo

async function migrar() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        versao INTEGER PRIMARY KEY,
        nome TEXT NOT NULL,
        aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    const feitas = new Set((await client.query('SELECT versao FROM schema_migrations')).rows.map((r) => r.versao));

    for (const m of [...migracoes].sort((a, b) => a.versao - b.versao)) {
      if (feitas.has(m.versao)) continue;
      try {
        await client.query('BEGIN');
        await client.query(m.sql);
        await client.query('INSERT INTO schema_migrations (versao, nome) VALUES ($1, $2)', [m.versao, m.nome]);
        await client.query('COMMIT');
        console.log(`Migração ${String(m.versao).padStart(3, '0')} aplicada: ${m.nome}`);
      } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        throw new Error(`migração ${m.versao} (${m.nome}) falhou: ${e.message}`);
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    client.release();
  }
}

module.exports = { migrar };
