// Funções puras (sem banco, sem internet): fáceis de testar.
function somarDias(iso, dias) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// Data de "hoje" (AAAA-MM-DD) no fuso informado, não no fuso do servidor.
function hojeISO(timeZone = 'America/Sao_Paulo') {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

module.exports = { somarDias, hojeISO };
