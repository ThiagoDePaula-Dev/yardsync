// Senhas e tokens. Sem dependências extras: só o módulo "crypto" do próprio Node.
const crypto = require('crypto');
const { config } = require('../config/env');

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(senha), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verificarSenha(senha, guardado) {
  const [tipo, salt, hash] = String(guardado || '').split('$');
  if (tipo !== 'scrypt' || !salt || !hash) return false;
  const calc = crypto.scryptSync(String(senha || ''), salt, 64);
  const orig = Buffer.from(hash, 'hex');
  return calc.length === orig.length && crypto.timingSafeEqual(calc, orig);
}

const b64 = (s) => Buffer.from(s).toString('base64url');
const assinar = (dados) => crypto.createHmac('sha256', config.authSecret).update(dados).digest('base64url');

function gerarToken(usuario) {
  const payload = b64(JSON.stringify({ id: usuario.id, exp: Date.now() + 12 * 60 * 60 * 1000 }));
  return `${payload}.${assinar(payload)}`;
}

// Devolve os dados do token, ou null se for inválido/adulterado/expirado.
function lerToken(token) {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig) return null;
  const esperado = assinar(payload);
  if (sig.length !== esperado.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperado))) return null;
  try {
    const dados = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return dados.exp > Date.now() ? dados : null;
  } catch {
    return null;
  }
}

module.exports = { hashSenha, verificarSenha, gerarToken, lerToken };
