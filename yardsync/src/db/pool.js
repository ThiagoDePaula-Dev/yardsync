const { Pool, types } = require('pg');
const { config } = require('../config/env');

// O pg converte DATE/TIMESTAMP em objetos Date e isso "anda" um dia por causa do fuso.
// Mantemos como texto (AAAA-MM-DD / AAAA-MM-DD HH:MM:SS).
types.setTypeParser(1082, (v) => v);
types.setTypeParser(1114, (v) => v);

const local = /localhost|127\.0\.0\.1/.test(config.databaseUrl);
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: local || config.pgSsl === 'disable' ? false : { rejectUnauthorized: false },
});

// Executa várias consultas "tudo ou nada": se uma falhar, nenhuma vale.
async function comTransacao(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { pool, comTransacao };
