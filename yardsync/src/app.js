// Monta o aplicativo Express (sem ligar o servidor). Separar "montar" de "ligar" permite testar.
const path = require('path');
const express = require('express');
const { redirecionarHttps, cabecalhosSeguranca } = require('./middlewares/seguranca');
const { rotaApiNaoEncontrada, tratarErros } = require('./middlewares/erros');
const rotas = require('./routes');

function createApp() {
  const app = express();
  app.set('trust proxy', 1); // Railway fica atrás de um proxy HTTPS
  app.disable('x-powered-by');

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use(redirecionarHttps);
  app.use(cabecalhosSeguranca);
  app.use(express.json({ limit: '100kb' }));

  // Servimos APENAS o index.html (nunca a pasta do projeto: exporia código e .env).
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

  app.use('/api', rotas);
  app.use('/api', rotaApiNaoEncontrada);
  app.use(tratarErros);
  return app;
}

module.exports = { createApp };
