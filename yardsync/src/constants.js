// Valores fixos do negócio, num só lugar. Se um novo status surgir, muda só aqui.
const LOCALIZACOES = ['Pátio Loja', 'CD', 'Em Trânsito', 'Solicitado do CD'];
const STATUS = ['Pendente de Agendamento', 'Cliente Contactado', 'Agendado', 'Em Preparação', 'Entregue'];
const ROLES = ['operador', 'administrador', 'ti'];

module.exports = { LOCALIZACOES, STATUS, ROLES };
