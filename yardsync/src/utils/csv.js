const brData = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '');
const brDataHora = (s) => (s ? brData(s) + ' ' + s.slice(11, 16) : '');

// Protege o campo para CSV e evita que o Excel trate texto como fórmula (=, +, -, @)
function celulaCsv(x) {
  let s = x == null ? '' : String(x);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

module.exports = { brData, brDataHora, celulaCsv };
