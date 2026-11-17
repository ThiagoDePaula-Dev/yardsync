// Chassi = VIN: 17 caracteres, letras e números, sem as letras I, O e Q.
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

// "9bw zzz-377vt004251" -> "9BWZZZ377VT004251"
const normalizarChassi = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const chassiValido = (texto) => VIN_RE.test(normalizarChassi(texto));

// Descobre se o texto é um chassi (17 caracteres) ou uma placa (o resto).
// Devolve { tipo: 'chassi' | 'placa', valor } ou null se vier vazio.
function identificar(texto) {
  const valor = normalizarChassi(texto);
  if (!valor) return null;
  return { tipo: valor.length === 17 ? 'chassi' : 'placa', valor };
}

module.exports = { VIN_RE, normalizarChassi, chassiValido, identificar };
