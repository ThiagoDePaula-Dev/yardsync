// Ponto de entrada: prepara o banco e liga o servidor.
const { config } = require('./config/env');
const { initDB } = require('./db/init');
const { createApp } = require('./app');

initDB()
  .then(() => createApp().listen(config.port, '0.0.0.0', () => console.log(`Servidor YardSync rodando na porta ${config.port}`)))
  .catch((e) => {
    console.error('Falha ao iniciar o banco de dados:', e.message);
    process.exit(1);
  });
