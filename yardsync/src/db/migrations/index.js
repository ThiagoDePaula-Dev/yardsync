// Lista das migrações, em ordem. Para mudar o banco: crie um arquivo novo (003_...) e registre aqui.
// NUNCA edite uma migração que já foi aplicada em produção.
module.exports = [
  require('./001_inicial'),
  require('./002_chassi_e_placa_opcional'),
];
