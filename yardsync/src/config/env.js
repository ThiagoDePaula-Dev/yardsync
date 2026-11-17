// Lê e valida as variáveis de ambiente UMA vez, na partida.
// Se faltar algo essencial, o servidor avisa e para, em vez de falhar no meio do uso.
const crypto = require('crypto');

const isProd = process.env.NODE_ENV === 'production';

function exigir(nome) {
  const valor = process.env[nome];
  if (!valor) {
    console.error(`ERRO: defina a variável ${nome} (veja o arquivo .env.example).`);
    process.exit(1);
  }
  return valor;
}

function lerAuthSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (isProd) {
    console.error('ERRO: defina AUTH_SECRET em produção.');
    process.exit(1);
  }
  console.warn('AVISO: AUTH_SECRET não definido. Usando um segredo temporário (logins caem ao reiniciar).');
  return crypto.randomBytes(32).toString('hex');
}

const config = {
  isProd,
  port: process.env.PORT || 3000,
  appTz: process.env.APP_TZ || 'America/Sao_Paulo',
  databaseUrl: exigir('DATABASE_URL'),
  authSecret: lerAuthSecret(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  excelApiKey: process.env.EXCEL_API_KEY || '',
  pgSsl: process.env.PGSSL || '',
  // Dados de exemplo: nunca em produção, a menos que SEED_DEMO=true
  seedDemo: process.env.SEED_DEMO === 'true' || (!isProd && process.env.SEED_DEMO !== 'false'),
};

module.exports = { config };
