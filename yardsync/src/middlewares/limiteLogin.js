// Limita tentativas de login erradas por IP (8 erros = 15 minutos de espera).
const { HttpError } = require('../utils/errors');

const MAX_FALHAS = 8;
const JANELA_MS = 15 * 60 * 1000;
const falhas = new Map(); // ip -> { n, ate }

function verificar(ip) {
  const f = falhas.get(ip);
  if (f && f.ate > Date.now() && f.n >= MAX_FALHAS) {
    throw new HttpError(429, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.');
  }
}

function registrarFalha(ip) {
  const agora = Date.now();
  const f = falhas.get(ip);
  falhas.set(ip, { n: (f && f.ate > agora ? f.n : 0) + 1, ate: agora + JANELA_MS });
}

function limpar(ip) {
  falhas.delete(ip);
}

module.exports = { verificar, registrarFalha, limpar };
