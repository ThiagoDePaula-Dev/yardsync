// Último elo da cadeia: transforma qualquer erro em uma resposta JSON clara.
function rotaApiNaoEncontrada(req, res) {
  res.status(404).json({ sucesso: false, mensagem: 'Rota não encontrada.' });
}

function tratarErros(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = err.status || 500;
  let mensagem = err.message;
  if (err.type === 'entity.parse.failed') { status = 400; mensagem = 'JSON inválido.'; }
  else if (err.code === '23505') { status = 409; mensagem = 'Já existe um registro com esses dados (placa, chassi ou usuário repetido).'; }
  else if (err.code === '23514') { status = 400; mensagem = 'O veículo precisa ter placa ou chassi.'; }
  else if (['22007', '22008', '22P02'].includes(err.code)) { status = 400; mensagem = 'Data ou valor inválido.'; }
  else if (status >= 500) { console.error(err); mensagem = 'Erro interno do servidor.'; }
  res.status(status).json({ sucesso: false, mensagem });
}

module.exports = { rotaApiNaoEncontrada, tratarErros };
