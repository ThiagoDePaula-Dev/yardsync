// As variáveis precisam existir ANTES de carregar o código que as lê.
process.env.DATABASE_URL = 'postgres://teste:teste@localhost:5432/teste';
process.env.AUTH_SECRET = 'segredo-so-para-testes';

const test = require('node:test');
const assert = require('node:assert/strict');
const { hashSenha, verificarSenha, gerarToken, lerToken } = require('../src/services/auth.service');

test('a senha correta confere e a errada não', () => {
  const guardado = hashSenha('minha-senha-123');
  assert.equal(verificarSenha('minha-senha-123', guardado), true);
  assert.equal(verificarSenha('outra-senha', guardado), false);
});

test('o hash nunca guarda a senha em texto e muda a cada vez (sal)', () => {
  const a = hashSenha('igual');
  const b = hashSenha('igual');
  assert.ok(!a.includes('igual'));
  assert.notEqual(a, b);
});

test('verificarSenha recusa registros inválidos sem quebrar', () => {
  assert.equal(verificarSenha('x', null), false);
  assert.equal(verificarSenha('x', 'texto-solto'), false);
});

test('token válido devolve o id do usuário', () => {
  const token = gerarToken({ id: 42 });
  assert.equal(lerToken(token).id, 42);
});

test('token adulterado é recusado', () => {
  const token = gerarToken({ id: 42 });
  const [payload, assinatura] = token.split('.');
  const falso = Buffer.from(JSON.stringify({ id: 1, exp: Date.now() + 99999999 })).toString('base64url');
  assert.equal(lerToken(`${falso}.${assinatura}`), null);
  assert.equal(lerToken(`${payload}.assinatura-errada`), null);
  assert.equal(lerToken('lixo'), null);
});
