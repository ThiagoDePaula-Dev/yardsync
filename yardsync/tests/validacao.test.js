const test = require('node:test');
const assert = require('node:assert/strict');
const { validarVeiculo } = require('../src/services/validacao');

const VIN = '9BWZZZ377VT004251';

test('aceita cadastro só com chassi (carro sem placa)', () => {
  const { v, erro } = validarVeiculo({ chassi: 'lgxc16dg2r0123456', cliente: 'Ana' });
  assert.equal(erro, '');
  assert.equal(v.chassi, 'LGXC16DG2R0123456');
  assert.equal(v.cliente, 'Ana');
  assert.ok(!('placa' in v)); // não veio no corpo: não entra
});

test('aceita só placa e normaliza', () => {
  const { v, erro } = validarVeiculo({ placa: 'abc-1234' });
  assert.equal(erro, '');
  assert.equal(v.placa, 'ABC1234');
});

test('placa e chassi vazios viram null (para poder limpar o campo)', () => {
  const { v, erro } = validarVeiculo({ placa: '', chassi: '  ' });
  assert.equal(erro, '');
  assert.equal(v.placa, null);
  assert.equal(v.chassi, null);
});

test('recusa placa e chassi inválidos com mensagem clara', () => {
  const placa = validarVeiculo({ placa: 'AB123' });
  assert.match(placa.erro, /placa inválida/);
  const chassi = validarVeiculo({ chassi: '9BWZZZ377VT00425O' });
  assert.match(chassi.erro, /chassi inválido/);
});

test('valida datas, localização e status', () => {
  assert.match(validarVeiculo({ dataFaturamento: '13/11/2026' }).erro, /AAAA-MM-DD/);
  assert.match(validarVeiculo({ localizacao: 'Lua' }).erro, /localização inválida/);
  assert.match(validarVeiculo({ statusProcesso: 'Quase' }).erro, /status inválido/);
  const ok = validarVeiculo({ dataFaturamento: '2026-11-13', localizacao: 'CD', statusProcesso: 'Agendado', dataAgendada: '2026-11-20T14:30' });
  assert.equal(ok.erro, '');
  assert.equal(ok.v.data_agendada, '2026-11-20 14:30');
});

test('limita o tamanho dos textos', () => {
  assert.match(validarVeiculo({ cliente: 'x'.repeat(121) }).erro, /cliente/);
  assert.match(validarVeiculo({ obs: 'x'.repeat(501) }).erro, /obs/);
});

test('acumula vários erros de uma vez', () => {
  const { erro } = validarVeiculo({ placa: 'x', chassi: 'y', localizacao: 'z' });
  assert.equal(erro.split('; ').length, 3);
});

test('chassi sem espaços: aceita o mesmo VIN com separadores', () => {
  assert.equal(validarVeiculo({ chassi: '9BW ZZZ-377 VT004251' }).v.chassi, VIN);
});
