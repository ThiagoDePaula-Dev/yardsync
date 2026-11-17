// Testes das funções puras. Rodar: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizarPlaca, placaValida, formatarPlaca } = require('../src/utils/placa');
const { normalizarChassi, chassiValido, identificar } = require('../src/utils/chassi');
const { somarDias, hojeISO } = require('../src/utils/datas');
const { celulaCsv, brData, brDataHora } = require('../src/utils/csv');

/* ---- Placa ---- */
test('normalizarPlaca tira hífen e espaços e põe em maiúsculas', () => {
  assert.equal(normalizarPlaca('abc-1234'), 'ABC1234');
  assert.equal(normalizarPlaca(' abc 1d23 '), 'ABC1D23');
  assert.equal(normalizarPlaca(null), '');
});

test('placaValida aceita o formato antigo e o Mercosul', () => {
  assert.equal(placaValida('ABC-1234'), true);
  assert.equal(placaValida('ABC1D23'), true);
});

test('placaValida recusa formatos errados', () => {
  assert.equal(placaValida('AB-1234'), false);
  assert.equal(placaValida('ABCD123'), false);
  assert.equal(placaValida(''), false);
});

test('formatarPlaca põe hífen no formato antigo', () => {
  assert.equal(formatarPlaca('ABC1234'), 'ABC-1234');
  assert.equal(formatarPlaca('abc-1234'), 'ABC-1234');
});

test('formatarPlaca mantém o Mercosul sem hífen', () => {
  assert.equal(formatarPlaca('ABC1D23'), 'ABC1D23');
  assert.equal(formatarPlaca('abc1d23'), 'ABC1D23');
});

test('formatarPlaca devolve como veio o que não é placa', () => {
  assert.equal(formatarPlaca('lixo'), 'lixo');
  assert.equal(formatarPlaca(null), '');
  assert.equal(formatarPlaca(undefined), '');
});

/* ---- Chassi ---- */
const VIN = '9BWZZZ377VT004251';

test('normalizarChassi tira espaços e hífens e põe em maiúsculas', () => {
  assert.equal(normalizarChassi('9bw zzz-377vt004251'), VIN);
  assert.equal(normalizarChassi(null), '');
});

test('chassiValido exige 17 caracteres sem I, O e Q', () => {
  assert.equal(chassiValido(VIN), true);
  assert.equal(chassiValido('9bwzzz377vt004251'), true);
  assert.equal(chassiValido('9BWZZZ377VT00425'), false);   // 16 caracteres
  assert.equal(chassiValido('9BWZZZ377VT0042511'), false); // 18 caracteres
  assert.equal(chassiValido('9BWZZZ377VT00425O'), false);  // letra O
  assert.equal(chassiValido(''), false);
});

test('identificar separa chassi (17 caracteres) de placa', () => {
  assert.deepEqual(identificar(VIN), { tipo: 'chassi', valor: VIN });
  assert.deepEqual(identificar('abc-1234'), { tipo: 'placa', valor: 'ABC1234' });
  assert.deepEqual(identificar('ABC1D23'), { tipo: 'placa', valor: 'ABC1D23' });
  assert.equal(identificar(''), null);
  assert.equal(identificar(null), null);
});

/* ---- Datas ---- */
test('somarDias soma dias corridos (SLA)', () => {
  assert.equal(somarDias('2026-11-06', 7), '2026-11-13');
});

test('somarDias atravessa mês, ano e ano bissexto', () => {
  assert.equal(somarDias('2026-12-28', 7), '2027-01-04');
  assert.equal(somarDias('2028-02-25', 5), '2028-03-01');
});

test('hojeISO devolve a data no formato AAAA-MM-DD', () => {
  assert.match(hojeISO('America/Fortaleza'), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(hojeISO(), /^\d{4}-\d{2}-\d{2}$/);
});

/* ---- CSV ---- */
test('brData e brDataHora formatam para o padrão brasileiro', () => {
  assert.equal(brData('2026-11-13'), '13/11/2026');
  assert.equal(brDataHora('2026-11-13 14:30:00'), '13/11/2026 14:30');
  assert.equal(brData(null), '');
});

test('celulaCsv protege aspas e fórmulas do Excel', () => {
  assert.equal(celulaCsv('João "Zé"'), '"João ""Zé"""');
  assert.equal(celulaCsv('=SOMA(A1)'), '"\'=SOMA(A1)"');
  assert.equal(celulaCsv(null), '""');
});
