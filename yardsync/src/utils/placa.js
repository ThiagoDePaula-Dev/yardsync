const PLACA_RE = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/; // ABC1234 (antiga) ou ABC1D23 (Mercosul)

// "abc-1234" -> "ABC1234"
const normalizarPlaca = (p) => String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const placaValida = (texto) => PLACA_RE.test(normalizarPlaca(texto));

// Formato para exibir: ABC1234 -> ABC-1234. Mercosul fica igual. Se não for placa, devolve como veio.
function formatarPlaca(texto) {
  const n = normalizarPlaca(texto);
  if (/^[A-Z]{3}\d{4}$/.test(n)) return n.slice(0, 3) + '-' + n.slice(3);
  if (PLACA_RE.test(n)) return n;
  return texto == null ? '' : String(texto);
}

module.exports = { normalizarPlaca, placaValida, formatarPlaca };
